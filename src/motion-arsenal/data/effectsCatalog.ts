import type { EffectEntry, EffectImprovementStatus } from '../types';
import effectUpdates from 'virtual:effect-updates';
import { BACKGROUNDS_CATALOG } from '../effects/backgrounds/catalog';
import { HERO_CATALOG } from '../effects/hero/catalog';
import { TRANSITIONS_CATALOG } from '../effects/transitions/catalog';
import { SCROLL_CATALOG } from '../effects/scroll/catalog';
import { CURSOR_CATALOG } from '../effects/cursor/catalog';
import { CARDS_CATALOG } from '../effects/cards/catalog';
import { SYSTEM_CATALOG } from '../effects/system/catalog';
import { FORMS_CATALOG } from '../effects/forms/catalog';
import { OVERLAYS_CATALOG } from '../effects/overlays/catalog';
import { PREMIUM_CATALOG } from '../effects/premium/catalog';
import { FORGE_SKILLTREE_CATALOG } from '../effects/forge-skilltree/catalog';
import { CANVAS_UI_CATALOG } from '../effects/canvas-ui/catalog';
import { IMG2THREEJS_CATALOG } from '../effects/img2threejs/catalog';
import { LAB_CATALOG } from '../effects/lab/catalog';
import { ORIGINKIT_CATALOG } from '../effects/originkit/catalog';

const RAW_EFFECTS_CATALOG: EffectEntry[] = [
  ...PREMIUM_CATALOG,
  ...FORGE_SKILLTREE_CATALOG,
  ...BACKGROUNDS_CATALOG,
  ...HERO_CATALOG,
  ...TRANSITIONS_CATALOG,
  ...SCROLL_CATALOG,
  ...CURSOR_CATALOG,
  ...CARDS_CATALOG,
  ...SYSTEM_CATALOG,
  ...FORMS_CATALOG,
  ...OVERLAYS_CATALOG,
  ...CANVAS_UI_CATALOG,
  ...IMG2THREEJS_CATALOG,
  ...LAB_CATALOG,
  ...ORIGINKIT_CATALOG,
];

const IMPROVEMENT_OVERRIDES: Record<string, Partial<EffectEntry['meta']>> = {
  'nox-spinimage': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-30T20:08:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.0.0',
    improvementChangelog: [
      'Upgraded to a responsive 3D orbital image array with pointer-driven tilt and velocity impulse.',
      'Added depth sorting, glow trails, configurable core visuals, viewport pausing, and reduced-motion support.',
      'Preserved the original public props while exposing production-oriented orbit, depth, trail, and glow controls.',
    ],
  },
  'premium-glass-distortion-cards': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-30T21:07:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Exposed all five material variants and three energy profiles directly in the Arsenal control panel.',
      'Added production controls for depth, glass opacity, material scale, and optional in-effect switchers while preserving the original props.',
      'Documented the single-WebGL-context budget, touch fallback, and reduced-motion behavior for safer customer-site adoption.',
    ],
  },
  'premium-data-stream-journey': {
    improvementStatus: 'improved',
    lastImprovedAt: '2026-07-30T22:07:00.000Z',
    lastImprovedBy: 'foundry-hourly',
    improvementVersion: '2.1.0',
    improvementChangelog: [
      'Exposed five production-ready stream geometries and three energy profiles in the Arsenal control panel.',
      'Added operator controls for trail persistence, branch intensity, and optional in-effect variant and energy switchers while preserving legacy props.',
      'Documented the single Canvas2D loop, mobile particle budget, tap impulse, and reduced-motion static-frame behavior.',
    ],
  },
};

function deriveImprovementStatus(entry: EffectEntry): EffectImprovementStatus {
  if (entry.meta.improvementStatus) return entry.meta.improvementStatus;
  if (entry.meta.mode === 'reference-lab') return 'needs-review';
  return 'pending';
}

export const EFFECTS_CATALOG: EffectEntry[] = RAW_EFFECTS_CATALOG.map((entry) => {
  const updatedAt = effectUpdates[entry.meta.importPath];
  const override = IMPROVEMENT_OVERRIDES[entry.meta.id] ?? {};
  const mergedMeta = { ...entry.meta, ...override };
  const improvementStatus = deriveImprovementStatus({ ...entry, meta: mergedMeta });

  return {
    ...entry,
    meta: {
      ...mergedMeta,
      updatedAt,
      improvementStatus,
      lastImprovedBy: mergedMeta.lastImprovedBy ?? 'unassigned',
      improvementVersion:
        mergedMeta.improvementVersion ??
        (improvementStatus === 'needs-review' ? '0.5.0' : '0.1.0'),
      improvementChangelog: mergedMeta.improvementChangelog ?? [],
    },
  };
});

// Guard against duplicate ids across category catalogs (agents build these in
// parallel — a duplicate would silently break hash-routing).
const seen = new Set<string>();
for (const e of EFFECTS_CATALOG) {
  if (seen.has(e.meta.id)) console.error(`[motion-arsenal] duplicate effect id: ${e.meta.id}`);
  seen.add(e.meta.id);
}
