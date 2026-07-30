import type { EffectEntry } from '../types';
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

export const EFFECTS_CATALOG: EffectEntry[] = RAW_EFFECTS_CATALOG.map((entry) => ({
  ...entry,
  meta: {
    ...entry.meta,
    updatedAt: effectUpdates[entry.meta.importPath],
  },
}));

// Guard against duplicate ids across category catalogs (agents build these in
// parallel — a duplicate would silently break hash-routing).
const seen = new Set<string>();
for (const e of EFFECTS_CATALOG) {
  if (seen.has(e.meta.id)) console.error(`[motion-arsenal] duplicate effect id: ${e.meta.id}`);
  seen.add(e.meta.id);
}
