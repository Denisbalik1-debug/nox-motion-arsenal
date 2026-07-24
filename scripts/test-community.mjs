import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const temporary = mkdtempSync(join(tmpdir(), 'nox-community-test-'));
process.env.COMMUNITY_SQLITE_PATH = join(temporary, 'community.sqlite');

const server = await createServer({
  server: { host: '127.0.0.1', port: 0 },
  logLevel: 'error',
});

try {
  await server.listen();
  const address = server.httpServer.address();
  assert(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const catalogModule = await server.ssrLoadModule('/src/motion-arsenal/data/effectsCatalog.ts');
  const manifestModule = await server.ssrLoadModule('/src/motion-arsenal/community/manifests/buildManifest.ts');
  const validationModule = await server.ssrLoadModule('/src/motion-arsenal/community/validation/validatePackage.ts');
  const promptModule = await server.ssrLoadModule('/src/motion-arsenal/community/prompt/buildImprovementPrompt.ts');
  const reviewModule = await server.ssrLoadModule('/server/community/staticReview.ts');

  const manifests = catalogModule.EFFECTS_CATALOG.map((entry) => manifestModule.buildEffectManifest(entry));
  assert.equal(manifests.length, 76, 'all 76 public effects must have manifests');
  assert.equal(new Set(manifests.map((manifest) => manifest.id)).size, 76, 'manifest ids must be unique');
  for (const [index, manifest] of manifests.entries()) {
    assert.match(manifest.manifestHash, /^sha256:[a-f0-9]{64}$/);
    assert.deepEqual(manifest, manifestModule.buildEffectManifest(catalogModule.EFFECTS_CATALOG[index]), 'manifest must be stable');
    assert(manifest.ownedFiles.includes(manifest.entryFile), `${manifest.id} entry must be owned`);
  }

  const entry = catalogModule.EFFECTS_CATALOG.find((item) => item.meta.id === 'forms-validation-pulse');
  assert(entry, 'compiler fixture effect missing');
  const manifest = manifestModule.buildEffectManifest(entry);
  const sources = manifestModule.getOwnedSourceFiles(manifest);
  const prompt = promptModule.buildImprovementPrompt(manifest, sources, true);
  assert(prompt.includes(manifest.manifestHash));
  for (const path of Object.keys(sources)) assert(prompt.includes(path));
  assert(!prompt.includes('src/motion-arsenal/components/ArsenalShell.tsx'));

  const makePackage = () => ({
    schemaVersion: '1.0',
    submissionId: `test-${crypto.randomUUID()}`,
    target: {
      effectId: manifest.id,
      baseVersion: manifest.version,
      manifestHash: manifest.manifestHash,
    },
    author: { anonymous: true },
    proposal: {
      title: 'Safe deterministic test improvement',
      summary: 'No-source package used to verify the storage and compiler pipeline.',
      motivation: 'Exercise the complete local pipeline without executing untrusted source.',
      visualChanges: [],
      behavioralChanges: [],
      knownLimitations: [],
    },
    files: [],
    dependencies: { add: {}, remove: [] },
    controls: [],
    verification: {
      commands: ['npm run typecheck'],
      manualChecks: ['Desktop and mobile'],
      expectedViewports: ['1440x900', '390x844'],
      reducedMotionChecked: true,
      performanceNotes: 'No source change.',
    },
    provenance: {
      generator: 'nox-test',
      generatedAt: new Date().toISOString(),
      termsAccepted: true,
    },
  });

  const validPackage = makePackage();
  const valid = await validationModule.validateImprovementPackage(JSON.stringify(validPackage), manifest, sources);
  assert(valid.ok, JSON.stringify(valid.findings));

  for (const maliciousPath of ['../escape.ts', 'C:/escape.ts', 'src/App.tsx']) {
    const attack = makePackage();
    attack.files = [{
      path: maliciousPath,
      operation: 'create',
      language: 'typescript',
      content: 'export default 1',
      contentSha256: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    }];
    const result = await validationModule.validateImprovementPackage(JSON.stringify(attack), manifest, sources);
    assert(!result.ok, `${maliciousPath} must be rejected`);
  }

  const xssPackage = makePackage();
  xssPackage.files = [{
    path: `${manifest.entryFile.slice(0, manifest.entryFile.lastIndexOf('/'))}/${manifest.id}/xss.ts`,
    operation: 'create',
    language: 'typescript',
    content: 'element.innerHTML = "<img src=x onerror=alert(1)>"',
    contentSha256: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
  }];
  const xssReview = reviewModule.reviewImprovementPackage(xssPackage, manifest);
  assert.equal(xssReview.decision, 'manual_security_review');
  assert(xssReview.securityFindings.length > 0);

  const tokenResponse = await fetch(`${base}/api/community/tokens/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPackage.target),
  });
  assert.equal(tokenResponse.status, 201);
  const access = await tokenResponse.json();
  assert.match(access.token, /^nox_sub_/);
  assert(Date.parse(access.expiresAt) - Date.now() > 59 * 60_000);

  const submitResponse = await fetch(`${base}/api/community/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access.token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'community-test-valid',
    },
    body: JSON.stringify(validPackage),
  });
  const stored = await submitResponse.json();
  assert.equal(submitResponse.status, 201, JSON.stringify(stored));

  const replayResponse = await fetch(`${base}/api/community/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access.token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'community-test-valid',
    },
    body: JSON.stringify(validPackage),
  });
  assert.equal(replayResponse.status, 200);
  assert.equal((await replayResponse.json()).submissionId, stored.submissionId);

  const adminHeaders = { 'x-nox-local-admin': '1', 'Content-Type': 'application/json' };
  const reviewResponse = await fetch(`${base}/api/community/admin/submissions/${stored.submissionId}/review`, {
    method: 'POST',
    headers: adminHeaders,
    body: '{}',
  });
  const reviewBody = await reviewResponse.json();
  assert.equal(reviewResponse.status, 200, JSON.stringify(reviewBody));
  assert.equal(reviewBody.review.requiresHumanApproval, true);

  const compileResponse = await fetch(`${base}/api/community/admin/submissions/${stored.submissionId}/compile`, {
    method: 'POST',
    headers: adminHeaders,
    body: '{}',
  });
  const compileBody = await compileResponse.json();
  assert.equal(compileResponse.status, 201, JSON.stringify(compileBody));
  const artifact = compileBody.artifact;
  assert.match(artifact.contentHash, /^[a-f0-9]{64}$/);
  const previewResponse = await fetch(artifact.previewUrl);
  assert.equal(previewResponse.status, 200);
  assert.match(previewResponse.headers.get('content-security-policy') ?? '', /connect-src 'none'/);
  assert.match(previewResponse.headers.get('content-security-policy') ?? '', /form-action 'none'/);

  const invalidTokenResponse = await fetch(`${base}/api/community/tokens/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPackage.target),
  });
  const invalidAccess = await invalidTokenResponse.json();
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(`${base}/api/community/submissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${invalidAccess.token}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    if (attempt === 5) assert.equal(body.code, 'TOKEN_BLOCKED');
  }

  const oversized = await fetch(`${base}/api/community/submissions`, {
    method: 'POST',
    headers: { Authorization: 'Bearer missing', 'Content-Type': 'application/json' },
    body: 'x'.repeat(2 * 1024 * 1024 + 1),
  });
  assert.equal(oversized.status, 413);

  console.log(`community integration: 76 manifests, token, idempotency, review, isolated artifact, limits OK`);
} finally {
  await server.close();
  delete process.env.COMMUNITY_SQLITE_PATH;
  try {
    rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch (error) {
    console.warn(`temporary test database cleanup deferred: ${error instanceof Error ? error.message : error}`);
  }
}
