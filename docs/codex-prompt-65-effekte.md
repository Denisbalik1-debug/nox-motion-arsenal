# NOX Motion Arsenal — Codex-Prompt: die verbleibenden 65 Konzepte zu echten Effekten bauen

> Kopiere alles zwischen den Markern ─── PROMPT START ─── und ─── PROMPT ENDE ───
> Startbefehl (aus dem Repo-Ordner, Codex CLI ≥ 0.147 — Flags geändert!):
> `codex exec --sandbox danger-full-access --approve-for-me "$(cat docs/codex-prompt-65-effekte.md)"`
> (Alte Flags `--full-auto` / `--yolo` existieren in neueren Versionen nicht mehr.)

─── PROMPT START ───

# Aufgabe: NOX Motion Arsenal — 65 verbleibende Konzept-Effekte als echte React-Komponenten bauen

Du arbeitest im Repo `C:\Users\Denis\nox-motion-arsenal` (React + Vite + TypeScript). Die App
"Avisto Motion Arsenal v2" ist eine interne Effekt-Bibliothek. Jeder Effekt ist eine
React-Komponente mit Katalog-Eintrag (Meta + lazy import).

## Stand (WICHTIG — nicht doppelt bauen!)
Von ursprünglich 83 Konzept-Effekten sind **18 bereits fertig gebaut** (Batches 1–3, Commits
759b00f / 7ec6933 / fdd050e, plus 4 ältere). Diese NICHT anfassen:
AccordionCards, InputFocusGlow, BlurryTextReveal, GoldHighlightSweep, SlidingPillTabs,
SkeletonShimmerLoader, GrainFilmOverlay, CursorLabelBadge, PasswordStrengthMeter,
NeonTubeFlickerText, ToastStackSlide, CountUpMetricRoller, SuccessStampSubmit, RotatingWordWheel,
IconStrokeDrawHover, TextShakeJitter, BarcodeScanLine, ProgressRingScanner
(+ GaugeNeedleSweep, GoldOutlineFillText, BokehGoldField, StarRatingGoldPop).

**Es fehlen noch 65** — die Liste steht unten. Jeder davon existiert aktuell NUR als Konzept
(generischer Platzhalter im "Konzeptdeck"). Deine Aufgabe: Sie als **echte, produktionsreife
React-Komponenten** bauen, die den Effekt WIRKLICH rendern — kein Platzhalter.

## Spezifikation je Effekt (PFLICHT-Quellen, in dieser Reihenfolge)
1. **Vault-Notiz** (die eigentliche Spezifikation):
   `C:\Users\Denis\OneDrive\Dokumente\Obsidian Vault\Nox Gehirn\03_KNOWLEDGE\Playbooks\NOX Motion Arsenal\Effekte\<Name>.md`
   Frontmatter: `nox-id`, `kategorie`, `modus`, `komplexitaet`, `quellen`, `repo-id`.
   Body: Verhalten, Animation, Referenz-Mechanik, Gold-Signatur-Details.
2. **Konzeptdeck-Eintrag** (Technik-Zusammenfassung, gleicher Name):
   `src/motion-arsenal/effects/concepts/catalog.tsx` — Tupel `[Name, Beschreibung, Technik]`.
3. **Muster-Komponenten** (bestehende Effekte nachahmen — Struktur, Props, Stil):
   - `src/motion-arsenal/effects/system/GaugeNeedleSweep.tsx` (SVG-selbstzeichnend, deterministische Ticks)
   - `src/motion-arsenal/effects/hero/GoldOutlineFillText.tsx` (Stroke-to-Fill, Props-Gruppen)
   - `src/motion-arsenal/effects/forms/StarRatingGoldPop.tsx` (Interaktion + Pop-Sequenz)
   - `src/motion-arsenal/effects/backgrounds/BokehGoldField.tsx` (Canvas/Shader-Ebenen)
   - **Wichtig:** Die 18 frisch gebauten Effekte (oben) sind aktuelle Beispiele für den Stil —
     siehe z. B. `CountUpMetricRoller.tsx` (system), `CursorLabelBadge.tsx` (cursor),
     `SlidingPillTabs.tsx` (originkit), `ToastStackSlide.tsx` (overlays), `NeonTubeFlickerText.tsx` (hero).

## WICHTIG: Git-Aufrufe (Windows-Umgebung)
- **Nutze IMMER den vollen Git-Pfad**: `"C:\Program Files\Git\cmd\git.exe"` statt `git` —
  das MSYS-Binary unter `Git\bin\git.exe` blockiert in PowerShell mit "BUG (fork bomb)".
  Beispiel: `& "C:\Program Files\Git\cmd\git.exe" add -A`
