import { smoothstep, damp } from './animationUtils';

// ---------------------------------------------------------------------------
// Proximity-energy mechanic, distilled from the reference symbol fields.
//
//   Pointer → Proximity → Energy → (Color / Glow / Transform / Stroke) → Decay
//
// Each object measures its distance to the pointer every frame. Near the
// pointer its energy rises fast (attack); once the pointer leaves it fades
// slowly (decay / afterglow). Nothing here is a random keyframe — the motion
// is a direct function of where the pointer is.
// ---------------------------------------------------------------------------

/** 1 at the pointer, 0 at or beyond `radius`, smooth falloff between. */
export function proximityEnergy(dist: number, radius: number): number {
  if (radius <= 0) return 0;
  // smoothstep(a=radius, b=0, t=dist): dist 0 → 1, dist radius → 0.
  return smoothstep(radius, 0, dist);
}

/**
 * Frame-rate independent energy integration with asymmetric response:
 * fast to light up (attack), slow to fade (decay) — the "afterglow" feel.
 */
export function stepEnergy(current: number, target: number, dt: number, attack = 12, decay = 2.4): number {
  const lambda = target >= current ? attack : decay;
  return damp(current, target, lambda, dt);
}

/**
 * Resolve the pointer position to pixels inside a container rect.
 * Returns null when the pointer is outside so callers can fall back to idle.
 */
export function pointerPx(
  rect: { width: number; height: number },
  p: { tx: number; ty: number; inside: boolean },
): { x: number; y: number } | null {
  if (!p.inside) return null;
  return { x: p.tx * rect.width, y: p.ty * rect.height };
}
