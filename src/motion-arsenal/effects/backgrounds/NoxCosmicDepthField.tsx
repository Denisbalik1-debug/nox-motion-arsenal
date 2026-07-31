import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { clamp, lerp, seededRandom, useInView, usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// NoxCosmicDepthField — ruhiger, scroll-gekoppelter Tiefenraum.
//
// Abgrenzung zu `bg-nox-starfield-drift`: dort ist der Kern die Warp-/Drift-
// Mechanik (Streaks, Richtungen, Section-Warp) für Übergänge. Hier ist der
// Kern Tiefe und Ruhe: geschichtete Sterne mit Tiefenunschärfe, dezentem
// Bloom und einer Bewegung, die ausschließlich am Scrollfortschritt hängt.
// Keine Partikel, die durchs Bild schießen; keine großen weißen Vordergrund-
// punkte — `foregroundStarRatio` und `foregroundMaxSize` deckeln beides.
//
// Rendering: ein Canvas2D-Loop, vorgerenderte Sprite-Atlanten statt
// createRadialGradient pro Stern pro Frame. Unschärfe entsteht über die Wahl
// des Sprites (Softness aus |z − focusDepth|), nicht über einen Canvas-Filter.
// ---------------------------------------------------------------------------

export interface NoxCosmicDepthFieldProps {
  // Density
  starCount?: number;
  dustCount?: number;
  foregroundStarRatio?: number;
  mediumStarRatio?: number;
  backgroundStarRatio?: number;
  // Size
  minStarSize?: number;
  maxStarSize?: number;
  foregroundMaxSize?: number;
  dustSize?: number;
  // Depth
  depthLayers?: number;
  perspectiveDepth?: number;
  nearPlane?: number;
  farPlane?: number;
  /** 0 = gleichverteilt, 1 = stark nach hinten gewichtet. */
  depthDistribution?: number;
  atmosphericPerspective?: number;
  // Scroll
  scrollSpeed?: number;
  scrollParallax?: number;
  scrollSmoothing?: number;
  verticalDrift?: number;
  horizontalDrift?: number;
  velocityInfluence?: number;
  // Glow / bloom
  bloom?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coreBrightness?: number;
  haloOpacity?: number;
  // Blur / bokeh
  depthBlur?: number;
  backgroundBlur?: number;
  foregroundBlur?: number;
  bokehStrength?: number;
  focusDepth?: number;
  // Trails
  trailLength?: number;
  trailOpacity?: number;
  motionBlur?: number;
  smear?: number;
  // Visual
  starOpacity?: number;
  dustOpacity?: number;
  twinkle?: number;
  colorTemperature?: number;
  vignette?: number;
  nebulaOpacity?: number;
  // Mobile
  mobileStarCount?: number;
  mobileScrollSpeed?: number;
  mobileBloom?: number;
  mobileDpr?: number;
  seed?: number;
}

interface FieldStar {
  x: number;
  y: number;
  z: number;
  size: number;
  warmth: number;
  phase: number;
  dust: boolean;
}

const SPRITE_STEPS = 7;

/** Weiche radiale Scheibe. `softness` 0 = harter Kern, 1 = reines Bokeh. */
function makeSprite(softness: number, radius: number): HTMLCanvasElement {
  const size = Math.max(4, Math.ceil(radius * 2));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  // Mit steigender Softness wandert die Energie vom Kern in den Rand — das
  // ergibt die Bokeh-Scheibe statt eines einfach nur schwächeren Punkts.
  const core = lerp(1, 0.28, softness);
  gradient.addColorStop(0, `rgba(255,255,255,${core.toFixed(3)})`);
  gradient.addColorStop(lerp(0.16, 0.62, softness), `rgba(255,255,255,${(core * 0.55).toFixed(3)})`);
  gradient.addColorStop(lerp(0.42, 0.88, softness), `rgba(255,255,255,${(core * 0.16).toFixed(3)})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export function NoxCosmicDepthField({
  starCount = 520,
  dustCount = 140,
  foregroundStarRatio = 0.04,
  mediumStarRatio = 0.26,
  backgroundStarRatio = 0.7,
  minStarSize = 0.25,
  maxStarSize = 1.15,
  foregroundMaxSize = 1.8,
  dustSize = 0.55,
  depthLayers = 5,
  perspectiveDepth = 0.85,
  nearPlane = 0.18,
  farPlane = 1,
  depthDistribution = 0.62,
  atmosphericPerspective = 0.38,
  scrollSpeed = 0.06,
  scrollParallax = 0.18,
  scrollSmoothing = 0.82,
  verticalDrift = 0.02,
  horizontalDrift = 0.008,
  velocityInfluence = 0.25,
  bloom = 0.28,
  glowRadius = 1.6,
  glowIntensity = 0.22,
  coreBrightness = 1.05,
  haloOpacity = 0.4,
  depthBlur = 0.35,
  backgroundBlur = 0.8,
  foregroundBlur = 0.6,
  bokehStrength = 0.15,
  focusDepth = 0.55,
  trailLength = 0.08,
  trailOpacity = 0.35,
  motionBlur = 0.2,
  smear = 0.12,
  starOpacity = 1,
  dustOpacity = 0.28,
  twinkle = 0.08,
  colorTemperature = 0.35,
  vignette = 0.25,
  nebulaOpacity = 0.16,
  mobileStarCount = 220,
  mobileScrollSpeed = 0.04,
  mobileBloom = 0.18,
  mobileDpr = 1.5,
  seed = 20260731,
}: NoxCosmicDepthFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(hostRef);

  // Für das DPR-Budget muss die Boxbreite ausserhalb des Draw-Callbacks
  // bekannt sein — der Hook bekommt maxDpr als Dependency.
  const [narrowBox, setNarrowBox] = useState(false);
  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setNarrowBox(entry.contentRect.width < 700));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const sprites = useRef<HTMLCanvasElement[] | null>(null);
  const smoothScroll = useRef(0);
  const lastScroll = useRef(0);
  const velocity = useRef(0);
  const drift = useRef(0);

  // Deterministisches Feld: gleicher Seed → gleicher Himmel, auch nach Reload.
  const stars = useMemo<FieldStar[]>(() => {
    const total = Math.max(0, Math.round(starCount));
    const dust = Math.max(0, Math.round(dustCount));
    const random = seededRandom(seed);
    const ratios = [
      Math.max(0, foregroundStarRatio),
      Math.max(0, mediumStarRatio),
      Math.max(0, backgroundStarRatio),
    ];
    const sum = ratios[0] + ratios[1] + ratios[2] || 1;
    const near = Math.min(nearPlane, farPlane - 0.01);
    const far = Math.max(farPlane, near + 0.01);

    const pickZ = () => {
      const roll = random() * sum;
      // Vordergrund ist bewusst das schmalste Band: dort entstehen die großen
      // hellen Punkte, die der Zielästhetik widersprechen.
      if (roll < ratios[0]) return lerp(near, lerp(near, far, 0.28), random());
      if (roll < ratios[0] + ratios[1]) return lerp(lerp(near, far, 0.28), lerp(near, far, 0.62), random());
      return lerp(lerp(near, far, 0.62), far, random());
    };

    const build = (count: number, isDust: boolean): FieldStar[] =>
      Array.from({ length: count }, () => {
        const raw = pickZ();
        // `depthDistribution` schiebt die Population zusätzlich nach hinten.
        const z = clamp(lerp(raw, far, depthDistribution * random() * 0.5), near, far);
        return {
          x: random() * 2 - 1,
          y: random() * 2 - 1,
          z,
          size: isDust ? dustSize * (0.6 + random() * 0.8) : random() * random(),
          warmth: random(),
          phase: random() * Math.PI * 2,
          dust: isDust,
        };
      });

    const built = [...build(total, false), ...build(dust, true)];
    (built as FieldStar[] & { mainCount?: number }).mainCount = total;
    return built;
  }, [
    starCount, dustCount, foregroundStarRatio, mediumStarRatio, backgroundStarRatio,
    nearPlane, farPlane, depthDistribution, dustSize, seed,
  ]);

  const mainCount = (stars as FieldStar[] & { mainCount?: number }).mainCount ?? stars.length;

  useCanvas2D(
    canvasRef,
    (ctx, size, dt) => {
      if (!sprites.current) {
        sprites.current = Array.from({ length: SPRITE_STEPS }, (_, index) =>
          makeSprite(index / (SPRITE_STEPS - 1), 24),
        );
      }
      const atlas = sprites.current;
      const { w, h } = size;
      const narrow = w < 700;
      // Mobile deckelt die Population hart. Der Anteil wird auf Sterne UND
      // Staub angewandt, sonst fiele der Staub als erstes komplett weg.
      const keep = narrow && stars.length
        ? clamp(Math.max(0, Math.round(mobileStarCount)) / stars.length, 0, 1)
        : 1;
      const mainVisible = Math.round(mainCount * keep);
      const dustVisible = Math.round((stars.length - mainCount) * keep);

      // --- Scrollquelle ----------------------------------------------------
      const host = hostRef.current;
      let target = 0;
      if (host && !reduced) {
        const rect = host.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // Fortschritt des Elements durch den Viewport, 0…1.
        target = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      }
      const smoothing = clamp(scrollSmoothing, 0, 0.98);
      const lambda = lerp(26, 1.4, smoothing);
      smoothScroll.current += (target - smoothScroll.current) * (1 - Math.exp(-lambda * dt));

      const rawVelocity = (smoothScroll.current - lastScroll.current) / Math.max(dt, 1 / 120);
      lastScroll.current = smoothScroll.current;
      velocity.current += (rawVelocity - velocity.current) * (1 - Math.exp(-6 * dt));

      const speed = narrow ? mobileScrollSpeed : scrollSpeed;
      if (!reduced) drift.current += dt * speed;

      const parallaxPx = reduced
        ? 0
        : smoothScroll.current * scrollParallax * h
          + drift.current * h * 0.35
          + velocity.current * velocityInfluence * h * 0.06;

      // --- Hintergrund / Smear ---------------------------------------------
      const smearAmount = reduced ? 1 : clamp(1 - (smear + motionBlur * 0.5), 0.05, 1);
      if (smearAmount >= 0.999) {
        ctx.clearRect(0, 0, w, h);
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0,0,0,${smearAmount.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }

      if (nebulaOpacity > 0) {
        const nebula = ctx.createRadialGradient(w * 0.68, h * 0.36, 0, w * 0.68, h * 0.36, Math.max(w, h) * 0.7);
        nebula.addColorStop(0, `rgba(92,128,214,${(nebulaOpacity * 0.5).toFixed(3)})`);
        nebula.addColorStop(0.45, `rgba(120,90,190,${(nebulaOpacity * 0.22).toFixed(3)})`);
        nebula.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, w, h);
      }

      // --- Sterne -----------------------------------------------------------
      const near = Math.min(nearPlane, farPlane - 0.01);
      const far = Math.max(farPlane, near + 0.01);
      const layers = Math.max(1, Math.round(depthLayers));
      const proj = Math.min(w, h) * (0.55 + perspectiveDepth * 0.5);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const bandY = h + 160;
      const bloomAmount = narrow ? mobileBloom : bloom;
      ctx.globalCompositeOperation = 'source-over';

      for (let index = 0; index < stars.length; index++) {
        if (index < mainCount ? index >= mainVisible : index - mainCount >= dustVisible) continue;
        const star = stars[index];
        // Tiefe auf Layer quantisieren — sichtbare Staffelung statt Kontinuum.
        const t = (star.z - near) / (far - near);
        const layer = layers <= 1 ? 0 : Math.round(t * (layers - 1)) / (layers - 1);
        const z = lerp(near, far, layer);
        const inv = 1 / z;

        let sx = cx + star.x * inv * proj * 0.62 + Math.sin(drift.current * 0.6 + star.phase) * horizontalDrift * w;
        let sy = cy + star.y * inv * proj * 0.62 - parallaxPx * inv * 0.5 - drift.current * verticalDrift * h;
        // Rückfaltung hält die Dichte konstant, egal wie lang die Seite ist.
        sy = (((sy + 80) % bandY) + bandY) % bandY - 80;
        if (sx < -40 || sx > w + 40) {
          const bandX = w + 80;
          sx = (((sx + 40) % bandX) + bandX) % bandX - 40;
        }

        // Größe: nahe Sterne größer, aber hart gedeckelt.
        const nearness = 1 - layer;
        let radius = star.dust
          ? star.size
          : lerp(minStarSize, maxStarSize, star.size * 0.4 + nearness * 0.6);
        if (nearness > 0.72) radius = Math.min(radius, foregroundMaxSize);

        // Unschärfe aus dem Abstand zur Fokusebene.
        const focusDistance = Math.abs(layer - clamp(focusDepth, 0, 1));
        const blurBias = layer > focusDepth ? backgroundBlur : foregroundBlur;
        const softness = clamp(focusDistance * 2 * depthBlur * blurBias + bokehStrength, 0, 1);
        const spriteIndex = Math.min(SPRITE_STEPS - 1, Math.round(softness * (SPRITE_STEPS - 1)));
        const sprite = atlas[spriteIndex];

        // Atmosphärische Perspektive: fernes Licht verliert Kontrast.
        const haze = 1 - layer * atmosphericPerspective;
        const flicker = twinkle > 0 && !reduced
          ? 1 - twinkle * 0.5 + Math.sin(drift.current * 3.1 + star.phase) * twinkle * 0.5
          : 1;
        const baseAlpha = (star.dust ? dustOpacity : starOpacity) * haze * flicker * coreBrightness;
        if (baseAlpha <= 0.004) continue;

        const warm = star.warmth * colorTemperature;
        const r = Math.round(lerp(206, 255, warm));
        const g = Math.round(lerp(220, 226, warm));
        const b = Math.round(lerp(255, 214, warm));

        // Bokeh weitet den Punkt auf, ohne ihn heller zu machen.
        const drawRadius = radius * (1 + softness * bokehStrength * 4);
        const d = drawRadius * 2;

        ctx.globalAlpha = clamp(baseAlpha, 0, 1);
        ctx.drawImage(sprite, sx - drawRadius, sy - drawRadius, d, d);

        // Bloom-Halo additiv, aber gedeckelt — nie Neonkonfetti.
        if (bloomAmount > 0.01 && !star.dust && nearness > 0.35) {
          const halo = drawRadius * (1 + glowRadius * 2);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = clamp(bloomAmount * glowIntensity * haloOpacity * haze, 0, 0.5);
          ctx.drawImage(atlas[SPRITE_STEPS - 1], sx - halo, sy - halo, halo * 2, halo * 2);
          ctx.globalCompositeOperation = 'source-over';
        }

        // Trails: kurze Segmente entlang der tatsächlichen Bewegung.
        if (trailLength > 0.005 && !reduced && !star.dust) {
          const travel = Math.abs(velocity.current) * inv * trailLength * 26;
          if (travel > 1.2) {
            ctx.globalAlpha = clamp(baseAlpha * trailOpacity, 0, 0.6);
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = Math.max(0.4, radius * 0.8);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy + Math.sign(velocity.current) * Math.min(travel, 26));
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }

      ctx.globalAlpha = 1;

      if (vignette > 0) {
        const v = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.78);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, `rgba(2,2,5,${clamp(vignette, 0, 1).toFixed(3)})`);
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, w, h);
      }
    },
    // Reduced motion rendert genau ein Standbild; ausserhalb des Viewports
    // läuft kein Loop.
    !reduced && inView,
    // Auf schmalen Boxen greift das eigene DPR-Budget des Effekts.
    narrowBox ? mobileDpr : 2,
  );

  return (
    <div
      ref={hostRef}
      className="nox-cosmic-depth-field"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#05060b' }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

export default NoxCosmicDepthField;
