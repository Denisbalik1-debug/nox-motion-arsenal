# NOX Motion Arsenal — Claude Code Prompt: 83 Konzepte zu echten Effekten bauen

> Kopiere alles zwischen den Markern ─── PROMPT START ─── und ─── PROMPT ENDE ───
> in Claude Code (oder `claude -p "..."` / als Datei `claude.md`).

─── PROMPT START ───

# Aufgabe: NOX Motion Arsenal — 83 Konzept-Effekte als echte React-Komponenten bauen

Du arbeitest im Repo `C:\Users\Denis\nox-motion-arsenal` (React + Vite + TypeScript).

## Kontext
Die App "Avisto Motion Arsenal v2" ist eine interne Effekt-Bibliothek. Jeder Effekt ist eine
React-Komponente mit Katalog-Eintrag (Meta + lazy import). Es gibt bereits ~195 gebaute Effekte
als Vorlage. **83 weitere existieren NUR als Konzept** (generische Platzhalter-Preview im
"Konzeptdeck"). Deine Aufgabe: Diese 83 als **echte, produktionsreife React-Komponenten** bauen,
die den Effekt wirklich rendern — kein Platzhalter, keine generische Preview.

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

## Konventionen (NICHT verhandelbar)
- **Gold-Signatur**: Farben `#d4a24a` (Gold) / `#f7e8a4` (Highlight), dunkler Grund.
- **Determinismus**: Zufall nur via seeded PRNG (wie in den Muster-Komponenten), keine Math.random()-Streuung ohne Seed.
- **Performance**: transform/opacity-only, rAF nur bei inView && !reducedMotion, will-change sparsam. Keine Allokationen pro Frame.
- **Accessibility**: `prefers-reduced-motion` → sofortiger Endzustand, keine Animation. Tastatur- und Touch-Unterstützung (`:focus-visible`, Tap-Trigger).
- **Props**: Typisiertes Props-Interface, sinnvolle Defaults, `useMemo` für abgeleitete Werte.
- **Datei-Layout**: `<Name>.tsx` im Kategorie-Ordner, Komponente als default export.

## Kategorie-Zuordnung
Die Kategorie steht im Vault-Frontmatter (`kategorie`-Feld) und im `repo-id`-Präfix.
Typische Zuordnung:

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
| sonstige | passenden bestehenden Ordner wählen |

## Registrierung (PFLICHT)
1. Eintrag im Kategorie-Katalog `catalog.ts` ergänzen (Meta: id, name, displayName, category,
   sourceWebsite, sourceFiles, mode, complexity, dependencies, bestFor, performanceNotes,
   mobileNotes, reducedMotionNotes, description, importPath, usageJsx, props, productionSafe: true)
   + `Component: lazy(() => import('./<Name>'))`.
2. **Konzeptdeck-Eintrag LÖSCHEN** aus `src/motion-arsenal/effects/concepts/catalog.tsx`
   (der Effekt ist dann kein Konzept mehr).
3. Contract-Test-Skript `scripts/test-<id>-contract.mjs` nach Muster
   `scripts/test-gauge-needle-sweep-contract.mjs` schreiben (Struktur + Verhalten prüfen)
   und in die `test`-Skript-Kette in `package.json` einhängen.
4. `npm run typecheck` + `npm run build` müssen grün sein, danach `npm test` (gesamte Kette).

## Arbeitsweise (WICHTIG)
- **In Batches arbeiten**: 5–8 Effekte pro Batch, nach jedem Batch typecheck + Tests laufen lassen.
  Nicht alles auf einmal. Beginne mit einem Batch und melde nach jedem Batch Fortschritt.
- Wenn eine Vault-Notiz fehlt: Konzeptdeck-Beschreibung als Quelle nehmen, Notiz NICHT erfinden.
- Wenn der Effekt nur mit WebGL/Shader sinnvoll ist: drei.js/shader verwenden, aber `HEAVY`-Flag im Meta setzen.
- Nach Fertigstellung: `npm test` muss komplett grün sein, dann `git push fork main` (Vercel deployt).

## Die 83 Effekte (nummeriert, in beliebiger Reihenfolge bauen — Vorschlag: alphabetisch in Batches à 6)

1. 3D Circle Text Scroll
2. 3D Rotating Scroll Images
3. 3D Scroll Text Parade
4. Accordion Cards
5. Anaglyph Depth Hover
6. ASCII Portrait
7. Audio Waveform Visualizer
8. Aurora Beam Drift
9. Ball Pit Sinkhole Reveal
10. Barcode Scan Line
11. Black Mirror Cracked Text
12. Blurry Text Reveal
13. Blurry VHS Image Filter
14. Button Border Glitch
15. Card Fan Deck
16. Cinema Letterbox Modal
17. Clipped Section Stack
18. Connected Grid Pulse
19. Container Scroll SplitText
20. Context Aware Fixed Emblem
21. Count-Up Metric Roller
22. Counter Preloader
23. CRT Screen Text
24. Cube Spin Route Transition
25. Cursor Label Badge
26. Distorted Button Image Reveal
27. Dynamic Palette Gradient
28. Dynamic Tooltip Fragments
29. Frame Repeat Image Transition
30. Glitch Color Flash Text
31. GLSL Image Glitch
32. Gold Edge Flip Card
33. Gold Highlight Sweep
34. Gooey Cursor Blob
35. Grain Film Overlay
36. Grid Sliced Hover
37. Heat Haze Shimmer
38. Hero Book Cover Intro
39. Horizontal Accordion Gallery
40. Icon Stroke Draw Hover
41. Input Focus Glow
42. Iron Filings Magnet Transition
43. Ken Burns Cinematic Slideshow
44. Labyrinth Balance Toggle
45. Liquid Distortion Card
46. Looking Through Water Blur
47. Magnetic Grid Navigation
48. Marquee Page Border Scroll
49. Mesh Gradient Flow
50. Morphing Blob Field
51. Neon Tube Flicker Text
52. Password Strength Meter
53. Pixelated Scroll Load
54. Progress Ring Scanner
55. Radar Sweep Glitch Button
56. Radial Context Menu
57. Rotating Word Wheel
58. Scan Focus Text Reveal
59. Scratch Gold Reveal
60. Scroll Layout Formation
61. Sheet Drawer Slide
62. Skeleton Shimmer Loader
63. Sliding Pill Tabs
64. Slot Reel Text Roll
65. Sorting Visualizer
66. Split & Sliced Text Decomposition
67. Step Flow Wizard
68. Strikethrough Explain Modal
69. Strobe Light Text
70. Success Stamp Submit
71. SVG Mascot Pulse
72. Tearing Photo Drag
73. Terminal Typewriter Hover
74. Text Shake Jitter
75. Three.js Particle Text Reveal
76. Toast Stack Slide
77. Typewriter Command Palette
78. Vertical Slit Slideshow
79. View Transition List Filter
80. Warp Tunnel Depth
81. WebGL Water Distortion Slider
82. WebGPU Dust Dissolve Text
83. Word Fade Reading

─── PROMPT ENDE ───
