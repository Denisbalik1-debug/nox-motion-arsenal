# Motion Engine Learning Cards

Stand: 2026-07-04. Zweck: verstehen, WAS die jeweilige Engine tut, WANN man sie nimmt —
und warum das Arsenal bewusst fast alles hand-coded macht.

**Installierte Stacks (geprüft):**

| Library | Motion Arsenal | noxlabs.net (Documents) |
|---|---|---|
| three | ✅ ^0.178 (nur echte 3D-Effekte) | ❌ |
| @react-three/fiber / drei | ❌ | ❌ |
| theatre.js | ❌ | ❌ |
| lenis | ❌ | ❌ |
| framer-motion | ❌ | ✅ ^12 |
| gsap / anime / rive | ❌ | ❌ |

Entscheidung dieser Ausbaustufe: **nichts nachinstallieren.** Alle 5 neuen Effekte laufen
über die Arsenal-eigenen Hooks (`useRafLoop`, `useCanvas2D`, `useShaderQuad`) bzw. auf
noxlabs.net als selbstständige Ports ohne neue Dependencies. Theatre/Lenis-Prinzipien
werden als eigener Timeline-Controller nachgebaut (siehe Karte 4/5).

## 1. three.js

- **Wofür?** Voll-3D im Browser: Szenen, Kameras, Meshes, Materials, InstancedMesh.
- **Wann nutzen?** Echte 3D-Geometrie (rotierende Objekte, Instancing von 100+ Meshes,
  Kamerafahrten). Im Arsenal nur dann — per Vendor-Chunk getrennt gebundelt.
- **Wann nicht?** Für 2D-Felder, Partikel-Sprites, Shader-Flächen — da reicht Canvas2D
  oder ein Fullscreen-Quad-Shader (deutlich kleiner, kein 600-kB-Chunk).
- **NOX-Beispiel:** 3D-Instancing-Effekte im Arsenal (three-Chunk); die 5 neuen
  Premium-Effekte brauchen es NICHT.

## 2. React Three Fiber (R3F)

- **Wofür?** three.js deklarativ als React-Komponenten (`<mesh>`, `<Canvas>`).
- **Vorteile in React:** Szene folgt React-State, Hooks (`useFrame`), Ökosystem (drei).
- **Risiken:** Re-Render-Fallen (State im Frame-Loop = Performance-Tod), zusätzliche
  Abstraktionsschicht beim Debugging, Versions-Kopplung an three.
- **NOX-Beispiel:** bewusst nicht eingesetzt — die Arsenal-Effekte halten Frame-State in
  Refs außerhalb von React (gleiche Idee, ohne Library).

## 3. drei

- **Wofür?** Helper-Sammlung für R3F: OrbitControls, Text, Environment, ScrollControls,
  MeshTransmissionMaterial (Glass!), Instances.
- **Nützliche Helpers:** `MeshTransmissionMaterial` (Refraktion), `Float`, `Sparkles`,
  `ScrollControls` — Shopify-Editions-Klasse nutzt genau solche Bausteine.
- **NOX-Beispiel:** Referenzwissen. Unser Glass-Look entsteht stattdessen im eigenen
  Fragment-Shader (Fresnel + UV-Offset) — eine Karte, ein Kontext, kein r3f nötig.

## 4. Theatre.js

- **Wofür?** Timeline-/Keyframe-Orchestrierung mit GUI-Studio; Shopify Editions nutzt es
  als Single Source of Truth für alle Szenen-Uniforms.
- **Timeline/Choreografie:** benannte Sequenzen, Keyframes auf beliebige Objekte,
  scrubbing; scroll-Position wird auf Sequence-Position gemappt.
- **Unterschied zu CSS-Animationen:** CSS animiert Eigenschaften unabhängig; Theatre
  choreografiert VIELE Objekte auf EINER Zeitachse mit editierbaren Keyframes.
- **NOX-Beispiel:** `NoxTimelineOrchestrator` implementiert das Prinzip als ~40-Zeilen
  Keyframe-Controller (`stages[] + scrollProgress → interpolierte States`) — die
  Erkenntnis: das Konzept ist wertvoller als die 60-kB-Dependency.

