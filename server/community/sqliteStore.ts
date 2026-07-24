import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  AgentReview,
  ImprovementPackage,
  PackageValidationResult,
  SubmissionStatus,
  SubmissionTokenRecord,
} from '../../src/motion-arsenal/community/types';
import type { CommunityStore, ManifestRegistry, PreviewArtifact, StoredSubmission } from './types';

type SqlRow = Record<string, string | number | null>;

export class CommunityStoreError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function tokenFromRow(row: SqlRow | undefined): SubmissionTokenRecord | undefined {
  if (!row) return undefined;
  return {
    id: String(row.id),
    tokenHash: String(row.token_hash),
    effectId: String(row.effect_id),
    baseVersion: String(row.base_version),
    manifestHash: String(row.manifest_hash),
    status: String(row.status) as SubmissionTokenRecord['status'],
    expiresAt: String(row.expires_at),
    consumedAt: row.consumed_at ? String(row.consumed_at) : undefined,
    revokedAt: row.revoked_at ? String(row.revoked_at) : undefined,
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    createdAt: String(row.created_at),
    lastAttemptAt: row.last_attempt_at ? String(row.last_attempt_at) : undefined,
    blockedAt: row.blocked_at ? String(row.blocked_at) : undefined,
    blockReason: row.block_reason ? String(row.block_reason) : undefined,
    submissionId: row.submission_id ? String(row.submission_id) : undefined,
  };
}

function submissionFromRow(row: SqlRow, review?: AgentReview): StoredSubmission {
  return {
    id: String(row.id),
    effectId: String(row.effect_id),
    baseVersion: String(row.base_version),
    manifestHash: String(row.manifest_hash),
    status: String(row.status) as SubmissionStatus,
    packageHash: String(row.package_hash),
    package: JSON.parse(String(row.package_json)) as ImprovementPackage,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    review,
  };
}

export class SqliteCommunityStore implements CommunityStore {
  readonly database: DatabaseSync;

