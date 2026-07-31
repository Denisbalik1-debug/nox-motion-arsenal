import { lazy } from 'react';
import type { EffectEntry } from '../../types';

export const PREMIUM_CATALOG: EffectEntry[] = [
  {
    meta: {
      id: 'premium-case-study-gallery', name: 'NoxCaseStudyGallery', displayName: 'NOX Case Study Gallery', category: 'premium', sourceWebsite: 'nox-original', sourceFiles: ['NOX original production component'], mode: 'nox-adapted', complexity: 'low', dependencies: [],
      bestFor: ['Case-Study-Sektionen', 'Portfolio- und Projektgalerien', 'Restaurant- und Hotel-Websites', 'Lokale Kundenwebsites', 'Before-/After-Proof-Layer'],
      performanceNotes: 'DOM/CSS-only. Bilder nutzen lazy loading und async decoding; nur die ersten zwei Motive laden eager. Keine Canvas-, WebGL- oder dauerhafte rAF-Kosten.',
      mobileNotes: 'Touch-Swipe ab 42px, kompakte Captions und einspaltige Lightbox. Bento fällt auf einen fokussierten Slider zurück.',
      reducedMotionNotes: 'Alle Übergänge und Bild-Zooms werden deaktiviert; Navigation, Lightbox und Inhalte bleiben vollständig nutzbar.',
      description: 'Produktionsfähige Case-Study- und Bildgalerie mit Editorial-, Bento- und Carousel-Layouts, Tastatursteuerung, Mobile-Swipe, optionaler Lightbox und kundenspezifischen Daten.',
      importPath: '@/motion-arsenal/effects/premium/NoxCaseStudyGallery', usageJsx: '<NoxCaseStudyGallery variant="case-studies" layout="editorial" enableLightbox showCaptions />',
      props: [
        { key: 'variant', label: 'Content Preset', type: 'select', default: 'case-studies', options: ['case-studies', 'hospitality', 'local-business'] },
        { key: 'layout', label: 'Layout', type: 'select', default: 'editorial', options: ['editorial', 'bento', 'carousel'] },
        { key: 'showCaptions', label: 'Captions', type: 'boolean', default: true }, { key: 'enableLightbox', label: 'Lightbox', type: 'boolean', default: true },
        { key: 'autoplay', label: 'Autoplay', type: 'boolean', default: false }, { key: 'autoplayDelay', label: 'Autoplay Delay', type: 'range', default: 5200, min: 2400, max: 9000, step: 200 },
      ],
      improvementStatus: 'improved', lastImprovedAt: '2026-07-31T08:55:00.000Z', lastImprovedBy: 'foundry-live', improvementVersion: '1.0.0',
      improvementChangelog: ['Added a reusable production gallery with editorial, bento, and carousel layouts for NOX and customer websites.', 'Added accessible lightbox navigation, keyboard controls, touch swipe, lazy image loading, and custom item support.', 'Added hospitality, local-business, and NOX case-study presets with complete reduced-motion and mobile fallbacks.'],
      productionSafe: true, fullBleed: true,
    },
    Component: lazy(() => import('./NoxCaseStudyGallery')),
  },
  {
    meta: {
      id: 'premium-before-after-slider', name: 'NoxBeforeAfterSlider', displayName: 'NOX Before / After Slider', category: 'premium', sourceWebsite: 'nox-original', sourceFiles: ['NOX original production component'], mode: 'nox-adapted', complexity: 'low', dependencies: [],
      bestFor: ['Website-Redesign-Beweise', 'Brand-Refresh-Vergleiche', 'Local-SEO-Case-Studies', 'Renovierung und Beauty', 'Fotografie und Retusche'],
      performanceNotes: 'DOM/CSS-only mit einem nativen Range-Control. Pointer-Bewegung aktualisiert nur Clip-Path und State; keine Canvas-, WebGL- oder rAF-Kosten.',
      mobileNotes: 'Touch-Drag auf der gesamten Fläche, große 46px-Griffzone und optionale vertikale Ausrichtung.',
      reducedMotionNotes: 'Keine automatischen Übergänge. Vergleich, Drag, Tastatur und Labels bleiben vollständig funktionsfähig.',
      description: 'Zugänglicher Before/After-Vergleich mit horizontaler oder vertikaler Teilung, Touch-Drag, Tastatursteuerung, Kundenbildern und drei sofort nutzbaren Proof-Presets.',
      importPath: '@/motion-arsenal/effects/premium/NoxBeforeAfterSlider', usageJsx: '<NoxBeforeAfterSlider variant="website-redesign" position={52} orientation="horizontal" showLabels />',
      props: [
        { key: 'variant', label: 'Proof Preset', type: 'select', default: 'website-redesign', options: ['website-redesign', 'local-seo', 'brand-refresh'] },
        { key: 'position', label: 'Position', type: 'range', default: 52, min: 0, max: 100, step: 1 },
        { key: 'orientation', label: 'Orientation', type: 'select', default: 'horizontal', options: ['horizontal', 'vertical'] },
        { key: 'showLabels', label: 'Labels', type: 'boolean', default: true },
      ],
      improvementStatus: 'improved', lastImprovedAt: '2026-07-31T09:35:00.000Z', lastImprovedBy: 'foundry-live', improvementVersion: '1.0.0',
      improvementChangelog: ['Added a production-ready horizontal and vertical before/after comparison component.', 'Added pointer drag, native range keyboard control, custom images and labels, plus three customer-site presets.', 'Added mobile-sized controls and a complete reduced-motion-safe interaction model without runtime dependencies.'],
      productionSafe: true, fullBleed: true,
    },
    Component: lazy(() => import('./NoxBeforeAfterSlider')),
  },
  {
    meta: {
      id: 'premium-logo-reference-marquee', name: 'NoxLogoMarquee', displayName: 'NOX Logo & Reference Marquee', category: 'premium', sourceWebsite: 'nox-original', sourceFiles: ['NOX original production component'], mode: 'nox-adapted', complexity: 'low', dependencies: [],
      bestFor: ['Kundenlogos', 'Partner- und Technologie-Stacks', 'Presse-Erwähnungen', 'Social-Proof-Bänder', 'Referenz-Sektionen'],
      performanceNotes: 'CSS-only marquee mit einer transform-basierten Animation. Keine Messschleife, Canvas, WebGL oder JavaScript-Animation.',
      mobileNotes: 'Kompakte Karten und reduzierte Mindestbreite; Fade-Kanten bleiben pointer-frei.',
      reducedMotionNotes: 'Animation wird entfernt und alle Referenzen werden als zentriertes, umbrechendes Grid dargestellt.',
      description: 'Produktionsfähiges Logo- und Referenzband mit Kunden-, Partner- und Presse-Presets, Custom-Items, Richtungswechsel, Hover-Pause und Reduced-Motion-Grid.',
      importPath: '@/motion-arsenal/effects/premium/NoxLogoMarquee', usageJsx: '<NoxLogoMarquee variant="clients" speed={28} direction="left" pauseOnHover fadeEdges />',
      props: [
        { key: 'variant', label: 'Reference Preset', type: 'select', default: 'clients', options: ['clients', 'partners', 'press'] },
        { key: 'speed', label: 'Duration (s)', type: 'range', default: 28, min: 10, max: 80, step: 1 },
        { key: 'direction', label: 'Direction', type: 'select', default: 'left', options: ['left', 'right'] },
        { key: 'pauseOnHover', label: 'Pause on Hover', type: 'boolean', default: true },
        { key: 'fadeEdges', label: 'Fade Edges', type: 'boolean', default: true },
      ],
      improvementStatus: 'improved', lastImprovedAt: '2026-07-31T09:36:00.000Z', lastImprovedBy: 'foundry-live', improvementVersion: '1.0.0',
      improvementChangelog: ['Added a reusable CSS-only customer, partner, and press reference marquee.', 'Added custom items and links, direction, duration, hover pause, and optional edge fades.', 'Added a complete reduced-motion grid fallback and mobile-specific card sizing.'],
      productionSafe: true, fullBleed: true,
    },
    Component: lazy(() => import('./NoxLogoMarquee')),
  },
  {
    meta: {
      id: 'premium-glass-distortion-cards', name: 'NoxGlassCards', category: 'premium', sourceWebsite: 'active-theory', sourceFiles: ['docs/PROVENANCE.md (public provenance and rights classification)'], mode: 'nox-adapted', complexity: 'high', dependencies: [],
      bestFor: ['Service-/Modul-Karten', 'Case-Study-Grids', 'Rank-/Progression-Cards', 'Premium Angebots- und Pricing-Sektionen'],
      performanceNotes: 'Kontext-Budget 1: EIN WebGL-Canvas wandert zur aktiven Karte (dpr-Cap 1.5). Ruhende Karten sind reines CSS (Tilt + Gloss). Fünf Materialvarianten und drei Energieprofile teilen denselben Renderer; nie mehr als 1 aktiver Kontext.',
      mobileNotes: 'Touch bleibt WebGL-sparsam: keine dauerhafte Hover-Animation, vertikales Kartenlayout und statischer Gloss-Fallback. Variant-/Energy-Switcher bleiben bedienbar.', reducedMotionNotes: 'Kein Tilt, kein laufender Shader und keine Ambient-Rotation — statische Karten mit vollständig lesbarem Materialzustand.',
      description: 'Produktionsreife 3D-Glaskarten mit einem wandernden WebGL-Kontext, Pointer-Tilt, Fresnel-Rim, Linsen-Refraktion und fünf klar unterscheidbaren Materialsystemen.', importPath: '@/motion-arsenal/effects/premium/NoxGlassCards', usageJsx: '<NoxGlassCards variant="obsidian-caustic-deck" energy="charged" tilt={9} refraction={0.065} depth={1} />',
      props: [
        { key: 'variant', label: 'Material Variant', type: 'select', default: 'prism-command-grid', options: ['prism-command-grid', 'liquid-chrome-vault', 'obsidian-caustic-deck', 'signal-crystal-array', 'revenue-amber-monoliths'] }, { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'] },
        { key: 'tilt', label: 'Tilt (°)', type: 'range', default: 9, min: 0, max: 14, step: 0.5 }, { key: 'refraction', label: 'Refraction', type: 'range', default: 0.065, min: 0, max: 0.12, step: 0.005 }, { key: 'fresnel', label: 'Fresnel Power', type: 'range', default: 3.1, min: 1, max: 6, step: 0.1 }, { key: 'gridScale', label: 'Material Scale', type: 'range', default: 15, min: 6, max: 26, step: 1 }, { key: 'depth', label: 'Depth', type: 'range', default: 1, min: 0, max: 1.8, step: 0.1 }, { key: 'glassOpacity', label: 'Glass Opacity', type: 'range', default: 0.86, min: 0.45, max: 1, step: 0.05 }, { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true }, { key: 'showEnergySwitcher', label: 'Energy Switcher', type: 'boolean', default: true },
      ], productionSafe: true, clickToRun: false,
    }, Component: lazy(() => import('./NoxGlassCards')),
  },
  {
    meta: {
      id: 'premium-data-stream-journey', name: 'NoxDataStreamJourney', category: 'premium', sourceWebsite: 'krank-lusion', sourceFiles: ['docs/PROVENANCE.md (public provenance and rights classification)'], mode: 'nox-adapted', complexity: 'medium', dependencies: [],
      bestFor: ['„Vom Signal zum System“-Story-Sektionen', 'Pipeline-/Prozess-Visualisierung', 'Leadflow-Erklärung', 'Agenten-Orchestrierung', 'Conversion- und Revenue-Storytelling'], performanceNotes: 'Ein Canvas2D-Loop für alle Partikel, Rails und Impulsringe; Trail über Decay-Smear ohne History-Buffer. Fünf Geometrien und drei Energieprofile teilen denselben Canvas.', mobileNotes: 'Pointer-Störung bleibt optional; Tap erzeugt einen kurzen Impulsring. Labels verschwinden unter 460px, interne Switcher bleiben touch-bedienbar.', reducedMotionNotes: 'Ein statischer, vollständig lesbarer Frame mit Pfad, Stationen und Conversion-Front.', description: 'Produktionsreife Canvas2D-Datenstrom-Sektion mit fünf klar unterscheidbaren Geometrien und drei Energieprofilen.', importPath: '@/motion-arsenal/effects/premium/NoxDataStreamJourney', usageJsx: '<NoxDataStreamJourney variant="agent-swarm-routing" energy="charged" particleCount={70} trailLength={0.62} branchIntensity={1} />',
      props: [
        { key: 'variant', label: 'Stream Variant', type: 'select', default: 'revenue-river', options: ['revenue-river', 'agent-swarm-routing', 'conversion-helix', 'signal-storm', 'quantum-tunnel'] }, { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'] }, { key: 'particleCount', label: 'Particles', type: 'range', default: 70, min: 20, max: 140, step: 5 }, { key: 'speed', label: 'Speed', type: 'range', default: 0.8, min: 0.2, max: 2, step: 0.1 }, { key: 'disturb', label: 'Pointer Disturb', type: 'range', default: 0.6, min: 0, max: 1, step: 0.05 }, { key: 'progress', label: 'Progress (-1=Auto)', type: 'range', default: -1, min: -1, max: 1, step: 0.05 }, { key: 'trailLength', label: 'Trail Length', type: 'range', default: 0.62, min: 0, max: 1, step: 0.05 }, { key: 'branchIntensity', label: 'Branch Intensity', type: 'range', default: 1, min: 0, max: 1.8, step: 0.1 }, { key: 'labels', label: 'Labels', type: 'boolean', default: true }, { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true }, { key: 'showEnergySwitcher', label: 'Energy Switcher', type: 'boolean', default: true },
      ], productionSafe: true, fullBleed: true,
    }, Component: lazy(() => import('./NoxDataStreamJourney')),
  },
  {
    meta: {
      id: 'premium-timeline-orchestrator', name: 'NoxTimelineOrchestrator', category: 'premium', sourceWebsite: 'shopify-editions', sourceFiles: ['docs/PROVENANCE.md (public provenance and rights classification)'], mode: 'nox-adapted', complexity: 'medium', dependencies: [], bestFor: ['Process-/How-it-works-Sektionen', 'Operating-System-Story', 'Methoden-Timelines'], performanceNotes: 'Reines DOM+SVG, ein rAF-Loop, Transform/Opacity only. Light. Keine Canvas/WebGL-Kosten.', mobileNotes: 'Funktioniert unverändert; Nodes skalieren über cqw.', reducedMotionNotes: 'Sofort der fertige Endzustand, kein Auto-Loop.', description: 'Ein kompakter Timeline-Controller choreografiert Module, Verbindungen und CTA-Zustand über drei Story-Presets und drei Energieprofile.', importPath: '@/motion-arsenal/effects/premium/NoxTimelineOrchestrator', usageJsx: '<NoxTimelineOrchestrator progress={-1} playSpeed={0.16} overshoot />',
      props: [{ key: 'progress', label: 'Progress (-1=Auto)', type: 'range', default: -1, min: -1, max: 1, step: 0.05 }, { key: 'playSpeed', label: 'Auto Speed', type: 'range', default: 0.16, min: 0.05, max: 0.5, step: 0.01 }, { key: 'overshoot', label: 'Overshoot Ease', type: 'boolean', default: true }, { key: 'variant', label: 'Story Preset', type: 'select', default: 'revenue-os', options: ['revenue-os', 'agent-ops', 'launch-sequence'] }, { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'] }, { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true }, { key: 'showLegend', label: 'Legend', type: 'boolean', default: true }], productionSafe: true, fullBleed: true,
    }, Component: lazy(() => import('./NoxTimelineOrchestrator')),
  },
  {
    meta: {
      id: 'premium-signal-particles', name: 'NoxSignalParticles', category: 'premium', sourceWebsite: 'shopify-editions', sourceFiles: ['docs/PROVENANCE.md (public provenance and rights classification)'], mode: 'nox-adapted', complexity: 'low', dependencies: [], bestFor: ['Hero-Akzente', 'CTA-Momente', 'Sektions-Übergänge'], performanceNotes: 'Ein begrenzter Canvas2D-Loop für alle Sparks.', mobileNotes: 'Ohne Pointer nutzt der Effekt Auto-Drift; Count bleibt skalierbar.', reducedMotionNotes: 'Sparks stehen statisch an ihren Zielpositionen.', description: 'Agentische Signalpartikel mit fünf Narrativen, drei Energieprofilen und vier Choreografie-Modi.', importPath: '@/motion-arsenal/effects/premium/NoxSignalParticles', usageJsx: '<NoxSignalParticles count={42} mode="auto" intensity={1} />',
      props: [{ key: 'count', label: 'Count', type: 'range', default: 42, min: 12, max: 90, step: 2 }, { key: 'mode', label: 'Mode', type: 'select', default: 'auto', options: ['auto', 'orbit', 'swarm', 'settle'] }, { key: 'intensity', label: 'Intensity', type: 'range', default: 1, min: 0.2, max: 1.5, step: 0.05 }, { key: 'sparkSize', label: 'Spark Size', type: 'range', default: 1.2, min: 0.6, max: 2.4, step: 0.1 }, { key: 'variant', label: 'Narrative', type: 'select', default: 'agent-constellation', options: ['agent-constellation', 'revenue-funnel-flight', 'forge-ember-murmuration', 'signal-resonance-vortex', 'command-formation'] }, { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'] }, { key: 'trailPersistence', label: 'Trail Persistence', type: 'range', default: 0.7, min: 0, max: 1, step: 0.05 }, { key: 'linkDistance', label: 'Link Distance', type: 'range', default: 90, min: 0, max: 180, step: 5 }, { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true }, { key: 'showEnergySwitcher', label: 'Energy Switcher', type: 'boolean', default: true }, { key: 'showModeSwitcher', label: 'Mode Switcher', type: 'boolean', default: true }], productionSafe: true, fullBleed: true,
    }, Component: lazy(() => import('./NoxSignalParticles')),
  },
  {
    meta: {
      id: 'premium-terminal-scan-reveal', name: 'NoxTerminalScanReveal', category: 'premium', sourceWebsite: 'nox-original', sourceFiles: ['effects/hero (TerminalBootStream)', 'effects/system (RankRevealSequence)'], mode: 'nox-adapted', complexity: 'low', dependencies: [], bestFor: ['CTA-Sektionen', 'Assessment-/Audit-Funnel', 'Lead-Recovery', 'Agenten-Onboarding', 'Loading-/Transition-Momente'], performanceNotes: 'DOM/CSS + ein einzelner rAF-Loop nur während Boot und Scan; danach 0 Laufzeitkosten. Varianten und Energieprofile teilen dieselbe Sequenz-Engine.', mobileNotes: 'Responsives Auto-fit-Grid, kompakte touch-fähige Switcher und keine Pointer-Abhängigkeit.', reducedMotionNotes: 'Sofort der vollständige Endzustand mit lesbarem Protokoll, Modulen und CTA; keine Caret-, Scan- oder Reveal-Bewegung.', description: 'Produktionsreife Terminal-CTA-Sequenz mit System Audit, Lead Recovery und Agent Readiness Narrativen. Drei Energieprofile steuern Tempo, Scanbreite und Glow, ohne zusätzliche Runtime-Abhängigkeiten.', importPath: '@/motion-arsenal/effects/premium/NoxTerminalScanReveal', usageJsx: '<NoxTerminalScanReveal variant="lead-recovery" energy="charged" speed={1} scanDuration={1.6} autoStart />',
      props: [{ key: 'speed', label: 'Speed', type: 'range', default: 1, min: 0.5, max: 2, step: 0.1 }, { key: 'scanDuration', label: 'Scan Duration (s)', type: 'range', default: 1.6, min: 0.8, max: 3, step: 0.1 }, { key: 'autoStart', label: 'Auto Start', type: 'boolean', default: true }, { key: 'variant', label: 'Narrative', type: 'select', default: 'system-audit', options: ['system-audit', 'lead-recovery', 'agent-readiness'] }, { key: 'energy', label: 'Energy', type: 'select', default: 'charged', options: ['calm', 'charged', 'overdrive'] }, { key: 'showVariantSwitcher', label: 'Variant Switcher', type: 'boolean', default: true }, { key: 'showEnergySwitcher', label: 'Energy Switcher', type: 'boolean', default: true }, { key: 'showReplay', label: 'Replay', type: 'boolean', default: true }], productionSafe: true,
    }, Component: lazy(() => import('./NoxTerminalScanReveal')),
  },
];
