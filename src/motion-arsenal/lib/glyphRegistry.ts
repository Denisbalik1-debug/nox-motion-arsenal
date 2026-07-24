import { seededRandom } from './animationUtils';
import { scribblePath, loopScribblePath, glyphPath } from './svgUtils';

// ---------------------------------------------------------------------------
// Glyph / symbol registry.
//
// Goal: the interaction, motion and energy behaviour of the symbol fields stay
// fixed, while the actual SYMBOL is swappable. Pass a `GlyphDef[]` (or pick a
// named set) and the same proximity mechanic drives whatever paths you give it.
//
// A GlyphDef is just an SVG path (stroke-based, fill none) plus optional
// per-symbol overrides. viewBox defaults to "0 0 120 120".
// ---------------------------------------------------------------------------

export interface GlyphDef {
  id: string;
  path: string;
  viewBox?: string;
  weight?: number; // stroke-weight multiplier (default 1)
  idleColor?: string; // override the field's idle tone for this symbol
  energyColor?: string; // override the field's hot tone for this symbol
  scale?: number; // per-symbol size multiplier (default 1)
}

export interface GlyphSet {
  id: string;
  viewBox: string;
  glyphs: GlyphDef[];
}

// --- Hand-authored NOX rune set (angular, energetic, 120×120) --------------
// Stroke polylines only. Swap or extend freely — the fields don't care.
export const NOX_RUNES: GlyphSet = {
  id: 'nox-runes',
  viewBox: '0 0 120 120',
  glyphs: [
    { id: 'nox-bolt', path: 'M72 14 L38 60 L57 60 L46 106 L84 52 L64 52 Z' },
    { id: 'nox-cross', path: 'M60 18 L60 102 M26 52 L94 52 M40 34 L80 70' },
    { id: 'nox-sigil', path: 'M60 20 L98 94 L22 94 Z M60 46 L80 86 L40 86 Z' },
    { id: 'nox-orbit', path: 'M26 60 A34 30 0 1 0 94 60 A34 30 0 1 0 26 60 M60 24 L60 10 M60 96 L60 110' },
    { id: 'nox-chevron', path: 'M28 40 L60 68 L92 40 M28 66 L60 94 L92 66' },
    { id: 'nox-runex', path: 'M30 30 L90 90 M90 30 L30 90 M60 20 L60 100' },
    { id: 'nox-hexnode', path: 'M60 22 L96 44 L96 80 L60 102 L24 80 L24 44 Z M60 50 L60 74 M48 62 L72 62' },
    { id: 'nox-anchorbolt', path: 'M38 22 L82 22 M60 22 L60 86 M60 86 L36 62 M60 86 L84 62' },
    { id: 'nox-arrowstack', path: 'M60 18 L84 46 L36 46 Z M60 52 L84 80 L36 80 Z M60 86 L60 104' },
  ],
};

const GLYPH_SETS: Record<string, GlyphSet> = {
  [NOX_RUNES.id]: NOX_RUNES,
};

export function getGlyphSet(id: string): GlyphSet | undefined {
  return GLYPH_SETS[id];
}

// --- Procedural generators (match the original scribble-field visual family) --

/** Angular procedural glyphs (fallback / "procedural" set for ForgeEnergyGlyphs). */
export function makeProceduralGlyphs(seed: number, count: number): GlyphDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `proc-glyph-${i}`,
    path: glyphPath(seed * 11 + i * 5, 120),
    viewBox: '0 0 120 120',
  }));
}

/** Organic scribbles + loops (the ORYZO-class visual family for the scribble field). */
export function makeProceduralScribbles(seed: number, count: number): GlyphDef[] {
  const rnd = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => {
    const k = rnd();
    const path =
      k < 0.5
        ? scribblePath(seed * 31 + i * 7, 220, 200, 5 + Math.floor(rnd() * 4), 0.5 + rnd() * 0.5)
        : k < 0.82
          ? loopScribblePath(seed * 17 + i * 13, 60 + rnd() * 50, 2 + Math.floor(rnd() * 2), 0.3 + rnd() * 0.3)
          : glyphPath(seed * 11 + i * 5, 200);
    return { id: `scribble-${i}`, path, viewBox: '0 0 220 200' };
  });
}

/**
 * Resolve a symbol list from either an explicit array, a named set, or a
 * procedural generator — the single entry point both fields use.
 */
export function resolveGlyphs(
  source: GlyphDef[] | 'nox-runes' | 'procedural-glyphs' | 'procedural-scribbles' | undefined,
  seed: number,
  count: number,
): GlyphDef[] {
  if (Array.isArray(source) && source.length) return source;
  if (source === 'nox-runes') return NOX_RUNES.glyphs;
  if (source === 'procedural-scribbles') return makeProceduralScribbles(seed, count);
  return makeProceduralGlyphs(seed, count);
}
