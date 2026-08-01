import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

// ---------------------------------------------------------------------------
// NoxHorizonRift — scrollgebundene Hero → Cosmic-Transition.
//
// Variante von `originkit-thunderstrike`. Der Original-Effekt ist ein
// zeitgetriebener WebGL-fbm-Shader mit Dauerloop — als Übergangskante taugt er
// nicht: er lässt sich nicht am Scroll festmachen und nicht rückwärts
// abspielen. Diese Variante ist deshalb Canvas-2D plus CSS-Maske:
//
//  - Der Blitz ist eine reine Funktion von `progress`. Rückwärtsscrollen nimmt
//    ihn exakt zurück, es wird kein Zustand akkumuliert.
//  - Die Blitzbahn ist zugleich die Reveal-Kante: oberhalb bleibt der Hero,
//    unterhalb wird das Cosmic Field sichtbar (clip-path aus der Bahn).
//  - Kein weißer Vollbild-Flash. Der Flash ist ein weicher Bloom entlang der
//    Kante in NOX-Pink/Rot.
//
// PERFORMANCE — bindend:
//  - Kein Dauerloop. Gezeichnet wird nur, wenn sich `progress` ändert.
//  - Außerhalb des Viewports wird gar nicht gezeichnet (IntersectionObserver).
//  - Mobil weniger Verzweigungen und schwächerer Bloom.
//  - Reduced Motion: statische Linie + Crossfade, kein Canvas-Zeichnen.
// ---------------------------------------------------------------------------

export type RiftDirection = 'ltr' | 'rtl';
export type RiftReducedMotionMode = 'static-line' | 'crossfade-only' | 'hidden';

export interface NoxHorizonRiftProps {
  /** 0 = Hero geschlossen, 1 = Cosmic vollständig aufgedeckt. */
  progress?: number;
  /** Zeichenrichtung der Kante. */
  direction?: RiftDirection;
  boltThickness?: number;
  branchAmount?: number;
  turbulence?: number;
  glow?: number;
  bloom?: number;
  flashIntensity?: number;
  /** Weichheit der Reveal-Kante in px. */
  revealSoftness?: number;
  distortion?: number;
  sparkAmount?: number;
  colorStart?: string;
  colorEnd?: string;
  reducedMotionMode?: RiftReducedMotionMode;
  /** Deterministischer Seed — gleiche Zahl, gleiche Bahn. */
  seed?: number;
  /** Interner Vorschautreiber: fährt `progress` selbst durch (nur Arsenal). */
  autoDemo?: boolean;
  className?: string;
  style?: CSSProperties;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministisches Rauschen — kein Math.random, sonst wäre nichts reversibel. */
function hash(n: number) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}
function valueNoise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 17.13), hash(i + 1 + seed * 17.13), u) * 2 - 1;
}

interface PathPoint { x: number; y: number }

/**
 * Die Blitzbahn über die volle Breite. Unabhängig von `progress` — der
 * Fortschritt entscheidet nur, wie viel davon gezeichnet wird. Dadurch wandert
 * die Kante nicht, wenn man zurückscrollt.
 */
function buildPath(width: number, height: number, turbulence: number, distortion: number, seed: number): PathPoint[] {
  const steps = Math.max(24, Math.min(96, Math.round(width / 18)));
  const mid = height * 0.5;
  const points: PathPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = t * width;
    const coarse = valueNoise(t * 3.2, seed) * height * 0.24 * distortion;
    const fine = valueNoise(t * 11.5, seed + 3) * height * 0.1 * turbulence;
    const micro = valueNoise(t * 27.3, seed + 7) * height * 0.04 * turbulence;
    // Enden auf die Mittellinie ziehen, damit die Kante sauber anschließt.
    const ease = Math.sin(Math.PI * t);
    points.push({ x, y: mid + (coarse + fine + micro) * ease });
  }
  return points;
}

