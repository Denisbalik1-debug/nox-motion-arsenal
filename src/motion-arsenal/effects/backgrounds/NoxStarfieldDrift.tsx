import { useEffect, useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { clamp, seededRandom, useInView, usePrefersReducedMotion, useScrollProgress } from '../../lib/animationUtils';

export type NoxStarfieldVariant = 'deep-drift' | 'section-warp' | 'brand-gateway';
export type NoxStarfieldDirection = 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';

export interface NoxStarfieldDriftProps {
  starCount?: number;
  driftSpeed?: number;
  intensity?: number;
  depth?: number;
  twinkle?: number;
  textSafety?: number;
  variant?: NoxStarfieldVariant;
  direction?: NoxStarfieldDirection;
  accentColor?: string;
  streakStrength?: number;
  nebulaStrength?: number;
  transitionStrength?: number;
  scrollReactive?: boolean;
  progress?: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  warmth: number;
  phase: number;
  lane: number;
}

function makeStars(count: number) {
  const random = seededRandom(20260730);
  return Array.from({ length: count }, () => ({
    x: (random() * 2 - 1) * 1.45,
    y: (random() * 2 - 1) * 1.45,
    z: 0.08 + random() * 0.92,
    size: 0.32 + random() * random() * 1.7,
    warmth: random(),
    phase: random() * Math.PI * 2,
    lane: random(),
  }));
}

function rgba(color: string, alpha: number) {
  const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(color);
  if (short) {
    const [, r, g, b] = short;
    return `rgba(${parseInt(r + r, 16)},${parseInt(g + g, 16)},${parseInt(b + b, 16)},${alpha})`;
  }
  const full = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (full) {
    return `rgba(${parseInt(full[1], 16)},${parseInt(full[2], 16)},${parseInt(full[3], 16)},${alpha})`;
  }
  return `rgba(139,92,246,${alpha})`;
}

function wrap(value: number, limit = 1.45) {
  const span = limit * 2;
  if (value > limit) return value - span;
  if (value < -limit) return value + span;
  return value;
}

export function NoxStarfieldDrift({
  starCount = 680,
  driftSpeed = 0.075,
  intensity = 0.78,
  depth = 0.82,
  twinkle = 0.16,
  textSafety = 0.58,
  variant = 'section-warp',
  direction = 'right',
  accentColor = '#8b5cf6',
  streakStrength = 0.72,
  nebulaStrength = 0.72,
  transitionStrength = 0.88,
  scrollReactive = true,
  progress,
}: NoxStarfieldDriftProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const resetRandomRef = useRef(seededRandom(30072026));
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);
  const elementProgress = useScrollProgress(rootRef);
  const lastProgressRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const requestedCount = clamp(Math.round(starCount), 120, 1200);
      const responsiveCap = size.w < 560 ? 340 : size.w < 900 ? 500 : 1200;
      const count = Math.min(requestedCount, responsiveCap);
      if (starsRef.current.length !== count) {
        starsRef.current = makeStars(count);
        resetRandomRef.current = seededRandom(30072026);
      }

      const safeIntensity = clamp(intensity, 0.2, 1.4);
      const safeDepth = clamp(depth, 0.3, 1.2);
      const safeTwinkle = clamp(twinkle, 0, 0.45);
      const safeDrift = clamp(driftSpeed, 0, 0.24);
      const safeStreak = clamp(streakStrength, 0, 1.4);
      const safeNebula = clamp(nebulaStrength, 0, 1.4);
      const safeTransition = clamp(transitionStrength, 0, 1.4);
      const rawProgress = clamp(progress ?? elementProgress.current, 0, 1);
      const progressDelta = dt > 0 ? (rawProgress - lastProgressRef.current) / dt : 0;
      lastProgressRef.current = rawProgress;
      scrollVelocityRef.current += (Math.abs(progressDelta) - scrollVelocityRef.current) * (1 - Math.exp(-5 * dt));
      const scrollBoost = scrollReactive ? clamp(scrollVelocityRef.current * 0.08, 0, 2.4) : 0;
      const autoProgress = (Math.sin(elapsed * 0.42) + 1) * 0.5;
      const transitionProgress = progress === undefined && !scrollReactive ? autoProgress : rawProgress;
      const motionBoost = 1 + scrollBoost + (variant === 'section-warp' ? 0.45 : 0);

      const centerX = size.w * 0.5;
      const centerY = size.h * 0.5;
      const maxDimension = Math.max(size.w, size.h);

      const background = ctx.createRadialGradient(
        size.w * (direction === 'left' ? 0.68 : 0.38),
        size.h * 0.42,
        0,
        centerX,
        centerY,
        maxDimension * 0.9,
      );
      background.addColorStop(0, variant === 'brand-gateway' ? '#111026' : '#0b1022');
      background.addColorStop(0.45, '#050817');
      background.addColorStop(1, '#010207');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size.w, size.h);

      if (safeNebula > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const nebulaX = size.w * (0.22 + transitionProgress * 0.56);
        const nebula = ctx.createRadialGradient(nebulaX, size.h * 0.46, 0, nebulaX, size.h * 0.46, maxDimension * 0.58);
        nebula.addColorStop(0, rgba(accentColor, 0.17 * safeNebula));
        nebula.addColorStop(0.34, rgba('#22d3ee', 0.07 * safeNebula));
        nebula.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, size.w, size.h);
        ctx.restore();
      }

      const horizontal = direction === 'left' || direction === 'right';
      const vertical = direction === 'up' || direction === 'down';
      const depthTravel = direction === 'forward' || direction === 'backward';
      const directionX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      const directionY = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      const projection = Math.min(size.w, size.h) * (0.46 + safeDepth * 0.35);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const star of starsRef.current) {
        const inverseZ = 1 / star.z;
        if (!reduced) {
          if (depthTravel) {
            const depthDirection = direction === 'backward' ? 1 : -1;
            star.z += depthDirection * safeDrift * motionBoost * dt;
            if (star.z <= 0.055 || star.z > 1.04) {
              const random = resetRandomRef.current;
              star.z = direction === 'backward' ? 0.065 : 1;
              star.x = (random() * 2 - 1) * 1.4;
              star.y = (random() * 2 - 1) * 1.4;
            }
          } else {
            const parallax = 0.28 + inverseZ * 0.42;
            star.x = wrap(star.x + directionX * safeDrift * motionBoost * parallax * dt * 2.6);
            star.y = wrap(star.y + directionY * safeDrift * motionBoost * parallax * dt * 2.2);
          }
        }

        const currentInverseZ = 1 / star.z;
        let x: number;
        let y: number;
        if (depthTravel) {
          x = centerX + star.x * currentInverseZ * projection;
          y = centerY + star.y * currentInverseZ * projection;
        } else {
          const laneCurve = Math.sin(star.phase + elapsed * 0.14) * size.h * 0.018 * safeDepth;
          x = centerX + star.x * size.w * 0.48 * (0.72 + currentInverseZ * 0.22);
          y = centerY + star.y * size.h * 0.48 * (0.72 + currentInverseZ * 0.18) + (horizontal ? laneCurve : 0);
        }
        if (x < -80 || x > size.w + 80 || y < -80 || y > size.h + 80) continue;

        const pulse = reduced ? 1 : 1 + Math.sin(elapsed * 0.8 + star.phase) * safeTwinkle;
        const alpha = clamp(currentInverseZ * 0.22, 0.07, 0.88) * safeIntensity * pulse;
        const radius = clamp(star.size * currentInverseZ * 0.46, 0.34, 2.6);
        const red = 210 + Math.round(star.warmth * 40);
        const green = 224 + Math.round((1 - Math.abs(star.warmth - 0.5) * 2) * 20);
        const blue = 255 - Math.round(star.warmth * 26);
        const starColor = `rgb(${red},${green},${blue})`;

        const streakFactor = safeStreak * (variant === 'section-warp' ? 1.15 : 0.55) * (0.45 + scrollBoost * 0.75);
        if (!reduced && streakFactor > 0.04) {
          const streakLength = clamp((10 + currentInverseZ * 22) * streakFactor, 3, 86);
          const radialX = depthTravel ? (x - centerX) / Math.max(Math.hypot(x - centerX, y - centerY), 1) : directionX;
          const radialY = depthTravel ? (y - centerY) / Math.max(Math.hypot(x - centerX, y - centerY), 1) : directionY;
          const gradient = ctx.createLinearGradient(x - radialX * streakLength, y - radialY * streakLength, x, y);
          gradient.addColorStop(0, 'rgba(255,255,255,0)');
          gradient.addColorStop(1, rgba('#d8e7ff', alpha * 0.75));
          ctx.globalAlpha = clamp(alpha * 0.72, 0, 1);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = clamp(radius * 0.72, 0.35, 1.8);
          ctx.beginPath();
          ctx.moveTo(x - radialX * streakLength, y - radialY * streakLength);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.fillStyle = starColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (radius > 1.25 && alpha > 0.35) {
          ctx.globalAlpha = clamp(alpha * 0.28, 0, 1);
          ctx.strokeStyle = rgba(accentColor, 0.75);
          ctx.lineWidth = 0.55;
          ctx.beginPath();
          ctx.moveTo(x - radius * 3.2, y);
          ctx.lineTo(x + radius * 3.2, y);
          ctx.moveTo(x, y - radius * 3.2);
          ctx.lineTo(x, y + radius * 3.2);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      if (variant !== 'deep-drift' && safeTransition > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const gatePhase = scrollReactive || progress !== undefined ? transitionProgress : autoProgress;
        if (horizontal || depthTravel) {
          const gateX = size.w * (0.14 + gatePhase * 0.72);
          const band = ctx.createLinearGradient(gateX - size.w * 0.13, 0, gateX + size.w * 0.13, 0);
          band.addColorStop(0, 'rgba(0,0,0,0)');
          band.addColorStop(0.42, rgba(accentColor, 0.05 * safeTransition));
          band.addColorStop(0.5, rgba('#dff8ff', 0.3 * safeTransition));
          band.addColorStop(0.58, rgba('#22d3ee', 0.08 * safeTransition));
          band.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = band;
          ctx.fillRect(gateX - size.w * 0.13, 0, size.w * 0.26, size.h);

          const gateGlow = ctx.createRadialGradient(gateX, centerY, 0, gateX, centerY, Math.max(size.w * 0.18, size.h * 0.66));
          gateGlow.addColorStop(0, rgba('#dff8ff', 0.2 * safeTransition));
          gateGlow.addColorStop(0.16, rgba(accentColor, 0.16 * safeTransition));
          gateGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gateGlow;
          ctx.fillRect(0, 0, size.w, size.h);

          ctx.strokeStyle = rgba(accentColor, 0.28 * safeTransition);
          ctx.lineWidth = 1;
          for (let index = 0; index < 3; index += 1) {
            const radiusX = size.w * (0.06 + index * 0.035);
            const radiusY = size.h * (0.34 + index * 0.09);
            ctx.beginPath();
            ctx.ellipse(gateX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (vertical) {
          const gateY = size.h * (0.14 + gatePhase * 0.72);
          const band = ctx.createLinearGradient(0, gateY - size.h * 0.16, 0, gateY + size.h * 0.16);
          band.addColorStop(0, 'rgba(0,0,0,0)');
          band.addColorStop(0.48, rgba(accentColor, 0.22 * safeTransition));
          band.addColorStop(0.52, rgba('#dff8ff', 0.26 * safeTransition));
          band.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = band;
          ctx.fillRect(0, gateY - size.h * 0.16, size.w, size.h * 0.32);
        }
        ctx.restore();
      }

      if (variant === 'brand-gateway') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const pulse = reduced ? 1 : 1 + Math.sin(elapsed * 1.1) * 0.06;
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);
        const portal = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(size.w, size.h) * 0.31);
        portal.addColorStop(0, rgba('#ffffff', 0.14 * safeTransition));
        portal.addColorStop(0.2, rgba(accentColor, 0.18 * safeTransition));
        portal.addColorStop(0.58, rgba('#22d3ee', 0.055 * safeTransition));
        portal.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = portal;
        ctx.fillRect(-size.w / 2, -size.h / 2, size.w, size.h);
        ctx.restore();
      }

      const safety = clamp(textSafety, 0, 1);
      if (safety > 0) {
        const overlay = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(size.w, size.h) * 0.68);
        overlay.addColorStop(0, `rgba(2,3,9,${0.48 * safety})`);
        overlay.addColorStop(0.48, `rgba(2,3,9,${0.2 * safety})`);
        overlay.addColorStop(1, 'rgba(2,3,9,0)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, size.w, size.h);
      }
    },
    !reduced && pageVisible && inView,
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-variant={variant}
      data-direction={direction}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#010207',
        pointerEvents: 'none',
        isolation: 'isolate',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg,rgba(255,255,255,.018),transparent 18%,transparent 82%,rgba(255,255,255,.018))',
          mixBlendMode: 'screen',
          opacity: 0.7,
        }}
      />
    </div>
  );
}

export default NoxStarfieldDrift;
