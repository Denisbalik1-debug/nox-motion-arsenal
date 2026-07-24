import { lazy } from 'react';
import type { EffectEntry } from '../../types';

// ---------------------------------------------------------------------------
// Studio-Level NOX — Premium Rebuilds (2026-07-04).
// Eigene NOX-Implementierungen der Mechaniken aus den Referenz-Forensiken
// (KRANK/Lusion, Active Theory, Shopify Editions) plus eigener NOX-Forge-
// Mechanik. Kein fremder Code, keine fremden Assets — nur Prinzipien.
// Erstintegration: noxlabs.net Landingpage (siehe
// docs/noxlabs-effect-usage-map.md im noxlabs.net-Repo).
// ---------------------------------------------------------------------------

export const PREMIUM_CATALOG: EffectEntry[] = [
  {
    meta: {
      id: 'premium-glass-distortion-cards',
      name: 'NoxGlassCards',
      category: 'premium',
      sourceWebsite: 'active-theory',
      sourceFiles: [
        'docs/PROVENANCE.md (public provenance and rights classification)',
      ],
      mode: 'nox-adapted',
      complexity: 'high',
      dependencies: [],
      bestFor: ['Service-/Modul-Karten', 'Case-Study-Grids', 'Rank-/Progression-Cards'],
      performanceNotes:
        'Kontext-Budget 1: EIN WebGL-Canvas wandert zur gehoverten Karte (dpr-Cap 1.5). Ruhende Karten sind reines CSS (Tilt + Gloss). Beliebig viele Karten möglich, nie mehr als 1 aktiver Kontext.',
      mobileNotes: 'Kein Hover auf Touch → Karten bleiben im CSS-Gloss-Zustand, kein WebGL-Mount. Tilt aus.',
      reducedMotionNotes: 'Kein Tilt, kein Canvas — statische Karten mit Gloss-Layer.',
      description:
        'Lokale 3D-Glaskarten der Active-Theory-Klasse: per-Karte Pointer-Tilt (damp λ9), auf der aktiven Karte ein eigener Fragment-Shader mit Fresnel-Leuchtsaum ((1−edge)^p) und Linsen-Refraktion eines prozeduralen NOX-Grids. Der eine WebGL-Kontext wandert zwischen den Karten — Studio-Look ohne Kontext-Inflation.',
      importPath: '@/motion-arsenal/effects/premium/NoxGlassCards',
      usageJsx: '<NoxGlassCards tilt={8} refraction={0.055} fresnel={3.2} />',
      props: [
        { key: 'tilt', label: 'Tilt (°)', type: 'range', default: 8, min: 0, max: 14, step: 0.5 },
        { key: 'refraction', label: 'Refraction', type: 'range', default: 0.055, min: 0, max: 0.12, step: 0.005 },
        { key: 'fresnel', label: 'Fresnel Power', type: 'range', default: 3.2, min: 1, max: 6, step: 0.1 },
        { key: 'gridScale', label: 'Grid Scale', type: 'range', default: 14, min: 6, max: 26, step: 1 },
      ],
      productionSafe: true,
      clickToRun: false,
    },
    Component: lazy(() => import('./NoxGlassCards')),
  },
  {
    meta: {
      id: 'premium-data-stream-journey',
      name: 'NoxDataStreamJourney',
      category: 'premium',
      sourceWebsite: 'krank-lusion',
      sourceFiles: [
        'docs/PROVENANCE.md (public provenance and rights classification)',
      ],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['„Vom Signal zum System"-Story-Sektionen', 'Pipeline-/Prozess-Visualisierung', 'Leadflow-Erklärung'],
      performanceNotes:
        'Ein Canvas2D-Loop, Trail über Decay-Smear (kein History-Buffer). 70 Partikel Default — light/medium. dpr-Cap 2.',
      mobileNotes: 'Ohne Pointer läuft der Strom ungestört; Partikelzahl bei Bedarf über prop senken. Labels ab <430px ausgeblendet.',
      reducedMotionNotes: 'Ein statischer Frame: Pfad + Stationen sichtbar, keine Partikelbewegung.',
      description:
        'Scroll-synchronisierbare Datenstrom-Sektion: Partikel wandern durch die NOX-Pipeline (Signal→Lead→Qualifizierung→Pitch→Follow-up→Conversion), der Pointer stört den Strom lokal (Repulsion + tangentiale Verwirbelung mit Falloff), Stationen schalten mit progress frei und konvertierte Partikel färben rot→grün.',
      importPath: '@/motion-arsenal/effects/premium/NoxDataStreamJourney',
      usageJsx: '<NoxDataStreamJourney particleCount={70} speed={0.8} disturb={0.6} progress={-1} />',
      props: [
        { key: 'particleCount', label: 'Particles', type: 'range', default: 70, min: 20, max: 140, step: 5 },
        { key: 'speed', label: 'Speed', type: 'range', default: 0.8, min: 0.2, max: 2, step: 0.1 },
        { key: 'disturb', label: 'Pointer Disturb', type: 'range', default: 0.6, min: 0, max: 1, step: 0.05 },
        { key: 'progress', label: 'Progress (-1=Auto)', type: 'range', default: -1, min: -1, max: 1, step: 0.05 },
        { key: 'labels', label: 'Labels', type: 'boolean', default: true },
      ],
      productionSafe: true,
      fullBleed: true,
    },
    Component: lazy(() => import('./NoxDataStreamJourney')),
  },
  {
    meta: {
      id: 'premium-timeline-orchestrator',
      name: 'NoxTimelineOrchestrator',
      category: 'premium',
      sourceWebsite: 'shopify-editions',
      sourceFiles: [
        'docs/PROVENANCE.md (public provenance and rights classification)',
      ],
      mode: 'nox-adapted',
      complexity: 'medium',
      dependencies: [],
      bestFor: ['Process-/How-it-works-Sektionen', 'Operating-System-Story', 'Methoden-Timelines'],
      performanceNotes:
        'Reines DOM+SVG, ein rAF-Loop, Transform/Opacity only. Light. Keine Canvas/WebGL-Kosten.',
      mobileNotes: 'Funktioniert unverändert; Nodes skalieren über cqw. Bei sehr schmalen Viewports Keyframe-Positionen prüfen.',
      reducedMotionNotes: 'Sofort der fertige Endzustand (alle Module + Linien sichtbar), kein Auto-Loop.',
      description:
        'Das Theatre.js-Prinzip ohne Theatre: ein ~40-Zeilen-Keyframe-Controller (KEYFRAMES[] mit [start,end]-Fenstern, stateAt(progress) interpoliert mit outExpo/outBack) choreografiert Systemmodule, die nacheinander einfahren, sich per stroke-dashoffset verbinden und in einem CTA-Zustand enden. progress-Prop koppelt an Scroll.',
      importPath: '@/motion-arsenal/effects/premium/NoxTimelineOrchestrator',
      usageJsx: '<NoxTimelineOrchestrator progress={-1} playSpeed={0.16} overshoot />',
      props: [
        { key: 'progress', label: 'Progress (-1=Auto)', type: 'range', default: -1, min: -1, max: 1, step: 0.05 },
        { key: 'playSpeed', label: 'Auto Speed', type: 'range', default: 0.16, min: 0.05, max: 0.5, step: 0.01 },
        { key: 'overshoot', label: 'Overshoot Ease', type: 'boolean', default: true },
      ],
      productionSafe: true,
      fullBleed: true,
    },
    Component: lazy(() => import('./NoxTimelineOrchestrator')),
  },
  {
    meta: {
      id: 'premium-signal-particles',
      name: 'NoxSignalParticles',
      category: 'premium',
      sourceWebsite: 'shopify-editions',
      sourceFiles: [
        'docs/PROVENANCE.md (public provenance and rights classification)',
      ],
      mode: 'nox-adapted',
      complexity: 'low',
      dependencies: [],
      bestFor: ['Hero-Akzente', 'CTA-Momente', 'Sektions-Übergänge'],
      performanceNotes: 'Ein Canvas2D-Loop für alle Sparks (Instancing-Ökonomie in 2D). 42 Sparks Default — light.',
      mobileNotes: 'Ohne Pointer schwärmt der Swarm-Modus um einen Auto-Drift-Punkt. Count auf Mobile reduzierbar.',
      reducedMotionNotes: 'Sparks stehen statisch an ihren Zielpositionen, kein Flackern.',
      description:
        'Die Shopify-Butterflies als NOX-Signal-Sparks: kleine agentische Partikel (eigene Kreuz-Glint-Form, keine fremden Assets) mit drei choreografierten Verhaltenszuständen — orbit (Atmosphäre), swarm (Pointer-Folge), settle (Andocken auf der CTA-Linie) — und weichen damp-Übergängen dazwischen.',
      importPath: '@/motion-arsenal/effects/premium/NoxSignalParticles',
      usageJsx: "<NoxSignalParticles count={42} mode=\"auto\" intensity={1} />",
      props: [
        { key: 'count', label: 'Count', type: 'range', default: 42, min: 12, max: 90, step: 2 },
        { key: 'mode', label: 'Mode', type: 'select', default: 'auto', options: ['auto', 'orbit', 'swarm', 'settle'] },
        { key: 'intensity', label: 'Intensity', type: 'range', default: 1, min: 0.2, max: 1.5, step: 0.05 },
        { key: 'sparkSize', label: 'Spark Size', type: 'range', default: 1.2, min: 0.6, max: 2.4, step: 0.1 },
      ],
      productionSafe: true,
      fullBleed: true,
    },
    Component: lazy(() => import('./NoxSignalParticles')),
  },
  {
    meta: {
      id: 'premium-terminal-scan-reveal',
      name: 'NoxTerminalScanReveal',
      category: 'premium',
      sourceWebsite: 'nox-original',
      sourceFiles: [
        'effects/hero (TerminalBootStream — eigene NOX-Forge-Mechanik)',
        'effects/system (RankRevealSequence — eigene NOX-Forge-Mechanik)',
      ],
      mode: 'nox-adapted',
      complexity: 'low',
      dependencies: [],
      bestFor: ['CTA-Sektionen', 'Assessment-/Audit-Funnel', 'Process-Reveals', 'Loading-/Transition-Momente'],
      performanceNotes: 'DOM/CSS + ein rAF-Loop nur während der Sequenz (Boot+Scan ≈ 4s), danach 0 Laufzeitkosten. Light.',
      mobileNotes: 'Voll responsiv (auto-fit Grid); Sequenz identisch auf Touch.',
      reducedMotionNotes: 'Sofort der fertige Endzustand: Protokoll komplett, Module sichtbar, CTA aktiv.',
      description:
        'Premium-CTA-Sequenz aus eigener NOX-Forge-Mechanik: Boot-Protokoll tippt sich zeilenweise, ein Scan-Balken legt die Audit-Module per clip-path frei, der CTA erscheint mit outBack — spielt genau einmal (useInView) und endet in einem ruhigen statischen Zustand statt Dauerloop.',
      importPath: '@/motion-arsenal/effects/premium/NoxTerminalScanReveal',
      usageJsx: '<NoxTerminalScanReveal speed={1} scanDuration={1.6} autoStart />',
      props: [
        { key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.5, max: 2, step: 0.1 },
        { key: 'scanDuration', label: 'Scan Duration (s)', type: 'range', default: 1.6, min: 0.8, max: 3, step: 0.1 },
        { key: 'autoStart', label: 'Auto Start', type: 'boolean', default: true },
      ],
      productionSafe: true,
    },
    Component: lazy(() => import('./NoxTerminalScanReveal')),
  },
];
