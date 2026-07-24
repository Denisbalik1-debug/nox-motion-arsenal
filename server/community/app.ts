import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { ImprovementPackage, SubmissionStatus } from '../../src/motion-arsenal/community/types';
import { validateImprovementPackage } from '../../src/motion-arsenal/community/validation/validatePackage';
import { readServerFeatureFlags, readSubmissionLimits, type ServerFeatureFlags } from './config';
import { CommunityStoreError } from './sqliteStore';
import type { CommunityStore, ManifestRegistry } from './types';
import { reviewImprovementPackage } from './staticReview';
import { compileStaticPreview } from './sandbox/localCompiler';

export type CommunityRequest = {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  ip: string;
  body: string;
};

export type CommunityResponse = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

const VALID_REVIEW_STATUSES = new Set<SubmissionStatus>(['needs_changes', 'approved', 'rejected', 'implementation_ready']);

function json(status: number, body: unknown): CommunityResponse {
  return {
    status,
    body,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  };
}

function parseJson(body: string): unknown {
  return JSON.parse(body);
}

function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function bearer(headers: Record<string, string | undefined>): string | undefined {
  const value = headers.authorization;
  return value?.startsWith('Bearer ') ? value.slice('Bearer '.length).trim() : undefined;
}

function hourAgo(now: Date): string {
  return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
}