export default function NoxHorizonRift({
  progress = 0,
  direction = 'ltr',
  boltThickness = 2.4,
  branchAmount = 6,
  turbulence = 1,
  glow = 1,
  bloom = 0.85,
  flashIntensity = 0.7,
  revealSoftness = 26,
  distortion = 1,
  sparkAmount = 24,
  colorStart = '#ff3d6e',
  colorEnd = '#ff8a4c',
  reducedMotionMode = 'static-line',
  seed = 7,
  autoDemo = false,
  className,
  style,
}: NoxHorizonRiftProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);

  const value = clamp01(autoDemo ? demoProgress : progress);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Nur zeichnen, wenn die Kante wirklich im Bild ist.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '15% 0px' });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((current) => (current.w === width && current.h === height ? current : { w: width, h: height }));
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Vorschautreiber für das Arsenal — läuft nur sichtbar und nur einmal durch.
  useEffect(() => {
    if (!autoDemo || reduced || !visible) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 2600;
      setDemoProgress(t >= 1 ? 1 : t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoDemo, reduced, visible]);

  const narrow = size.w > 0 && size.w < 700;
  const path = useMemo(
    () => (size.w > 0 && size.h > 0 ? buildPath(size.w, size.h, turbulence, distortion, seed) : []),
    [size.w, size.h, turbulence, distortion, seed],
  );

  /** Reveal-Kante als clip-path-Polygon: unterhalb der Bahn wird Cosmic sichtbar. */
  const revealClip = useMemo(() => {
    if (!path.length || !size.h) return 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)';
    const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;
    const head = direction === 'ltr' ? value : 1 - value;
    // Hinter der Spitze läuft die Kante über eine kurze Strecke nach unten aus,
    // statt senkrecht abzustürzen — eine 90°-Wand liest sich als Fehler.
    const ramp = 0.09;
    const pts = path.map((p, i) => {
      const t = i / (path.length - 1);
      const behind = direction === 'ltr' ? t - head : head - t;
      const k = clamp01(behind / ramp);
      const eased = k * k * (3 - 2 * k);
      return `${pct(p.x, size.w)} ${pct(lerp(p.y, size.h, eased), size.h)}`;
    });
    return `polygon(${pts.join(',')}, 100% 100%, 0 100%)`;
  }, [path, value, direction, size.w, size.h]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced || !visible || !path.length) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(size.w * dpr) || canvas.height !== Math.round(size.h * dpr)) {
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    if (value <= 0) return;

    const branches = Math.round(branchAmount * (narrow ? 0.45 : 1));
    const bloomScale = bloom * (narrow ? 0.55 : 1);
    const head = direction === 'ltr' ? value : 1 - value;
    const drawn = path.filter((_, i) => {
      const t = i / (path.length - 1);
      return direction === 'ltr' ? t <= head : t >= head;
    });
    if (drawn.length < 2) return;

    const gradient = ctx.createLinearGradient(0, 0, size.w, 0);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);

    const strokePath = (points: PathPoint[], width: number, alpha: number, blur: number) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = blur;
      ctx.shadowColor = colorStart;
      ctx.stroke();
    };

    // Bloom als weiche, breite Unterlage — bewusst kein weißer Flash.
    ctx.globalCompositeOperation = 'lighter';
    strokePath(drawn, boltThickness * 9 * bloomScale, 0.1 * bloomScale, 34 * glow);
    strokePath(drawn, boltThickness * 3.6, 0.26 * glow, 20 * glow);
    strokePath(drawn, boltThickness, 0.95, 10 * glow);

    // Verzweigungen — deterministisch aus Index und Seed.
    for (let b = 0; b < branches; b += 1) {
      const anchor = Math.floor(hash(b * 3.7 + seed) * (drawn.length - 2)) + 1;
      const from = drawn[anchor];
      if (!from) continue;
      const dir = hash(b * 9.1 + seed) > 0.5 ? -1 : 1;
      const len = (14 + hash(b * 5.3 + seed) * 46) * turbulence;
      const segs = 3;
      const pts: PathPoint[] = [from];
      for (let s = 1; s <= segs; s += 1) {
        const k = s / segs;
        pts.push({
          x: from.x + (hash(b * 2.1 + s + seed) - 0.5) * len * 1.6,
          y: from.y + dir * len * k + (hash(b * 4.4 + s + seed) - 0.5) * 8 * turbulence,
        });
      }
      // Äste erscheinen erst, wenn die Spitze sie passiert hat, und klingen ab.
      const bt = anchor / Math.max(1, drawn.length - 1);
      const age = clamp01((value - bt * value) * 3);
      strokePath(pts, Math.max(0.6, boltThickness * 0.45), 0.4 * age * glow, 8 * glow);
    }

    // Zerfall in Funken am Ende — reine Funktion von `progress`.
    if (value > 0.72 && sparkAmount > 0) {
      const decay = clamp01((value - 0.72) / 0.28);
      const count = Math.round(sparkAmount * (narrow ? 0.5 : 1));
      for (let s = 0; s < count; s += 1) {
        const t = hash(s * 1.7 + seed);
        const idx = Math.min(drawn.length - 1, Math.floor(t * drawn.length));
        const base = drawn[idx];
        if (!base) continue;
        const drift = decay * (18 + hash(s * 6.1 + seed) * 34);
        const x = base.x + (hash(s * 2.9 + seed) - 0.5) * drift * 1.4;
        const y = base.y + (hash(s * 8.3 + seed) - 0.5) * drift;
        const r = Math.max(0.5, (1 - decay) * 2.1 + 0.4);
        ctx.globalAlpha = (1 - decay) * 0.8;
        ctx.shadowBlur = 10 * glow;
        ctx.shadowColor = colorEnd;
        ctx.fillStyle = colorEnd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }, [
    path, value, direction, boltThickness, branchAmount, turbulence, glow, bloom,
    sparkAmount, colorStart, colorEnd, seed, size.w, size.h, reduced, visible, narrow,
  ]);

  if (reduced && reducedMotionMode === 'hidden') return null;

  const vars: CSSProperties & Record<`--${string}`, string | number> = {
    '--rift-progress': value,
    '--rift-soft': `${revealSoftness}px`,
    '--rift-flash': flashIntensity,
    '--rift-start': colorStart,
    '--rift-end': colorEnd,
    // Der Hero blendet oberhalb der Kante aus — als Variable, damit die
    // aufrufende Seite ihre eigenen Partikel daran hängen kann.
    '--rift-hero-fade': 1 - value,
  };

  return (
    <div
      ref={rootRef}
      className={`nhr-root${className ? ` ${className}` : ''}`}
      data-reduced={reduced ? reducedMotionMode : undefined}
      data-progress={value.toFixed(3)}
      style={{ ...vars, ...style }}
    >
      <style>{CSS}</style>
      <div className="nhr-hero" aria-hidden="true">
        <span className="nhr-hero-glow" />
        <span className="nhr-hero-particles" />
      </div>
      <div className="nhr-cosmic" aria-hidden="true" style={reduced ? undefined : { clipPath: revealClip }}>
        <span className="nhr-stars" />
      </div>
      {!reduced && <canvas ref={canvasRef} className="nhr-canvas" aria-hidden="true" />}
      {reduced && reducedMotionMode === 'static-line' && <span className="nhr-static-line" aria-hidden="true" />}
    </div>
  );
}

