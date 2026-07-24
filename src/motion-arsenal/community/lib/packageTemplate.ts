import type { EffectManifest, ImprovementPackage } from '../types';

export function createImprovementPackageTemplate(manifest: EffectManifest): ImprovementPackage {
  return {
    schemaVersion: '1.0',
    submissionId: `draft-${manifest.id}`,
    target: {
      effectId: manifest.id,
      baseVersion: manifest.version,
      manifestHash: manifest.manifestHash,
    },
    author: {
      anonymous: true,
    },
    proposal: {
      title: `Improve ${manifest.displayName}`,
      summary: 'Describe the intended improvement.',
      motivation: 'Explain the concrete problem this change solves.',
      visualChanges: [],
      behavioralChanges: [],
      knownLimitations: [],
    },
    files: [],
    dependencies: {
      add: {},
      remove: [],
    },
    controls: [],
    verification: {
      commands: ['npm run typecheck', 'npm run build'],
      manualChecks: [],
      expectedViewports: manifest.verification.viewports,
      reducedMotionChecked: false,
      performanceNotes: '',
    },
    provenance: {
      generatedAt: new Date().toISOString(),
      termsAccepted: false,
    },
  };
}