function sameOrigin(request: CommunityRequest): boolean {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isLoopback(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

export function createCommunityApp(input: {
  store: CommunityStore;
  registry: ManifestRegistry;
  environment?: NodeJS.ProcessEnv;
  flags?: ServerFeatureFlags;
  previewOrigin?: string;
}) {
  const limits = readSubmissionLimits(input.environment);
  const flags = input.flags ?? readServerFeatureFlags(input.environment);
  const ipSalt = input.environment?.COMMUNITY_IP_HASH_SECRET
    ?? (input.environment?.VERCEL ? '' : 'local-development-only-not-for-production');

  input.store.syncManifests(input.registry);

  const actorHash = (ip: string) => hashSecret(`${ipSalt}:${ip}`);
  const requireAdmin = (request: CommunityRequest): CommunityResponse | undefined => {
    if (!flags.admin) return json(404, { code: 'FEATURE_DISABLED' });
    if (!isLoopback(request.ip) || request.headers['x-nox-local-admin'] !== '1') {
      return json(403, { code: 'ADMIN_DISABLED', message: 'Local development guard required.' });
    }
    return undefined;
  };

  return {
    limits,
    flags,
    async handle(request: CommunityRequest): Promise<CommunityResponse> {
      if (!sameOrigin(request)) return json(403, { code: 'ORIGIN_REJECTED' });
      if (new TextEncoder().encode(request.body).byteLength > limits.maxRequestBytes) {
        return json(413, { code: 'REQUEST_TOO_LARGE', maxBytes: limits.maxRequestBytes });
      }
      const now = new Date();
      const nowIso = now.toISOString();
      const ipHash = actorHash(request.ip);

      if (request.method === 'POST' && request.path === '/api/community/tokens/create') {
        if (!flags.tokenSubmissions) return json(404, { code: 'FEATURE_DISABLED' });
        if (!ipSalt) return json(503, { code: 'IP_HASH_SECRET_REQUIRED' });
        if (input.store.countRecentEvents('token_created', ipHash, hourAgo(now)) >= 5) {
          return json(429, { code: 'TOKEN_RATE_LIMIT' });
        }
        let target: { effectId?: string; baseVersion?: string; manifestHash?: string };
        try {
          target = parseJson(request.body) as typeof target;
        } catch {
          return json(400, { code: 'JSON_INVALID' });
        }
        const record = target.effectId ? input.registry.get(target.effectId) : undefined;
        if (!record) return json(400, { code: 'EFFECT_NOT_FOUND' });
        if (target.baseVersion !== record.manifest.version) return json(409, { code: 'BASE_VERSION_MISMATCH' });
        if (target.manifestHash !== record.manifest.manifestHash) return json(409, { code: 'MANIFEST_HASH_MISMATCH' });
        if (input.store.countActiveTokens(record.manifest.id, ipHash, nowIso) >= 3) {
          return json(429, { code: 'ACTIVE_TOKEN_LIMIT' });
        }
        const token = `nox_sub_${randomBytes(32).toString('base64url')}`;
        const id = randomUUID();
        const expiresAt = new Date(now.getTime() + limits.tokenTtlMinutes * 60_000).toISOString();
        input.store.createToken({
          id,
          tokenHash: hashSecret(token),
          effectId: record.manifest.id,
          baseVersion: record.manifest.version,
          manifestHash: record.manifest.manifestHash,
          status: 'active',
          expiresAt,
          attemptCount: 0,
          maxAttempts: limits.maxTokenAttempts,
          createdAt: nowIso,
          createdByIpHash: ipHash,
        });
        input.store.writeAudit({
          eventType: 'token_created',
          actorType: 'local_user',
          actorIdHash: ipHash,
          effectId: record.manifest.id,
          tokenId: id,
          metadata: { expiresAt },
          createdAt: nowIso,
        });
        return json(201, {
          token,
          expiresAt,
          ttlMinutes: limits.tokenTtlMinutes,
          effectId: record.manifest.id,
          baseVersion: record.manifest.version,
          manifestHash: record.manifest.manifestHash,
        });
      }

      if (request.method === 'POST' && request.path === '/api/community/tokens/revoke') {
        if (!flags.tokenSubmissions) return json(404, { code: 'FEATURE_DISABLED' });
        let token: string | undefined;
        try {
          token = (parseJson(request.body) as { token?: string }).token;
        } catch {
          return json(400, { code: 'JSON_INVALID' });
        }
        if (!token || !input.store.revokeToken(hashSecret(token), nowIso)) {
          return json(410, { code: 'TOKEN_NOT_ACTIVE' });
        }
        return json(200, { status: 'revoked', revokedAt: nowIso });
      }

      if (request.method === 'POST' && request.path === '/api/community/submissions') {
        if (!flags.tokenSubmissions) return json(404, { code: 'FEATURE_DISABLED' });
        if (input.store.countRecentEvents('submission_attempt', ipHash, hourAgo(now)) >= 10) {
          return json(429, { code: 'SUBMISSION_RATE_LIMIT' });
        }
        const clearToken = bearer(request.headers);
        if (!clearToken) return json(401, { code: 'TOKEN_REQUIRED' });
        const tokenHash = hashSecret(clearToken);
        const token = input.store.getTokenByHash(tokenHash);
        if (!token) return json(401, { code: 'TOKEN_INVALID' });
        if (token.status === 'consumed') {
          // Idempotent retries are resolved by the atomic storage operation after parsing.
        } else if (token.status !== 'active') {
          return json(410, { code: `TOKEN_${token.status.toUpperCase()}` });
        }
        input.store.writeAudit({
          eventType: 'submission_attempt',
          actorType: 'submission_token',
          actorIdHash: ipHash,
          effectId: token.effectId,
          tokenId: token.id,
          createdAt: nowIso,
        });

        const record = input.registry.get(token.effectId);
        if (!record) return json(409, { code: 'MANIFEST_NOT_FOUND' });
        const validation = await validateImprovementPackage(request.body, record.manifest, record.sources, limits);
        if (!validation.ok || !validation.package) {
          const updated = input.store.recordFailedAttempt(tokenHash, nowIso, validation.findings[0]?.code ?? 'VALIDATION_FAILED');
          return json(400, {
            code: updated?.status === 'blocked' ? 'TOKEN_BLOCKED' : 'VALIDATION_FAILED',
            attemptsRemaining: updated ? Math.max(0, updated.maxAttempts - updated.attemptCount) : 0,
            findings: validation.findings,
          });
        }
        const pkg = validation.package;
        if (
          pkg.target.effectId !== token.effectId
          || pkg.target.baseVersion !== token.baseVersion
          || pkg.target.manifestHash !== token.manifestHash
        ) {
          input.store.recordFailedAttempt(tokenHash, nowIso, 'TOKEN_SCOPE_MISMATCH');
          return json(409, { code: 'TOKEN_SCOPE_MISMATCH' });
        }
        const idempotencyKey = request.headers['idempotency-key']?.slice(0, 200)
          ?? `package-${hashSecret(request.body).slice(0, 32)}`;
        try {
          const result = input.store.consumeTokenAndCreateSubmission({
            tokenHash,
            submissionId: randomUUID(),
            packageHash: hashSecret(request.body),
            idempotencyKey,
            pkg,
            validation,
            now: nowIso,
          });
          return json(result.created ? 201 : 200, {
            submissionId: result.submissionId,
            status: 'submitted',
            idempotentReplay: !result.created,
          });
        } catch (error) {
          if (error instanceof CommunityStoreError) {
            const status = error.code === 'TOKEN_CONSUMED' || error.code === 'TOKEN_RACE' ? 409 : 410;
            return json(status, { code: error.code });
          }
          throw error;
        }
      }

      if (request.method === 'GET' && request.path === '/api/community/admin/submissions') {
        const guard = requireAdmin(request);
        if (guard) return guard;
        return json(200, { submissions: input.store.listSubmissions() });
      }

      const statusMatch = request.path.match(/^\/api\/community\/admin\/submissions\/([^/]+)\/status$/);
      if (request.method === 'POST' && statusMatch) {
        const guard = requireAdmin(request);
        if (guard) return guard;
        let body: { status?: SubmissionStatus; note?: string };
        try {
          body = parseJson(request.body) as typeof body;
        } catch {
          return json(400, { code: 'JSON_INVALID' });
        }
        if (!body.status || !VALID_REVIEW_STATUSES.has(body.status)) return json(400, { code: 'STATUS_INVALID' });
        if (!input.store.updateSubmissionStatus(statusMatch[1], body.status, body.note ?? '', nowIso)) {
          return json(404, { code: 'SUBMISSION_NOT_FOUND' });
        }
        return json(200, { submissionId: statusMatch[1], status: body.status });
      }

      const reviewMatch = request.path.match(/^\/api\/community\/admin\/submissions\/([^/]+)\/review$/);
      if (request.method === 'POST' && reviewMatch) {
        const guard = requireAdmin(request);
        if (guard) return guard;
        if (!flags.agentReview) return json(404, { code: 'FEATURE_DISABLED' });
        const submission = input.store.getSubmission(reviewMatch[1]);
        if (!submission) return json(404, { code: 'SUBMISSION_NOT_FOUND' });
        const record = input.registry.get(submission.effectId);
        const review = reviewImprovementPackage(submission.package, record?.manifest);
        input.store.saveReview(submission.id, review, nowIso);
        input.store.writeAudit({
          eventType: 'deterministic_review_created',
          actorType: 'local_admin',
          submissionId: submission.id,
          effectId: submission.effectId,
          metadata: { decision: review.decision, totalScore: review.totalScore },
          createdAt: nowIso,
        });
        return json(200, { submissionId: submission.id, review });
      }

      const compileMatch = request.path.match(/^\/api\/community\/admin\/submissions\/([^/]+)\/compile$/);
      if (request.method === 'POST' && compileMatch) {
        const guard = requireAdmin(request);
        if (guard) return guard;
        if (!flags.isolatedPreview) return json(404, { code: 'FEATURE_DISABLED' });
        if (!input.previewOrigin) return json(503, { code: 'PREVIEW_ORIGIN_UNAVAILABLE' });
        const submission = input.store.getSubmission(compileMatch[1]);
        if (!submission) return json(404, { code: 'SUBMISSION_NOT_FOUND' });
        const record = input.registry.get(submission.effectId);
        if (!record) return json(409, { code: 'MANIFEST_NOT_FOUND' });
        const review = reviewImprovementPackage(submission.package, record.manifest);
        if (review.securityFindings.length || review.decision === 'manual_security_review') {
          return json(409, { code: 'SECURITY_REVIEW_REQUIRED', review });
        }
        try {
          const artifact = await compileStaticPreview({
            submissionId: submission.id,
            manifest: record.manifest,
            sources: record.sources,
            pkg: submission.package,
            previewOrigin: input.previewOrigin,
            adminOrigin: request.headers.origin ?? `http://${request.headers.host}`,
          });
          input.store.savePreviewArtifact(artifact);
          input.store.writeAudit({
            eventType: 'preview_artifact_created',
            actorType: 'local_admin',
            submissionId: submission.id,
            effectId: submission.effectId,
            metadata: { artifactId: artifact.id, contentHash: artifact.contentHash },
            createdAt: nowIso,
          });
          return json(201, { artifact });
        } catch (error) {
          return json(422, {
            code: 'COMPILER_FAILED',
            message: error instanceof Error ? error.message.slice(0, 4_000) : 'Unknown compiler failure',
          });
        }
      }

      return json(404, { code: 'NOT_FOUND' });
    },
  };
}
