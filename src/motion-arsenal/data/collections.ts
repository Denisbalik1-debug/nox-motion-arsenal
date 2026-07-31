// Kuratierte Sammlungen über Kategoriegrenzen hinweg. Reine Sortier-/Filter-
// Schicht auf dem bestehenden Katalog — keine eigene Effekt-Wahrheit.
export interface EffectCollection {
  id: string;
  label: string;
  description: string;
  effectIds: string[];
}

export const EFFECT_COLLECTIONS: EffectCollection[] = [
  {
    id: 'customer-website-essentials',
    label: 'Customer Website Essentials',
    description: 'Bausteine, die auf nahezu jeder Kundenwebseite gebraucht werden.',
    effectIds: [
      'premium-case-study-gallery',
      'premium-before-after-slider',
      'premium-logo-reference-marquee',
      'premium-testimonial-slider',
      'premium-metric-proof-strip',
      'premium-bento-hover-showcase',
      'premium-image-hover-lens',
    ],
  },
  {
    id: 'latest-improvements',
    label: 'Neu & Verbessert',
    description: 'Zuletzt gebaute oder überarbeitete Effekte für den schnellen Review.',
    effectIds: [
      'nox-spinimage',
      'premium-glass-distortion-cards',
      'premium-data-stream-journey',
      'premium-timeline-orchestrator',
      'premium-signal-particles',
      'premium-terminal-scan-reveal',
      'skilltree-astral-constellation',
      'skilltree-floating-nodes',
      'skilltree-active-pulse-ring',
      'skilltree-recommended-focus-ring',
      'premium-case-study-gallery',
      'premium-before-after-slider',
      'premium-logo-reference-marquee',
      'premium-testimonial-slider',
      'premium-metric-proof-strip',
      'premium-bento-hover-showcase',
      'premium-image-hover-lens',
    ],
  },
];