const CSS = String.raw`
.nhr-root{position:relative;width:100%;height:100%;min-height:220px;overflow:hidden;isolation:isolate;background:#040306}
.nhr-hero,.nhr-cosmic{position:absolute;inset:0}
.nhr-hero{background:radial-gradient(120% 90% at 50% 0%,rgba(255,61,110,.16),rgba(8,4,10,0) 62%),linear-gradient(180deg,#120610,#06040a)}
.nhr-hero-glow{position:absolute;inset:0;background:radial-gradient(70% 46% at 50% 8%,color-mix(in srgb,var(--rift-start) 24%,transparent),transparent 70%);opacity:var(--rift-hero-fade,1);transition:opacity .25s linear}
/* Hero-Signal-Partikel blenden oberhalb der Kante aus. */
.nhr-hero-particles{position:absolute;inset:0;opacity:var(--rift-hero-fade,1);transition:opacity .25s linear;background-image:radial-gradient(circle,rgba(255,241,243,.7) 1px,transparent 1px),radial-gradient(circle,color-mix(in srgb,var(--rift-start) 70%,white) 1px,transparent 1px);background-size:120px 90px,190px 140px;background-position:0 0,60px 40px;mask-image:linear-gradient(180deg,#000 0%,#000 42%,transparent 62%)}
.nhr-cosmic{background:radial-gradient(90% 70% at 50% 100%,rgba(46,20,64,.55),#030206 70%)}
.nhr-stars{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.9) .9px,transparent 1px),radial-gradient(circle,rgba(190,205,255,.55) .8px,transparent 1px),radial-gradient(circle,color-mix(in srgb,var(--rift-end) 60%,white) .9px,transparent 1px);background-size:140px 110px,90px 70px,230px 180px;background-position:0 0,40px 30px,110px 70px}
.nhr-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
/* Flash ist ein weicher Kantensaum, kein Vollbild-Weiß. */
.nhr-root::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 40% at calc(var(--rift-progress,0) * 100%) 50%,color-mix(in srgb,var(--rift-start) 55%,transparent),transparent 62%);opacity:calc(var(--rift-flash,.7) * var(--rift-progress,0) * (1 - var(--rift-progress,0)) * 3.2);mix-blend-mode:screen;filter:blur(var(--rift-soft,26px))}
.nhr-static-line{position:absolute;left:0;right:0;top:50%;height:2px;background:linear-gradient(90deg,var(--rift-start),var(--rift-end));opacity:.8}
.nhr-root[data-reduced] .nhr-cosmic{opacity:var(--rift-progress,0);transition:opacity .3s linear}
.nhr-root[data-reduced] .nhr-hero{opacity:calc(1 - var(--rift-progress,0) * .85)}
.nhr-root[data-reduced]::after{display:none}
@media(prefers-reduced-motion:reduce){
  .nhr-hero-glow,.nhr-hero-particles,.nhr-cosmic{transition:none!important}
}
`;
