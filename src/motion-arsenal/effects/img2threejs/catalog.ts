import { lazy } from 'react';
import type { EffectEntry } from '../../types';

// Assets rebuilt from a reference image via img2threejs (github.com/hoainho/
// img2threejs, Apache-2.0) — an agent-vision pipeline, not an ML mesh model:
// the agent inspects the reference, authors an ObjectSculptSpec (component
// hierarchy, materials, attachment contracts), and the skill's scripts
// generate a real, editable Three.js factory from it, gated pass-by-pass
// against a screenshot comparison. Output is genuine THREE.Group-producing
// TypeScript — not a binary GLB — which is why these effects also expose a
// "DOWNLOAD .GLB" button (via THREE.GLTFExporter) for anyone who wants an
// reusable procedural asset elsewhere.
export const IMG2THREEJS_CATALOG: EffectEntry[] = [
  {
    meta: {
      id: 'img2threejs-nox-orbital-station',
      name: 'NoxOrbitalStation',
      category: 'img2threejs',
      sourceWebsite: 'img2threejs',
      sourceFiles: [
        'github.com/hoainho/img2threejs — forge/stage2_spec + forge/stage3_build pipeline',
        'docs/PROVENANCE.md (public provenance and rights classification)',
      ],
      mode: 'nox-adapted',
      complexity: 'heavy',
      dependencies: ['three'],
      bestFor: ['Hero-Centerpiece', 'Produkt-/Asset-Showcase', 'Beweis: Bild → echtes 3D-Objekt'],
      performanceNotes: 'Echtes three.js: 16 Komponenten (Spine-Stack, Hub, 4 Solar-Arme, Dish+Boom, Docking-Node), OrbitControls fürs Drag-Rotieren, GLTFExporter für echten .glb-Download.',
      mobileNotes: 'OrbitControls unterstützen Touch-Drag nativ.',
      reducedMotionNotes: 'Auto-Rotate pausiert, Objekt steht still, Drag-Orbit bleibt möglich.',
      description:
        'Aus einem einzelnen Referenzbild (NOX-Orbitalstation-Render) über die img2threejs-Skill rekonstruiert: Agent-Vision liest das Bild, Python-Scripts erzwingen eine echte Spec (Komponenten, Attachments, Materialien), daraus generiert eine deterministische Pipeline den Three.js-Code — kein ML-Mesh, kein Photogrammetrie-Blob. Aktuell Blockout-Pass: Silhouette und Hierarchie stimmen (Spine, Hub, X-Solar-Arme, Dish, Docking-Node), Materialien sind noch Platzhalter. "DOWNLOAD .GLB" exportiert die Szene als echte Datei.',
      importPath: '@/motion-arsenal/effects/img2threejs/NoxOrbitalStation',
      usageJsx: '<NoxOrbitalStation />',
      props: [],
      productionSafe: false,
      status: 'experimental',
      clickToRun: true,
      fullBleed: true,
    },
    Component: lazy(() => import('./NoxOrbitalStation')),
  },
];
