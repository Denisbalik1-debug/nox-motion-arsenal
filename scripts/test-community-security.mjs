import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: 'error',
});
try {
  const reviewModule = await server.ssrLoadModule('/server/community/staticReview.ts');
  const payloads = [
    'eval("1")',
    'new Function("return 1")',
    'fetch("https://evil.test")',
    'new XMLHttpRequest()',
    'new WebSocket("wss://evil.test")',
    'navigator.sendBeacon("/x")',
    'document.cookie',
    'localStorage.setItem("x","y")',
    'indexedDB.open("x")',
    'navigator.serviceWorker.register("/sw.js")',
    'window.parent.postMessage("x", "*")',
    'process.env.SECRET',
    'import("node:fs")',
    `const encoded = "${'A'.repeat(600)}"`,
  ];
  for (const [index, content] of payloads.entries()) {
    const pkg = {
      schemaVersion: '1.0',
      submissionId: `security-${index}`,
      target: { effectId: 'x', baseVersion: '1', manifestHash: `sha256:${'0'.repeat(64)}` },
      author: { anonymous: true },
      proposal: { title: 'x', summary: 'x', motivation: 'x', visualChanges: [], behavioralChanges: [], knownLimitations: [] },
      files: [{ path: 'x.ts', operation: 'create', language: 'typescript', content, contentSha256: `sha256:${'0'.repeat(64)}` }],
      dependencies: { add: {}, remove: [] },
      controls: [],
      verification: { commands: [], manualChecks: [], expectedViewports: [], reducedMotionChecked: false, performanceNotes: '' },
      provenance: { generatedAt: new Date().toISOString(), termsAccepted: true },
    };
    const review = reviewModule.reviewImprovementPackage(pkg);
    assert.equal(review.decision, 'manual_security_review', `payload ${index} was not rejected`);
    assert(review.securityFindings.length > 0);
  }
  console.log(`community security: ${payloads.length} forbidden capability payloads rejected`);
} finally {
  await server.close();
}