## 5. Lenis

- **Wofür?** Smooth-Scrolling: entkoppelt natives Scrollen von der gerenderten Position
  (lerp), Basis für butterweiche scroll-synced Szenen.
- **Risiken:** kapert das native Scrollverhalten (Accessibility!), Konflikte mit
  position:sticky und Browser-Suchsprüngen; auf Mobile oft kontraproduktiv.
- **NOX-Beispiel:** nicht eingesetzt. Unsere scroll-synced Effekte lesen den echten
  Scroll-Progress (`useScrollProgress`) und glätten NUR die Effekt-Antwort per `damp()` —
  Lenis-Feeling im Effekt, natives Scrollen bleibt unangetastet.

## 6. Framer Motion / Motion

- **Wofür?** Deklarative UI-Animationen in React: `whileInView`, Varianten, Layout-
  Animationen, `useReducedMotion`.
- **UI-Microinteractions:** Reveals, Stagger, Hover/Tap-States, Präsenz-Übergänge.
- **NOX-Beispiel:** noxlabs.net nutzt es bereits für alle Sektions-Reveals. Die neuen
  Premium-Effekte docken daran an (Reveal-Wrapper), machen ihr Innenleben aber mit
  rAF/Canvas — framer-motion ist für Frame-für-Frame-Partikelphysik das falsche Werkzeug.

## 7. Shader / GLSL

- **Was ist ein Fragment-Shader?** Ein Programm, das pro Pixel läuft und dessen Farbe
  berechnet — auf der GPU, massiv parallel. Ein Fullscreen-Dreieck + Fragment-Shader
  ist die Basis fast aller „Atmosphären"-Effekte bei KRANK/Active Theory.
- **Was sind Uniforms?** Globale Eingabewerte pro Frame (u_time, u_resolution,
  u_pointer, eigene Regler) — die Brücke JS→Shader.
- **Noise:** pseudozufällige, weiche Wertefelder (value noise via hash+Interpolation).
  **FBM:** mehrere Noise-Oktaven aufsummiert → wolkige Strukturen.
  **Domain-Warp:** Noise-Koordinaten mit Noise verschieben → organische Verwerfungen.
  **Fresnel:** Leuchtkante ∝ (1 − N·V)^p — flach angeschaute Flächen leuchten stärker;
  DER Glass-Edge-Trick.
- **NOX-Beispiel:** `GLSL_NOISE`-Baustein in `lib/canvasUtils.ts`; `NoxGlassCards`
  nutzt Fresnel + UV-Refraktion, `HoverDistortionShader` numerischen Curl aus fbm.

## 8. Performance-Regeln (verbindlich für alle neuen Effekte)

- **WebGL-Kontextlimit:** Browser erlauben ~8–16 Kontexte, dann sterben die ältesten.
  Regel: max 1–3 aktive Kontexte pro Seite; Karten-Grids teilen sich EINEN Kontext
  (nur aktive Karte) oder nutzen CSS-Fallback.
- **IntersectionObserver:** Effekte mounten/laufen nur im Viewport (`useInView`);
  Achtung: in Hidden Tabs friert rAF ein — Logik nie von „ist sichtbar" allein abhängig machen.
- **reduced-motion:** `usePrefersReducedMotion()` → statischer, sinnvoller Frame
  (frozenTime), keine leere Fläche.
- **Mobile Fallback:** Touch hat kein Hover — Auto-Drift oder statische Variante;
  Partikelzahl runter, Effekte ggf. ganz statisch.
- **dpr caps:** Canvas2D max 2, WebGL max 1.5 — Retina-Fullres ist der häufigste
  unsichtbare Performance-Killer.
- **lazy mount:** `lazy(() => import(...))` + click-to-run für heavy Previews.
- **error boundaries:** Heavy-Previews in Boundary wrappen — ein Shader-Fehler darf
  nie die Seite reißen.
- **dt-Clamp:** `Math.min(dt, 1/20)` gegen Background-Tab-Physik-Explosionen (Active-Theory-Praxis).
