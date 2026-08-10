import React from 'react';
import type { EffectEntry } from '../../types';
import { ConceptEffectPreview } from './ConceptEffectPreview';

const entries = [
  ['Lenticular Tilt', 'Interlaced Multi-Frame-Bild reagiert auf Tilt und Pointer.', 'WebGL Textur-Slices.'],
  ['Magnetic Field Cards', 'Karten ziehen sich in einem begrenzten Feld zum Cursor.', 'Distanz-basierte Transform-Offsets.'],
  ['Backdrop Blur Grain Overlay', 'Material-Overlay aus Backdrop Blur, Grain und Goldkante.', 'backdrop-filter mit statischem SVG-Grain.'],
  ['View Transition API Cross-Fade', 'Dunkelraum-optimierter nativer Crossfade für DOM-Zustände.', 'document.startViewTransition mit Fallback.'],
  ['GSAP Flip Gallery Morph', 'Galerie-Kachel wächst per FLIP in den Detail-View.', 'FLIP transforms mit Fokus-Dialog-Fallback.'],
  ['Tumbler Vault OTP', 'Mechanische OTP-Eingabe mit rollenden Ziffern.', 'CSS transform-Räder, Paste und Keyboard Support.'],
  ['Peel Reveal Modal', 'Eine aufrollende Ecke enthüllt einen Dialog.', 'Gradient-Curl und CSS transforms.'],
  ['Canvas Line Typography', 'Linien-Ornamente bilden eine technische Marken-Wordmark.', 'Canvas einmalig bei Mount und Resize.'],
  ['CRT Screen Text', 'Text auf einem alten CRT-Monitor: RGB-Aperturgrille, horizontales Wobble und kurze Glitch-Aussetzer — Terminal-/Retro-Signatur mit NOX-Goldphosphor.', 'CSS-only: Aperturgrille als repeating-linear-gradient-Overlay (mix-blend-mode), Text-Wobble über translateY-Keyframes mit unregelmäßigen Steps, Glitch-Slices via ::before/::after mit clip-path.'],
  ['Cube Spin Route Transition', 'Seiten-/Sektionswechsel als 3D-Würfel: Die alte Ansicht dreht um die Y-Achse weg, die neue kommt von hinten in den Blick — ein physischer, räumlicher Wechsel für Portfolio- und Case-Study-Flows.', 'CSS 3D: zwei Panels in preserve-3d-Container, `rotateY` 0→-90 / 90→0 mit Feder-Easing; Route-Wechsel triggert Klassen-Toggle (React), Fokus-Management + `aria-live` für Screenreader; Fallback: Fade-Slide ohne 3D. `backface-visibility: hidden`, Gold-Kante an der Drehachse.'],
  ['Distorted Button Image Reveal', 'Button-Hover enthüllt ein Bild hinter dem Text — mit weicher Distortion (SVG-Displacement), die beim Öffnen nachlässt: Text bleibt lesbar, Bild \'bricht durch\'.', 'JS+CSS: Bild als absolut positionierter Layer mit SVG feTurbulence/feDisplacementMap; scale-Transition von .2→1 + Displacement-Amplitude 30→0 via CSS-Variable.'],
  ['Dynamic Palette Gradient', 'Hintergrund-Gradient, der die Farbpalette live aus dem DOM zieht: dominante Sektion-Farben werden als Gold-kompatible Verläufe gespiegelt.', 'JS: Palette-Extraktion (Canvas-Sampling beim InView), CSS-Vars → linear-gradient, weiche Übergänge via transition.'],
  ['Dynamic Tooltip Fragments', 'Tooltips erscheinen nicht als Block, sondern als Fragment-Reveal: mehrere Slices/Teile fliegen gestaffelt zusammen (z. B. bei Data-Punkten, Diagrammen, Features).', 'Tooltip-Inhalt in 4-8 Fragment-Spans zerlegt; jedes Fragment bekommt deterministische (det-PRNG) Verzögerung + eigene Richtung, CSS-Keyframes. Position via transform, keine Layout-Animation.'],
  ['Frame Repeat Image Transition', 'Beim Klick auf ein Grid-Bild fliegen mehrere „Frames" (Kopien desselben Bilds) entlang eines Pfads zum Detail-Panel, das sich per Clip-Path öffnet — wie ein Daumenkino, das das Bild zur Vergrößerung trägt. NOX-Variante der Codrops-„Repeating Image Transition".', 'JS+CSS: Klick-Item erzeugt N „Mover"-Elemente mit demselben Hintergrundbild (background-image), die per transform (translate + rotate + scale) gestaffelt von der Grid-Position zum Panel-Fokus fliegen; Clip-Path öffnet danach das Ziel-Panel. Pfad linear oder Sinus-Welle, Rotation/Wobble deterministisch über `det(i, salt)` — kein Math.random.'],
  ['Radar Sweep Glitch Button', 'Button mit Radar-Charakter: Beim Hover sweep-t eine glitchige Scanlinie über die Fläche, gefolgt von kurzen RGB-Überlagerungen — CTA mit \'System-aktiv\'-Gefühl.', 'CSS-only: Scanline als ::before (Gradient, translateX-Sweep mit steps() für Glitch-Ruckeln), RGB-Kopie als ::after mit mix-blend-mode und kurzer Opacity.'],
  ['Radial Context Menu', 'Rechtsklick (oder Long-Press) öffnet um den Pointer ein radiales Gold-Menü: Die Aktionen fächern sich auf einem Kreis mit Feder-Stagger auf, das Zentrum trägt das Schließen-Kreuz. Tastatur: Pfeiltasten rotieren die Auswahl, Enter bestätigt, ESC schließt — `role="menu"` sauber verdrahtet.', 'JS positioniert die Items per `transform: rotate(a) translate(r) rotate(-a)` um den Pointer (einmalig beim Öffnen, kein rAF); CSS-Transition mit `--i`-Stagger + Feder-Easing (cubic-bezier mit Overshoot). Zentrum = Schließen. Fokus-Falle im Menü, `aria-activedescendant` oder Pfeiltasten-Rotation; Klick außerhalb/ESC schließt. Position wird gegen Viewport-Ränder geclampt.'],
  ['Scan Focus Text Reveal', 'Text liegt blurrig im Hintergrund; ein Sucher/Viewfinder streicht darüber und zieht die Zeichen in die Schärfe — präziser, maschineller Reveal für Hero-Headlines.', 'JS+CSS: Zeichenweise blur-Maske — ein Gradient (scharfer Kern) fährt mit transform über den Text; blur() pro Zeichen via CSS-Variable, getBoundingClientRect für Trigger.'],
  ['Scratch Gold Reveal', 'Eine Goldfolie (deterministisches Glitter-/Noise-Muster auf Canvas) bedeckt den Content; der User kratzt sie mit Pointer/Touch frei. Ab einem Schwellwert zerfällt die Folie mit einem Gold-Funken-Burst — Rubbellos-Premium für Promos, Coupons und „Verdeckte Features".', 'Canvas 2D-Overlay: Folie = Gold-Verlauf + deterministisches Glitter (det()-PRNG-Punkte) + leichte Textur. Kratzen: Pointer-Events zeichnen radiale Löcher mit `globalCompositeOperation: "destination-out"`. Fortschritt = erfasste Pixel / Gesamtfläche (alle ~8 Frames stichprobenartig). Ab `revealThreshold` blendet das Canvas mit `opacity`-Transition aus und ein deterministischer Funken-Burst (det()-Positionen) feuert einmalig. `aria-hidden` auf dem Canvas, Inhalt darunter ist echtes DOM.'],
  ['Scroll Layout Formation', 'Scroll-getriebene „Layout-Assembly": In einer gepinnten Sektion versammeln sich verstreute Karten/Glyphen Stück für Stück zu einer Formation (Raster, Reihen, Kreis, Spalten) — die finale Komposition ist das Ziel der Choreografie. NOX-Variante der Codrops-„On-Scroll Layout Formations".', 'JS+CSS mit Sticky-Pinning: Container `position: sticky` (oder ScrollTrigger-Proxy), Items starten mit deterministischen Offsets (`det(i, salt)` → Zielposition in %) und fahren auf scroll-getriebene Ziel-Transforms (translate/rotate/scale). Alternativ reine CSS-Variante mit `animation-timeline: view()` und `animation-range` pro Item. Formation als Prop wählbar.'],
  ['Sheet Drawer Slide', 'Bottom-Sheet-Drawer mit Feder-Easing: gleitet von unten herauf, Snap-Points bei 25/50/75 %, Swipe-to-Dismiss, Backdrop-Blur — Gold-Griffleiste, nativ via `<dialog>` + CSS `scroll-snap`. NOX-Variante als React-Komponente.', 'JS: `<dialog showModal()>` für Fokus-Trap + Escape nativ; CSS `scroll-snap` auf der Sheet-Inhaltsfläche erzeugt die Snap-Points (75/50/25 %), `overscroll-behavior: contain` verhindert Hintergrund-Scroll. Swipe-to-Dismiss via passiven `pointer`-Listenern (nur Start/Bewegung/Ende — kein rAF-Loop; Bewegung via `transform` direkt). Enter = `translateY(100%) → 0` mit Feder-Cubic-Bezier; Backdrop = `backdrop-filter: blur` + Fade. Alles Transform/Opacity — außer dem einmaligen Backdrop-Blur.'],
  ['Sorting Visualizer', 'Sortier-Algorithmen als deterministische Gold-Balken-Show: Bubble/Quick/Merge sortieren live mit det()-Startdaten und einstellbarem Schritt-Takt — Datenprozesse werden zur Choreografie (System-/Debug-Ästhetik).', 'JS+CSS: Balken-Höhen aus det()-PRNG-Array (kein `Math.random`), Algorithmus erzeugt vorab eine Schritt-Liste (Vergleich/Swap/Mark), Abspielen per Takt-Intervall; aktive Vergleiche gold, fertig = grün-Gold. Kein per-Frame-Rendering — nur Tausch-Commits via `transform: scaleY`.'],
    ['Step Flow Wizard', 'Mehrstufiges Formular als Gold-Wizard: Die Fortschrittslinie zeichnet sich Schritt für Schritt, Connector-Kreise füllen sich mit Feder-Easing, der nächste Schritt fährt ein — Orientierung ohne Hektik (NOX-Variante des Multi-Step-Formulars).', 'JS+CSS: Steps als Liste mit `::before`-Connector; Zustände via `[data-state=done|active|todo]`; Linien-Fortschritt als `transform: scaleX` (Compositor), Panel-Wechsel als translateX/opacity-Transition; aktiver Schritt gold, erledigte Schritte mit Check-Icon. Zustand in React-State, kein Router nötig.'],
  ['Strikethrough Explain Modal', 'Erklär-Modal mit Durchstreich-Animation: Falsche Antwort wird mit Gold-Strich durchgestrichen, danach klappt die richtige Erklärung auf.', 'CSS + minimal JS: Strikethrough als animierte Linie (scaleX + skew), Modal-Panel mit Spring-Entrance, aria-live für Ergebnis.'],
  ['Strobe Light Text', 'Hartes Strobe-Blinken für Text: kurze Weiß-Gold-Blitz-Salven mit abklingender Frequenz — Aufmerksamkeits-Moment für Alerts und Countdowns.', 'CSS-only: opacity-Keyframes mit steps() für harte Blitze; Frequenz-Rampen über zwei verschachtelte Animationen (schnelle Salve → langsames Nachglühen).'],
  ['SVG Mascot Pulse', 'Ein animiertes SVG-Maskottchen („NOX Sentinel") mit Wellen-/Puls-Animation: Arme/Aura schwingen in überlagerten Sinuswellen, beim Hover reagiert es mit einem Aufmerksamkeits-Puls, beim Klick mit einem Bestätigungs-Nicken. NOX-Variante des Reverse-Engineerings der Claude-AI-Mascot-Animationen.', 'SVG + CSS-Animationen: Arme/Aura als Pfade mit `transform-origin` an den Schultern; Wellenbewegung durch überlagerte Sinus-Komponenten (`calc()` mit `sin()` in CSS oder deterministische Phasen via `det(i, salt)` als CSS-Vars). Hover/Klick schalten Klassen mit Federtransitionen. Kein JS pro Frame — alles CSS-Keyframes auf transform/opacity.'],
  ['Tearing Photo Drag', 'Bild zerreißt beim Ziehen in Gold-Splitter: Drag-Offset reißt das Foto vertikal auf, Fragmente fallen mit deterministischem PRNG.', 'Canvas + Drag-Interaktion: Tear-Offset aus Pointer-Velocity, Splitter-Pfade via det(i,salt)-PRNG, Gold-Splitter-Overlay auf dunklem Foto.'],
  ['Terminal Typewriter Hover', 'Log-/Terminal-Zeilen: Beim Hover blinkt der Cursor und die Zeile ‚tippt\' sich Buchstabe für Buchstabe nach — Daten-Sektionen werden lebendig.', 'Zeile als data-text; Hover startet CSS-Stepper-Animation auf width/characters (ch-Einheit) mit steps(), Cursor blinkt separat. Kein JS-Intervall; prefers-reduced-motion: sofort voll.'],
  ['Three.js Particle Text Reveal', 'Headline erscheint aus einer Partikel-Wolke: Tausende Punkte formen sich per drei.js zum Text (Canvas-Text als Target-Map) und explodieren beim Hover wieder — Premium-Statement.', 'three.js: Text via Canvas-Text → Pixel-Sampling (hell = Partikel), Points-Instancing mit Positionen; Transition animiert den Mix-Faktor (Wolke→Text), Hover stört lokal mit Sinus.'],
  ['Typewriter Command Palette', 'Cmd+K-Palette im Terminal-Look: Eingabe tippt in Monospace, Vorschläge erscheinen gestaffelt mit Cursor-Flair, aktiver Treffer gold-markiert (Fuzzy-Highlight).', 'Modal mit backdrop-blur; Eingabezeile + Ergebnisliste; Stagger-Entry via transition-delay (det-PRNG), Fuzzy-Match-Highlight in Gold (mark). Kein externes Fuzzy-Lib — kleiner Score-Snippet.'],
  ['Vertical Slit Slideshow', 'Slideshow mit vertikalen Gold-Slits: Beim Wechsel zerfällt das Bild in Streifen, die gestaffelt kippen und das nächste freigeben.', 'CSS 3D + JS-Steuerung: N Slit-Streifen mit translateZ/RotateX, Stagger-Delays, Gold-Kanten-Licht.'],
  ['View Transition List Filter', 'Filter-Chips sortieren eine Liste: jedes Item trägt eine eigene `view-transition-name`, das DOM-Update läuft in `document.startViewTransition()` — der Browser morpht die Items nativ an ihre neue Position (FLIP ohne Library). Abgrenzung zu [[View Transition API Cross-Fade]]: dort Zustands-Crossfade, hier Item-Reorder-Choreografie.', 'Jedes List-Item bekommt eine deterministisch generierte `view-transition-name` (aus der Item-ID, sanitized — nie `index` als Name, sonst vertauschen sich Snapshot-Zuordnungen bei Reorder). Der Filter-Click ruft `document.startViewTransition(() => setFilter(f))` auf; der Browser snapshotet alte und neue Item-Positionen und animiert sie (natives FLIP). Eintritts-Animation neuer Items über `::view-transition-new(...)`-Keyframes; `prefers-reduced-motion`-Guard + Feature-Detect (Fallback: direkter Update).'],
  ['Warp Tunnel Depth', '⛔ **DUPLIKAT** — Kern-Mechanik (Gold-Streaks radial aus der Bildmitte, scroll-reaktiv, Tiefenstaffelung) ist bereits als Default-Variante `section-warp` in **NoxStarfieldDrift** umgesetzt. Batch-2-Review 08.08.2026: nicht bauen, stattdessen Verweis hier. Ersatzkandidat war Star Rating Gold Pop (forms, gebaut).', 'CSS Scroll-Driven Animations: Streaks sind DOM-Elemente (oder ein Canvas), deren `--speed`-CSS-Variable an `animation-timeline: scroll()` gekoppelt ist — Scroll-Tempo übersetzt sich direkt in Streak-Länge/Geschwindigkeit, kein rAF. Positionen/Winkel deterministisch via det()-PRNG (bei statischem DOM als CSS-Vars gerendert). Drei Ebenen (nah/mittel/fern) mit `scale` + unterschiedlichen `animation-range`s für Tiefe. Canvas-Variante: nur bei sehr vielen Streaks, rAF dann nur während aktiven Scrollens.'],
  ['WebGL Water Distortion Slider', 'Bild-Slider, bei dem Ziehen eine Wasser-Verzerrung auslöst: das aktuelle Bild entsättigt sich und wellt sich hinter dem neu hereinziehenden — Premium-Galerie-Feeling.', 'WebGL (Shader): Texturen beider Bilder, Displacement via fbm-Rauschen das mit Drag-Vektor skaliert; Übergang = Progress von 0→1 mit easeOut; Fallback: CSS-Blur-Slide.'],
  ['WebGPU Dust Dissolve Text', 'MSDF-Headline löst sich beim Scrollen in einen deterministischen Gold-Staub auf und setzt sich wieder zusammen — WebGPU/TSL-Showcase für Studio-Sektionen.', 'WebGPU + TSL (Three.js): MSDF-Text als Partikelquelle, Dissolve-Fortschritt via Uniform; Partikelpositionen aus det(i, salt)-PRNG vorberechnet. Fallback: CSS-Filter-Version (blur+opacity) ohne Partikel.'],
    ] as const;

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Provenance for concepts intentionally removed from the visible gallery after consolidation. */
export const CONSOLIDATED_CONCEPTS: Partial<Record<(typeof entries)[number][0], string>> = {
  'Magnetic Field Cards': 'cursor-magnetic-cta',
  'Warp Tunnel Depth': 'bg-nox-starfield-drift (Variante section-warp)',
  'CRT Screen Text': 'system-crt-screen-text',
  'Cube Spin Route Transition': 'transitions-cube-spin-route-transition',
  'Distorted Button Image Reveal': 'originkit-distorted-button-image-reveal',
  'Dynamic Palette Gradient': 'bg-dynamic-palette-gradient',
  'Dynamic Tooltip Fragments': 'overlays-dynamic-tooltip-fragments',
  'Frame Repeat Image Transition': 'transitions-frame-repeat-image-transition',
};

