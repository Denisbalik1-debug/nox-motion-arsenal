// ---------------------------------------------------------------------------
// Motion vocabulary extracted from the reference captures.
// Sources:
//  - KRANK (Lusion): overshoot bezier, --pulse filter chains, damping 8–15
//  - Active Theory / Shopify Editions: added after forensic pass
// ---------------------------------------------------------------------------

export const EASE = {
  // KRANK index.css — elastic overshoot used on card slide transforms (500ms).
  krankOvershoot: 'cubic-bezier(.3, 0, .66, -.3)',
  // Standard premium vocab
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  outQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
  inOutSoft: 'cubic-bezier(0.65, 0, 0.35, 1)',
  outBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  sharpIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
} as const;

export const DURATION = {
  micro: 0.18, // KRANK opacity/color transitions (.18s)
  fast: 0.3,
  base: 0.5, // KRANK transform transitions (.5s)
  slow: 0.9,
  reveal: 1.4,
} as const;

// Damping constants seen in the Lusion bundle (lerp/damp physics, 8–15 range).
export const PHYSICS = {
  cursorFollow: 10,
  cursorFollowTight: 15,
  scrollInertia: 8,
  magneticPull: 0.15, // lerp factor for magnetic hover zones
  magneticRadius: 110, // px attraction radius
} as const;

// NOX brand palette (from noxlabs design system) + ORYZO-class accent set.
export const NOX_COLORS = {
  bg: '#0a0a0b',
  bgPanel: '#111114',
  red: '#C93030',
  redBright: '#ff4d4d',
  gold: '#d4a24a',
  text: '#f0ece4',
  textDim: '#8a8781',
  // ORYZO-reference glow accents (red/green/orange luminous scribbles)
  glowRed: '#ff3b30',
  glowGreen: '#39ff8b',
  glowOrange: '#ff9f2e',
} as const;

// Numeric easing functions for canvas/raf effects.
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