  constructor(databasePath = resolve(process.cwd(), '.community-data/community.sqlite')) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
      allowExtension: false,
      timeout: 5_000,
    });
    this.database.exec(readFileSync(new URL('./migrations/001_initial.sql', import.meta.url), 'utf8'));
  }

  syncManifests(records: ManifestRegistry): void {
    const now = new Date().toISOString();
    const upsertEffect = this.database.prepare(`
      INSERT INTO effects(id, display_name, category, current_version, current_manifest_hash, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        category = excluded.category,
        current_version = excluded.current_version,
        current_manifest_hash = excluded.current_manifest_hash,
        updated_at = excluded.updated_at
    `);
    const upsertVersion = this.database.prepare(`
      INSERT INTO effect_versions(effect_id, version, manifest_hash, manifest_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(effect_id, version) DO UPDATE SET
        manifest_hash = excluded.manifest_hash,
        manifest_json = excluded.manifest_json
    `);
    this.database.exec('BEGIN IMMEDIATE');
    try {
      for (const { manifest } of records.values()) {
        upsertEffect.run(
          manifest.id,
          manifest.displayName,
          manifest.category,
          manifest.version,
          manifest.manifestHash,
          manifest.updatedAt,
        );
        upsertVersion.run(manifest.id, manifest.version, manifest.manifestHash, JSON.stringify(manifest), now);
      }
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  createToken(record: SubmissionTokenRecord & { createdByIpHash: string }): void {
    this.database.prepare(`
      INSERT INTO submission_tokens(
        id, token_hash, effect_id, base_version, manifest_hash, status, expires_at,
        attempt_count, max_attempts, created_at, created_by_ip_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.tokenHash,
      record.effectId,
      record.baseVersion,
      record.manifestHash,
      record.status,
      record.expiresAt,
      record.attemptCount,
      record.maxAttempts,
      record.createdAt,
      record.createdByIpHash,
    );
  }

  getTokenByHash(tokenHash: string): SubmissionTokenRecord | undefined {
    const now = new Date().toISOString();
    this.database.prepare(`
      UPDATE submission_tokens
      SET status = 'expired'
      WHERE token_hash = ? AND status = 'active' AND expires_at <= ?
    `).run(tokenHash, now);
    const row = this.database.prepare('SELECT * FROM submission_tokens WHERE token_hash = ?').get(tokenHash) as SqlRow | undefined;
    return tokenFromRow(row);
  }

  revokeToken(tokenHash: string, at: string): boolean {
    const result = this.database.prepare(`
      UPDATE submission_tokens
      SET status = 'revoked', revoked_at = ?
      WHERE token_hash = ? AND status = 'active'
    `).run(at, tokenHash);
    return Number(result.changes) === 1;
  }

  countRecentEvents(eventType: string, actorIdHash: string, since: string): number {
    const row = this.database.prepare(`
      SELECT COUNT(*) AS count FROM audit_events
      WHERE event_type = ? AND actor_id_hash = ? AND created_at >= ?
    `).get(eventType, actorIdHash, since) as SqlRow;
    return Number(row.count);
  }

  countActiveTokens(effectId: string, actorIdHash: string, now: string): number {
    const row = this.database.prepare(`
      SELECT COUNT(*) AS count FROM submission_tokens
      WHERE effect_id = ? AND created_by_ip_hash = ? AND status = 'active' AND expires_at > ?
    `).get(effectId, actorIdHash, now) as SqlRow;
    return Number(row.count);
  }

  writeAudit(event: {
    eventType: string;
    actorType: string;
    actorIdHash?: string;
    effectId?: string;
    submissionId?: string;
    tokenId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }): void {
    this.database.prepare(`
      INSERT INTO audit_events(
        id, event_type, actor_type, actor_id_hash, effect_id, submission_id, token_id, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      event.eventType,
      event.actorType,
      event.actorIdHash ?? null,
      event.effectId ?? null,
      event.submissionId ?? null,
      event.tokenId ?? null,
      JSON.stringify(event.metadata ?? {}),
      event.createdAt,
    );
  }

  recordFailedAttempt(tokenHash: string, now: string, reason: string): SubmissionTokenRecord | undefined {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const row = this.database.prepare('SELECT * FROM submission_tokens WHERE token_hash = ?').get(tokenHash) as SqlRow | undefined;
      const token = tokenFromRow(row);
      if (!token || token.status !== 'active') {
        this.database.exec('COMMIT');
        return token;
      }
      const nextAttempts = token.attemptCount + 1;
      const blocked = nextAttempts >= token.maxAttempts;
      this.database.prepare(`
        UPDATE submission_tokens
        SET attempt_count = ?, last_attempt_at = ?, status = ?, blocked_at = ?, block_reason = ?
        WHERE id = ? AND status = 'active'
      `).run(nextAttempts, now, blocked ? 'blocked' : 'active', blocked ? now : null, blocked ? reason : null, token.id);
      this.database.exec('COMMIT');
      return this.getTokenByHash(tokenHash);
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  consumeTokenAndCreateSubmission(input: {
    tokenHash: string;
    submissionId: string;
    packageHash: string;
    idempotencyKey: string;
    pkg: ImprovementPackage;
    validation: PackageValidationResult;
    now: string;
  }): { created: boolean; submissionId: string } {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const row = this.database.prepare('SELECT * FROM submission_tokens WHERE token_hash = ?').get(input.tokenHash) as SqlRow | undefined;
      const token = tokenFromRow(row);
      if (!token) throw new CommunityStoreError('TOKEN_INVALID', 'Token not found.');
      if (token.status === 'consumed') {
        const existing = this.database.prepare(`
          SELECT id FROM submissions WHERE token_id = ? AND (idempotency_key = ? OR package_hash = ?) LIMIT 1
        `).get(token.id, input.idempotencyKey, input.packageHash) as SqlRow | undefined;
        if (existing) {
          this.database.exec('COMMIT');
          return { created: false, submissionId: String(existing.id) };
        }
        throw new CommunityStoreError('TOKEN_CONSUMED', 'Token was already consumed.');
      }
      if (token.status !== 'active') throw new CommunityStoreError(`TOKEN_${token.status.toUpperCase()}`, `Token is ${token.status}.`);
      if (token.expiresAt <= input.now) throw new CommunityStoreError('TOKEN_EXPIRED', 'Token has expired.');
      if (token.attemptCount >= token.maxAttempts) throw new CommunityStoreError('TOKEN_BLOCKED', 'Token attempt limit reached.');

      this.database.prepare(`
        INSERT INTO submissions(
          id, effect_id, base_version, manifest_hash, token_id, status, package_hash, package_json,
          idempotency_key, author_display_name, author_contact, author_anonymous, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.submissionId,
        input.pkg.target.effectId,
        input.pkg.target.baseVersion,
        input.pkg.target.manifestHash,
        token.id,
        input.packageHash,
        JSON.stringify(input.pkg),
        input.idempotencyKey,
        input.pkg.author.displayName ?? null,
        input.pkg.author.contact ?? null,
        input.pkg.author.anonymous ? 1 : 0,
        input.now,
        input.now,
      );

      const insertFile = this.database.prepare(`
        INSERT INTO submission_files(
          submission_id, path, operation, language, content, previous_sha256, content_sha256
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const file of input.pkg.files) {
        insertFile.run(
          input.submissionId,
          file.path,
          file.operation,
          file.language,
          file.content ?? null,
          file.previousSha256 ?? null,
          file.contentSha256,
        );
      }

      this.database.prepare(`
        INSERT INTO validation_runs(id, submission_id, valid, findings_json, metrics_json, created_at)
        VALUES (?, ?, 1, ?, ?, ?)
      `).run(
        randomUUID(),
        input.submissionId,
        JSON.stringify(input.validation.findings),
        JSON.stringify(input.validation.metrics),
        input.now,
      );
      const consumed = this.database.prepare(`
        UPDATE submission_tokens SET status = 'consumed', consumed_at = ?, submission_id = ?
        WHERE id = ? AND status = 'active' AND submission_id IS NULL
      `).run(input.now, input.submissionId, token.id);
      if (Number(consumed.changes) !== 1) throw new CommunityStoreError('TOKEN_RACE', 'Token was consumed concurrently.');

      this.writeAudit({
        eventType: 'submission_created',
        actorType: 'submission_token',
        effectId: input.pkg.target.effectId,
        submissionId: input.submissionId,
        tokenId: token.id,
        metadata: { packageHash: input.packageHash },
        createdAt: input.now,
      });
      this.database.exec('COMMIT');
      return { created: true, submissionId: input.submissionId };
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  listSubmissions(): StoredSubmission[] {
    const rows = this.database.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all() as SqlRow[];
    return rows.map((row) => this.attachReview(submissionFromRow(row)));
  }

  getSubmission(id: string): StoredSubmission | undefined {
    const row = this.database.prepare('SELECT * FROM submissions WHERE id = ?').get(id) as SqlRow | undefined;
    return row ? this.attachReview(submissionFromRow(row)) : undefined;
  }

  updateSubmissionStatus(id: string, status: SubmissionStatus, note: string, now: string): boolean {
    const result = this.database.prepare('UPDATE submissions SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    if (Number(result.changes) !== 1) return false;
    this.writeAudit({
      eventType: 'submission_status_changed',
      actorType: 'local_admin',
      submissionId: id,
      metadata: { status, note: note.slice(0, 2_000) },
      createdAt: now,
    });
    return true;
  }

  saveReview(submissionId: string, review: AgentReview, now: string): void {
    this.database.prepare(`
      INSERT INTO reviews(id, submission_id, reviewer_type, decision, report_json, created_at)
      VALUES (?, ?, 'deterministic', ?, ?, ?)
    `).run(randomUUID(), submissionId, review.decision, JSON.stringify(review), now);
  }

  savePreviewArtifact(artifact: PreviewArtifact): void {
    this.database.prepare(`
      INSERT INTO preview_artifacts(
        id, submission_id, content_hash, artifact_path, build_report_json,
        security_report_json, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      artifact.id,
      artifact.submissionId,
      artifact.contentHash,
      artifact.artifactPath,
      JSON.stringify({ ...artifact.buildReport, previewUrl: artifact.previewUrl }),
      JSON.stringify(artifact.securityReport),
      artifact.expiresAt,
      artifact.createdAt,
    );
  }

  getPreviewArtifact(id: string): PreviewArtifact | undefined {
    const row = this.database.prepare('SELECT * FROM preview_artifacts WHERE id = ?').get(id) as SqlRow | undefined;
    if (!row) return undefined;
    const build = JSON.parse(String(row.build_report_json)) as PreviewArtifact['buildReport'] & { previewUrl?: string };
    return {
      id: String(row.id),
      submissionId: String(row.submission_id),
      contentHash: String(row.content_hash),
      artifactPath: String(row.artifact_path),
      previewUrl: build.previewUrl ?? '',
      buildReport: {
        ok: build.ok,
        durationMs: build.durationMs,
        files: build.files,
        warnings: build.warnings,
      },
      securityReport: JSON.parse(String(row.security_report_json)) as PreviewArtifact['securityReport'],
      expiresAt: String(row.expires_at),
      createdAt: String(row.created_at),
    };
  }

  private attachReview(submission: StoredSubmission): StoredSubmission {
    const row = this.database.prepare(`
      SELECT report_json FROM reviews WHERE submission_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(submission.id) as SqlRow | undefined;
    return row ? { ...submission, review: JSON.parse(String(row.report_json)) as AgentReview } : submission;
  }
}
