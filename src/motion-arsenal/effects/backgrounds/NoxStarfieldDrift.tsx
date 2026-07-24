import React, { useEffect, useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { clamp, seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';

export interface NoxStarfieldDriftProps {
  starCount?: number;
  driftSpeed?: number;
  intensity?: number;
  depth?: number;
  twinkle?: number;
  textSafety?: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  warmth: number;
  phase: number;
}

function makeStars(count: number) {
  const random = seededRandom(20260723);
  return Array.from({ length: count }, () => ({
    x: (random() * 2 - 1) * 1.35,
    y: (random() * 2 - 1) * 1.35,
    z: 0.08 + random() * 0.92,
    size: 0.35 + random() * random() * 1.45,
    warmth: random(),
    phase: random() * Math.PI * 2,
  }));
}

/**
 * Ruhiges, wiederverwendbares Preset aus dem NOX-CosmicStage-Sternenfeld.
 * Bewusst ohne Journey, Mond, Black Hole oder Warp-Streaks.
 */
export function NoxStarfieldDrift({
  starCount = 520,
  driftSpeed = 0.055,
  intensity = 0.62,
  depth = 0.72,
  twinkle = 0.12,
  textSafety = 0.68,
}: NoxStarfieldDriftProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const resetRandomRef = useRef(seededRandom(23072026));
  const reduced = usePrefersReducedMotion();
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
      const requestedCount = clamp(Math.round(starCount), 120, 1000);
      const responsiveCap = size.w < 560 ? 320 : size.w < 900 ? 440 : 1000;
      const count = Math.min(requestedCount, responsiveCap);

      if (starsRef.current.length !== count) {
        starsRef.current = makeStars(count);
        resetRandomRef.current = seededRandom(23072026);
      }

      const safeIntensity = clamp(intensity, 0.2, 1);
      const safeDepth = clamp(depth, 0.35, 1);
      const safeTwinkle = clamp(twinkle, 0, 0.35);
      const safeDrift = clamp(driftSpeed, 0, 0.18);
      const centerX = size.w * 0.5;
      const centerY = size.h * 0.48;
      const projection = Math.min(size.w, size.h) * (0.48 + safeDepth * 0.34);

      const background = ctx.createRadialGradient(
        size.w * 0.52,
        size.h * 0.42,
        0,
        size.w * 0.52,
        size.h * 0.42,
        Math.max(size.w, size.h) * 0.82,
      );
      background.addColorStop(0, '#0b1020');
      background.addColorStop(0.52, '#050812');
      background.addColorStop(1, '#020309');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size.w, size.h);

      for (const star of starsRef.current) {
        if (!reduced) star.z -= safeDrift * dt;
        if (star.z <= 0.06) {
          const random = resetRandomRef.current;
          star.z = 1;
          star.x = (random() * 2 - 1) * 1.35;
          star.y = (random() * 2 - 1) * 1.35;
        }

        const inverseZ = 1 / star.z;
        const x = centerX + star.x * inverseZ * projection;
        const y = centerY + star.y * inverseZ * projection;
        if (x < -8 || x > size.w + 8 || y < -8 || y > size.h + 8) continue;

        const pulse = reduced ? 1 : 1 + Math.sin(elapsed * 0.7 + star.phase) * safeTwinkle;
        const alpha = clamp(inverseZ * 0.24, 0.08, 0.82) * safeIntensity * pulse;
        const radius = clamp(star.size * inverseZ * 0.42, 0.35, 2.1);
        const red = 210 + Math.round(star.warmth * 35);
        const green = 222 + Math.round((1 - Math.abs(star.warmth - 0.5) * 2) * 18);
        const blue = 255 - Math.round(star.warmth * 24);

        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Ruhige dunkle Mitte für gut lesbare Text-Overlays.
      const safety = clamp(textSafety, 0, 1);
      if (safety > 0) {
        const overlay = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          Math.min(size.w, size.h) * 0.62,
        );
        overlay.addColorStop(0, `rgba(2, 3, 9, ${0.52 * safety})`);
        overlay.addColorStop(0.5, `rgba(2, 3, 9, ${0.24 * safety})`);
        overlay.addColorStop(1, 'rgba(2, 3, 9, 0)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, size.w, size.h);
      }
    },
    !reduced && pageVisible,
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#020309',
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default NoxStarfieldDrift;