- Für `git push fork main` ebenso den vollen Pfad nutzen.
- **Gold-Signatur**: Farben `#d4a24a` (Gold) / `#f7e8a4` (Highlight), dunkler Grund.
- **Determinismus**: Zufall nur via seeded PRNG (wie in den Muster-Komponenten), keine Math.random()-Streuung ohne Seed.
- **Performance**: transform/opacity-only, rAF nur bei inView && !reducedMotion, will-change sparsam. Keine Allokationen pro Frame.
- **Accessibility**: `prefers-reduced-motion` → sofortiger Endzustand, keine Animation. Tastatur- und Touch-Unterstützung (`:focus-visible`, Tap-Trigger).
- **Props**: Typisiertes Props-Interface, sinnvolle Defaults, `useMemo` für abgeleitete Werte.
- **Datei-Layout**: `<Name>.tsx` im Kategorie-Ordner, Komponente als default export.

## HARTES VERBOT — kein Platzhalter, keine Wrapper!
**Jeder Effekt muss eine EIGENE, echte Implementierung sein** — eigener Algorithmus, eigenes
Canvas/SVG/CSS, eigene Animation. Das bedeutet konkret:

- ❌ **VERBOTEN:** Eine generische "Surface"-Komponente erfinden (z. B. `ConceptMotionSurface`) und
  jeden Effekt als 4-Zeilen-Wrapper darum bauen. Das ist Betrug — der Effekt rendert dann nur den
  Namen, nicht den Effekt. Es gibt KEINE shared-Komponente, die alle Effekte implementiert.
- ❌ **VERBOTEN:** Effekte mit `kind="..."`-Props parametrisieren. Jede Komponente implementiert
  ihren Effekt individuell.
- ❌ **VERBOTEN:** Einen Katalog (`production/catalog.ts` o. ä.) anzulegen, der Effekte als
  "productionSafe" registriert, deren Komponenten gar nicht existieren oder nur Platzhalter sind.
- ✅ **ERLAUBT:** Gemeinsame kleine Helfer (seeded PRNG, useInView-Hook) in
  `src/motion-arsenal/lib/` oder als lokale Utilities — aber NIE die Effekt-Implementierung selbst.
- ✅ **PFLICHT:** Jede Komponente ist **mindestens 80 Zeilen** eigener, sinnvoller Code
  (Ausnahmen: trivial-simple Effekte wie "Strobe Light Text" — auch dann min. 40 Zeilen).
- ✅ **PFLICHT:** Jeder Effekt rendert VISUELL etwas Einzigartiges, das den Namen verdient:
  "Glitch Color Flash Text" MUSS RGB-Split + Farb-Flashing machen, "Gooey Cursor Blob" MUSS
  eine deformierbare Blob-Physik am Cursor haben, "Audio Waveform Visualizer" MUSS Wellenformen
  zeichnen, "3D Circle Text Scroll" MUSS Text auf einem rotierenden Kreis/3D-Zylinder zeigen.
  Orientiere dich an der Vault-Notiz (Verhalten + Referenz-Mechanik).
- ✅ **Referenz-Qualität:** Die 18 fertigen Effekte aus den Batches 1–3 (z. B.
  `CountUpMetricRoller.tsx`, `CursorLabelBadge.tsx`, `NeonTubeFlickerText.tsx`, `ToastStackSlide.tsx`)
  sind der Qualitätsstandard. Jeder neue Effekt muss so aussehen, als käme er aus demselben Batch.

## Kategorie-Zuordnung
Die Kategorie steht im Vault-Frontmatter (`kategorie`) und im `repo-id`-Präfix. Typische Zuordnung:

| Präfix | Ordner |
|---|---|
| `scroll-*` | `src/motion-arsenal/effects/scroll/` |
| `hero-*` | `src/motion-arsenal/effects/hero/` |
| `cursor-*` | `src/motion-arsenal/effects/cursor/` |
| `cards-*` | `src/motion-arsenal/effects/cards/` |
| `forms-*` | `src/motion-arsenal/effects/forms/` |
| `system-*` / `data-*` | `src/motion-arsenal/effects/system/` |
| `bg-*` | `src/motion-arsenal/effects/backgrounds/` |
| `overlays-*` / `modal-*` | `src/motion-arsenal/effects/overlays/` |
| `transitions-*` | `src/motion-arsenal/effects/transitions/` |
| `canvasui-*` | `src/motion-arsenal/effects/canvas-ui/` |
| `originkit-*` | `src/motion-arsenal/effects/originkit/` |
| sonstige | passenden bestehenden Ordner wählen |

## Registrierung (PFLICHT, wie in den fertigen Batches 1–3)
1. Eintrag im Kategorie-Katalog `catalog.ts` ergänzen (Meta: id, name, displayName, category,
   sourceWebsite, sourceFiles, mode, complexity, dependencies, bestFor, performanceNotes,
   mobileNotes, reducedMotionNotes, description, importPath, usageJsx, props, productionSafe: true)
   + `Component: lazy(() => import('./<Name>'))`.
2. **Konzeptdeck-Eintrag LÖSCHEN** aus `src/motion-arsenal/effects/concepts/catalog.tsx`
   (der Effekt ist dann kein Konzept mehr).
