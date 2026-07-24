import type { ControlDiff, EffectControlDefinition, EffectManifest, ImprovementPackage } from '../types';

function withinControlBounds(current: EffectControlDefinition, proposed: EffectControlDefinition): boolean {
  if (current.type !== proposed.type) return false;
  const value = proposed.defaultValue;
  if ((current.type === 'range' || current.type === 'number') && typeof value === 'number') {
    if (current.min !== undefined && value < current.min) return false;
    if (current.max !== undefined && value > current.max) return false;
    return Number.isFinite(value);
  }
  if (current.type === 'select') return typeof value === 'string' && Boolean(current.options?.includes(value));
  if (current.type === 'boolean') return typeof value === 'boolean';
  if (current.type === 'color') return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  if (current.type === 'text') return typeof value === 'string' && value.length <= 2_000;
  return false;
}

export function buildControlDiffs(manifest: EffectManifest, pkg: ImprovementPackage): ControlDiff[] {
  const current = new Map(manifest.controls.map((control) => [control.key, control]));
  return pkg.controls.map((change) => {
    const existing = current.get(change.key);
    return {
      key: change.key,
      action: change.action,
      current: existing,
      proposed: change.definition,
      previewable: change.action === 'change'
        && Boolean(existing && change.definition && withinControlBounds(existing, change.definition)),
    };
  });
}

export function proposedTrustedValues(manifest: EffectManifest, pkg: ImprovementPackage): Record<string, unknown> {
  const values = Object.fromEntries(manifest.controls.map((control) => [control.key, control.defaultValue]));
  for (const diff of buildControlDiffs(manifest, pkg)) {
    if (diff.previewable && diff.proposed) values[diff.key] = diff.proposed.defaultValue;
  }
  return values;
}