export const CONCEPTS_CATALOG: EffectEntry[] = entries
  .filter(([name]) => !CONSOLIDATED_CONCEPTS[name])
  .map(([name, description, technicalBasis], tone) => ({
    meta: {
      id: `concept-${slug(name)}`,
      name: name.replace(/[^A-Za-z0-9]/g, ''),
      displayName: name,
      category: 'concepts',
      sourceWebsite: 'nox-original',
      sourceFiles: [`NOX-Arsenal_Neue-Effekte_2026-08-01-02.zip / Effekte/${name}.md`],
      mode: 'nox-concept',
      complexity: technicalBasis.includes('WebGL') || technicalBasis.includes('GSAP') ? 'high' : 'medium',
      dependencies: [],
      bestFor: ['Experimentelle Motion- und Interaktionsprototypen'],
      performanceNotes: 'Interaktive Prototyp-Preview: Produktions-Performance noch nicht validiert.',
      mobileNotes: 'Mobile-Verhalten vor Produktion separat verifizieren.',
      reducedMotionNotes: 'Statische, vollständig lesbare Endansicht ist vorgesehen.',
      description,
      technicalBasis,
      importPath: '@/motion-arsenal/effects/concepts',
      usageJsx: `<${name.replace(/[^A-Za-z0-9]/g, '')} />`,
      props: [],
      updatedAt: '2026-08-02T10:09:00.000Z',
      improvementStatus: 'needs-review',
      improvementVersion: '0.1.0',
      productionSafe: false,
      status: 'experimental',
    },
    Component: () => <ConceptEffectPreview kind={slug(name)} name={name} tone={tone} />,
  }));
