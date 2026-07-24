import type { EffectManifest } from '../types';

export type EffectManifestOverride = Partial<
  Pick<EffectManifest, 'runtime' | 'ownedFiles' | 'dependencies' | 'constraints' | 'verification'>
>;

// Keep this intentionally small. The generator is the default; overrides are
// reserved for effects whose runtime or ownership cannot be inferred safely.
export const EFFECT_MANIFEST_OVERRIDES: Record<string, EffectManifestOverride> = {};
