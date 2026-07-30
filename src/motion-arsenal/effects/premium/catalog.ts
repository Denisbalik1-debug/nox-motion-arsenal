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
      bestFor: ['Service-/Modul-Karten', 'Case-Study-Grids', 'Rank-/Progression-Cards', 'Premium Angebots- und Pricing-Sektionen'],
      performanceNotes:
        'Kontext-Budget 1: EIN WebGL-Canvas wandert zur aktiven Karte (dpr-Cap 1.5). Ruhende Karten sind reines CSS (Tilt + Gloss). Fünf Materialvarianten und drei Energieprofile teilen denselben Renderer; nie mehr als 1 aktiver Kontext.',
      mobileNotes: 'Touch bleibt WebGL-sparsam: keine dauerhafte Hover-Animation, vertikales Kartenlayout und statischer Gloss-Fallback. Variant-/Energy-Switcher bleiben bedienbar.',
      reducedMotionNotes: 'Kein Tilt, kein laufender Shader und keine Ambient-Rotation — statische Karten mit vollständig lesbarem Materialzustand.',
      description:
        'Produktionsreife 3D-Glaskarten mit einem wandernden WebGL-Kontext, Pointer-Tilt, Fresnel-Rim, Linsen-Refraktion und fünf klar unterscheidbaren Materialsystemen: Prism Command Grid, Liquid Chrome Vault, Obsidian Caustic Deck, Signal Crystal Array und Revenue Amber Monoliths. Drei Energieprofile skalieren Bewegung, Glow und Tiefe, ohne zusätzliche Renderer zu erzeugen.',
      importPath: '@/motion-arsenal/effects/premium/NoxGlassCards',
      usageJsx: '<NoxGlassCards variant="obsidian-caustic-deck" energy="charged" tilt={9} refraction={0.065} depth={1} />',
      props: [
        { key: 'variant', label: 'Material Variant', type: 'select', default: 'prism-command-grid', options: ['prism-command-grid', 'liquid-chrome-vault', 'obsidian-caustic-deck', 'signal-crystal-array', 'revenue-amber-monoliths'] },
        { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'] },
        { key: 'tilt', label: 'Tilt (°)', type: 'range', default: 9, min: 0, max: 14, step: 0.5 },
        { key: 'refraction', label: 'Refraction', type: 'range', default: 0.065, min: 0, max: 0.12, step: 0.005 },
        { key: 'fresnel', label: 'Fresnel Power', type: 'range', default: 3.1, min: 1, max: 6, step: 0.1 },
        { key: 'gridScale', label: 'Material Scale', type: 'range', default: 15, min: 6, max: 26, step: 1 },
        { key: 'depth', label: 'Depth', type: 'range', default: 1, min: 0, max: 1.8, step: 0.1 },
        { key: 'glassOpacity', label: 'Glass Opacity', type: 'range', default: 0.86, min: 0.45, max: 1, step: 0.05 },
        { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true },
        { key: 'showEnergySwitcher', label: 'Energy Switcher', type: 'boolean', default: true },
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
      bestFor: ['„Vom Signal zum System“-Story-Sektionen', 'Pipeline-/Prozess-Visualisierung', 'Leadflow-Erklärung', 'Agenten-Orchestrierung', 'Conversion- und Revenue-Storytelling'],
      performanceNotes:
        'Ein Canvas2D-Loop für alle Partikel, Rails und Impulsringe; Trail über Decay-Smear ohne History-Buffer. Fünf Geometrien und drei Energieprofile teilen denselben Canvas. Default 70 Partikel, dpr-Cap 2; für Mobile 36–56 Partikel empfohlen.',
      mobileNotes: 'Pointer-Störung bleibt optional; Tap erzeugt einen kurzen Impulsring. Labels verschwinden unter 460px, interne Switcher bleiben touch-bedienbar. Für Customer-Heroes Partikelzahl und Overdrive sparsam einsetzen.',
      reducedMotionNotes: 'Ein statischer, vollständig lesbarer Frame mit Pfad, Stationen und Conversion-Front; keine Partikelbewegung, Scan-Animation oder pulsierenden Ringe.',
      description:
        'Produktionsreife Canvas2D-Datenstrom-Sektion mit fünf klar unterscheidbaren Geometrien: Revenue River, Agent Swarm Routing, Conversion Helix, Signal Storm und Quantum Decision Tunnel. Drei Energieprofile skalieren Geschwindigkeit, Glow, Turbulenz, Rails und Sparks. Pointer-Repulsion, Tap-Impulse, Trail-Persistenz und Branch-Intensität lassen sich konfigurieren, ohne zusätzliche Canvas-Kontexte zu erzeugen.',
      importPath: '@/motion-arsenal/effects/premium/NoxDataStreamJourney',
      usageJsx: '<NoxDataStreamJourney variant="agent-swarm-routing" energy="charged" particleCount={70} trailLength={0.62} branchIntensity={1} />',
      props: [
        { key: 'variant', label: 'Stream Variant', type: 'select', default: 'revenue-river', options: ['revenue-river', 'agent-swarm-routing', 'conversion-helix', 'signal-storm', 'quantum-tunnel'] },
        { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'] },
        { key: 'particleCount', label: 'Particles', type: 'range', default: 70, min: 20, max: 140, step: 5 },
        { key: 'speed', label: 'Speed', type: 'range', default: 0.8, min: 0.2, max: 2, step: 0.1 },
        { key: 'disturb', label: 'Pointer Disturb', type: 'range', default: 0.6, min: 0, max: 1, step: 0.05 },
        { key: 'progress', label: 'Progress (-1=Auto)', type: 'range', default: -1, min: -1, max: 1, step: 0.05 },
        { key: 'trailLength', label: 'Trail Length', type: 'range', default: 0.62, min: 0, max: 1, step: 0.05 },
        { key: 'branchIntensity', label: 'Branch Intensity', type: 'range', default: 1, min: 0, max: 1.8, step: 0.1 },
        { key: 'labels', label: 'Labels', type: 'boolean', default: true },
        { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true },
        { key: 'showEnergySwitcher', label: 'Energy Switcher', type: 'boolean', default: true },
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
      usageJsx: '<NoxSignalParticles count={42} mode="auto" intensity={1} />',
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
