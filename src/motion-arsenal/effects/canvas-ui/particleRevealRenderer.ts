import { clamp, smoothstep } from '../../lib/animationUtils';
import { mixRgb, type RGB } from '../../lib/color';
import type { ParticleRevealMode, ParticleRevealVariant } from './particleRevealPresets';
import type { ParticlePoint } from './particleRevealScene';

const TAU = Math.PI * 2;

export interface ParticlePalette {
  primary: RGB;
  secondary: RGB;
  hot: RGB;
}

export interface ParticleRenderOptions {
  ctx: CanvasRenderingContext2D;
  size: { w: number; h: number };
  particles: ParticlePoint[];
  palette: ParticlePalette;
  activeVariant: ParticleRevealVariant;
  activeMode: ParticleRevealMode;
  focusX: number;
  focusY: number;
  focusActive: number;
  resolveRadius: number;
  scatterPx: number;
  cloudScale: number;
  particleSize: number;
  glowStrength: number;
  trail: number;
  burstEnergy: number;
  burstX: number;
  burstY: number;
  t: number;
  reduced: boolean;
}

function rgba(rgb: RGB, alpha: number) {
  return `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${clamp(alpha, 0, 1).toFixed(3)})`;
}

export function renderParticleField(options: ParticleRenderOptions) {
  const {
    ctx, size, particles, palette, activeVariant, activeMode, focusX, focusY, focusActive,
    resolveRadius, scatterPx, cloudScale, particleSize, glowStrength, trail, burstEnergy,
    burstX, burstY, t, reduced,
  } = options;
  const aspect = size.w / Math.max(size.h, 1);

  const drawParticle = (pt: ParticlePoint, index: number) => {
    const u = 0.5 + (pt.u - 0.5) * cloudScale;
    const v = 0.5 + (pt.v - 0.5) * cloudScale;
    const restX = u * size.w;
    const restY = v * size.h;
    const dx = (u - focusX) * aspect;
    const dy = v - focusY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let reveal = focusActive * (1 - smoothstep(0, resolveRadius, dist));
    if (activeMode === 'pulse') {
      const radial = Math.sqrt((u - 0.5) ** 2 * aspect + (v - 0.5) ** 2);
      const wave = 0.5 + 0.5 * Math.sin(t * 2.2 - radial * 20);
      reveal = clamp((wave - 0.28) * 1.6, 0, 1);
    }
    if (reduced) reveal = 1;
    reveal = clamp(reveal, 0, 1);
    const resolved = reveal * reveal * (3 - 2 * reveal);
    const diffusion = 1 - resolved;

    const angle = pt.seed * TAU + t * (0.35 + pt.seed * 0.82);
    const radialScatter = scatterPx * (0.36 + pt.seed * 0.92) * diffusion;
    const fromCenterX = u - 0.5;
    const fromCenterY = v - 0.5;
    const centerLen = Math.max(0.001, Math.sqrt(fromCenterX ** 2 + fromCenterY ** 2));
    const tangentX = -fromCenterY / centerLen;
    const tangentY = fromCenterX / centerLen;
    const flow = Math.sin(t * 0.9 + pt.seed * 18) * radialScatter * 0.62;
    let jitterX = Math.cos(angle) * radialScatter + tangentX * flow;
    let jitterY = Math.sin(angle * 1.17) * radialScatter + tangentY * flow;

    if (activeVariant === 'overdrive-particle-collapse') {
      jitterX += Math.sin(t * 2.7 + pt.seed * 44) * radialScatter * 0.54;
      jitterY += Math.cos(t * 2.1 + pt.seed * 33) * radialScatter * 0.42;
    }
    if (activeVariant === 'ghost-signal-assembly') {
      jitterX *= 0.72;
      jitterY *= 0.72;
    }

    if (burstEnergy > 0.006) {
      const bdx = (u - burstX) * aspect;
      const bdy = v - burstY;
      const bl = Math.max(0.015, Math.sqrt(bdx * bdx + bdy * bdy));
      const localBurst = Math.max(0, 1 - bl / 0.48) * burstEnergy;
      jitterX += (bdx / bl) * scatterPx * 5.5 * localBurst;
      jitterY += (bdy / bl) * scatterPx * 5.5 * localBurst;
    }

    const x = restX + jitterX;
    const y = restY + jitterY;
    const resolvedColor = mixRgb(palette.primary, palette.secondary, clamp(pt.tone * 0.9 + pt.seed * 0.18, 0, 1));
    const finalColor = mixRgb(resolvedColor, palette.hot, resolved * (0.38 + pt.tone * 0.58));
    const alpha = 0.14 + pt.tone * 0.22 + resolved * 0.7;
    const radius = particleSize * pt.weight * (0.72 + resolved * 0.58);

    if (trail > 0.05 && index % 4 === 0 && !reduced) {
      const trailLength = radialScatter * 0.09 * trail;
      ctx.strokeStyle = rgba(finalColor, alpha * 0.26 * trail);
      ctx.lineWidth = Math.max(0.45, radius * 0.52);
      ctx.beginPath();
      ctx.moveTo(x - Math.sin(angle) * trailLength, y + Math.cos(angle) * trailLength);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(finalColor, alpha);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();

    if (resolved > 0.72 && index % 13 === 0 && glowStrength > 0.2) {
      ctx.fillStyle = rgba(palette.hot, (resolved - 0.72) * 0.48 * glowStrength);
      ctx.beginPath();
      ctx.arc(x, y, radius * (2.4 + glowStrength), 0, TAU);
      ctx.fill();
    }
  };

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  particles.forEach(drawParticle);
  ctx.globalCompositeOperation = 'lighter';
  particles.forEach((pt, index) => {
    if (index % 7 === 0) drawParticle(pt, index);
  });
  ctx.restore();

  const fx = focusX * size.w;
  const fy = focusY * size.h;
  const ringRadius = resolveRadius * size.h * (0.82 + Math.sin(t * 1.7) * 0.05);
  if (!reduced && focusActive > 0.08) {
    const gradient = ctx.createRadialGradient(fx, fy, ringRadius * 0.1, fx, fy, ringRadius);
    gradient.addColorStop(0, rgba(palette.hot, 0));
    gradient.addColorStop(0.72, rgba(palette.secondary, 0));
    gradient.addColorStop(0.92, rgba(palette.secondary, 0.08 * glowStrength));
    gradient.addColorStop(1, rgba(palette.primary, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(fx, fy, ringRadius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.secondary, 0.2 * focusActive * glowStrength);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 8]);
    ctx.lineDashOffset = -t * 16;
    ctx.beginPath();
    ctx.arc(fx, fy, ringRadius * 0.92, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const scanY = ((t * 0.08) % 1) * size.h;
  const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
  scanGradient.addColorStop(0, rgba(palette.primary, 0));
  scanGradient.addColorStop(0.5, rgba(palette.secondary, 0.035 * glowStrength));
  scanGradient.addColorStop(1, rgba(palette.primary, 0));
  ctx.fillStyle = scanGradient;
  ctx.fillRect(0, scanY - 20, size.w, 40);
}