3. Contract-Test-Skript `scripts/test-batch<N>-concepts-contract.mjs` — Muster:
   `scripts/test-batch3-concepts-contract.mjs` (prüft Struktur + Verhalten der Batch-Effekte).
   Neue Batches fortlaufend nummerieren (Batch 4, 5, …). Skript in die `test`-Skript-Kette
   in `package.json` einhängen (Muster: `test:batch3`).
4. `npm run typecheck` + `npm run build` müssen grün sein, danach `npm test` (gesamte Kette).

## Arbeitsweise (WICHTIG)
- **NACHT-MARATHON:** Arbeite ab jetzt ununterbrochen in Batches à 5–8 Effekte, bis **07:00 Uhr**.
  So viele Batches wie möglich — Ziel ist es, ALLE 65 Konzept-Effekte fertigzustellen.
  Nach jedem Batch: typecheck + Tests laufen lassen, Commit
  (`feat(arsenal): Konzept-Batch N als echte Komponenten (X Effekte)`), dann direkt weiter.
- **KEINE Pausen zwischen Batches.** Nach einem grünen Commit sofort mit dem nächsten Batch beginnen.
- **WICHTIG:** Wenn Batch 4 (Effekte 1–6 der Liste unten) bereits fertig ist und committed wurde
  (oder die Komponenten schon existieren), **überspringen** und mit Batch 5 weitermachen.
- **AM ENDE (07:00 Uhr oder wenn alle 65 fertig sind):** Ausgeben:
  `NACHTLAUF FERTIG: X von 65 Effekten, Batches N–M, offene Effekte: <Liste>`.
- **IDEMPOTENZ (bei Wiederaufnahme):** Prüfe VOR jedem Effekt, ob er schon gebaut ist —
  `src/motion-arsenal/effects/<kat>/<Name>.tsx` existiert ODER der Name fehlt im
  Konzeptdeck `src/motion-arsenal/effects/concepts/catalog.tsx`. Dann überspringen
  und mit dem nächsten weitermachen. Die statische Liste oben ist der Ausgangsstand —
  die Wahrheit ist das Konzeptdeck.
- Wenn eine Vault-Notiz fehlt: Konzeptdeck-Beschreibung als Quelle nehmen, Notiz NICHT erfinden.
- Wenn der Effekt nur mit WebGL/Shader sinnvoll ist: drei.js/shader verwenden, aber `HEAVY`-Flag im Meta setzen.
- **Nach Fertigstellung aller 65:** `npm test` komplett grün, dann `git push fork main` (Vercel deployt automatisch).

## Die 65 verbleibenden Effekte (Build-Reihenfolge-Vorschlag: Batches à 6, alphabetisch)

1. 3D Circle Text Scroll
2. 3D Rotating Scroll Images
3. 3D Scroll Text Parade
4. Anaglyph Depth Hover
5. ASCII Portrait
6. Audio Waveform Visualizer
7. Aurora Beam Drift
8. Ball Pit Sinkhole Reveal
9. Black Mirror Cracked Text
10. Blurry VHS Image Filter
11. Button Border Glitch
12. Card Fan Deck
13. Cinema Letterbox Modal
14. Clipped Section Stack
15. Connected Grid Pulse
16. Container Scroll SplitText
17. Context Aware Fixed Emblem
18. Counter Preloader
19. CRT Screen Text
20. Cube Spin Route Transition
21. Distorted Button Image Reveal
22. Dynamic Palette Gradient
23. Dynamic Tooltip Fragments
24. Frame Repeat Image Transition
25. Glitch Color Flash Text
26. GLSL Image Glitch
27. Gold Edge Flip Card
28. Gooey Cursor Blob
29. Grid Sliced Hover
30. Heat Haze Shimmer
31. Hero Book Cover Intro
32. Horizontal Accordion Gallery
33. Iron Filings Magnet Transition
34. Ken Burns Cinematic Slideshow
35. Labyrinth Balance Toggle
36. Liquid Distortion Card
37. Looking Through Water Blur
38. Magnetic Grid Navigation
39. Marquee Page Border Scroll
40. Mesh Gradient Flow
41. Morphing Blob Field
42. Pixelated Scroll Load
43. Radar Sweep Glitch Button
44. Radial Context Menu
45. Scan Focus Text Reveal
46. Scratch Gold Reveal
47. Scroll Layout Formation
48. Sheet Drawer Slide
49. Slot Reel Text Roll
50. Sorting Visualizer
51. Split & Sliced Text Decomposition
52. Step Flow Wizard
53. Strikethrough Explain Modal
54. Strobe Light Text
55. SVG Mascot Pulse
56. Tearing Photo Drag
57. Terminal Typewriter Hover
58. Three.js Particle Text Reveal
59. Typewriter Command Palette
60. Vertical Slit Slideshow
61. View Transition List Filter
62. Warp Tunnel Depth
63. WebGL Water Distortion Slider
64. WebGPU Dust Dissolve Text
65. Word Fade Reading

─── PROMPT ENDE ───
