import { lazy } from 'react';
import type { EffectEntry } from '../../types';

export const OVERLAYS_CATALOG: EffectEntry[] = [
  {
    meta: {
      id: 'overlays-modal-iris-reveal',
      name: 'ModalIrisReveal',
      category: 'overlays',
      sourceWebsite: 'shopify-editions',
      sourceFiles: ['body_html.ts (View-Transition-Morph-Ästhetik)', 'KRANK/src/index.css (stroke-dash Border-Trace)'],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['Detail-Dialoge', 'Unlock-/Bestätigungs-Momente'],
      performanceNotes: 'clip-path circle + eine SVG-Trace — günstig.',
      mobileNotes: 'Mobiletauglich; Iris-Ursprung = Touch-Punkt.',
      reducedMotionNotes: 'Modal erscheint ohne Iris/Trace, direkt offen.',
      description: 'Modal öffnet als Iris vom Klickpunkt (clip-path circle wächst), Backdrop blurt choreografiert ein, ein Border-Trace umläuft das Panel nach dem Andocken, Content staggert. ESC/Backdrop schließt.',
      importPath: '@/motion-arsenal/effects/overlays/ModalIrisReveal',
      usageJsx: '<ModalIrisReveal accent="#C93030" blurBackdrop={8} />',
      props: [
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.4, max: 2, step: 0.1 },
        { key: 'accent', label: 'Accent', type: 'color', default: '#C93030' },
        { key: 'blurBackdrop', label: 'Backdrop Blur', type: 'range', default: 8, min: 0, max: 18, step: 1 },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./ModalIrisReveal')),
  },
  {
    meta: {
      id: 'overlays-glass-sheet',
      name: 'GlassSheetOverlay',
      category: 'overlays',
      sourceWebsite: 'shopify-editions',
      sourceFiles: ['shopify.css (Glass-Nav: rgba + backdrop-filter blur + blend)', 'KRANK/src/index.css (Overshoot-Settle)'],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['Mobile Bottom-Sheets', 'Settings-/Info-Panels', 'Filter-Drawer'],
      performanceNotes: 'backdrop-filter ist die Hauptlast — Fläche klein halten, blur ≤ 16px.',
      mobileNotes: 'Bottom-Sheet ist das native Mobile-Pattern; Drag-Indikator atmet.',
      reducedMotionNotes: 'Sheet erscheint ohne Feder-Einlauf.',
      description: 'Bottom-/Side-Sheet aus geschichtetem Glas: backdrop-blur, Innen-Gradient, Licht-Refraktionskante oben und Noise — federnder outBack-Einlauf, atmender Drag-Indikator, choreografierter Backdrop.',
      importPath: '@/motion-arsenal/effects/overlays/GlassSheetOverlay',
      usageJsx: "<GlassSheetOverlay side=\"bottom\" blur={14} />",
      props: [
        { key: 'side', label: 'Side', type: 'select', default: 'bottom', options: ['bottom', 'right'] },
        { key: 'blur', label: 'Blur', type: 'range', default: 14, min: 4, max: 24, step: 1 },
        { key: 'accent', label: 'Accent', type: 'color', default: '#d4a24a' },
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.4, max: 2, step: 0.1 },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./GlassSheetOverlay')),
  },
];
