import { seededRandom } from '../../lib/animationUtils';
import type { ParticleRevealPreset, ParticleRevealScene } from './particleRevealPresets';

export interface ParticlePoint {
  u: number;
  v: number;
  seed: number;
  tone: number;
  weight: number;
}

const SAMPLE_W = 960;
const SAMPLE_H = 540;
const TAU = Math.PI * 2;

function fitText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, startSize: number, weight = 900) {
  let size = startSize;
  do {
    ctx.font = `${weight} ${size}px "Arial Black", Inter, Arial, sans-serif`;
    if (ctx.measureText(value).width <= maxWidth) break;
    size -= 4;
  } while (size > 24);
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, alpha = 0.55, width = 2) {
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha = 0.7, width = 2) {
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.stroke();
}

function drawScene(ctx: CanvasRenderingContext2D, preset: ParticleRevealPreset, textOverride?: string) {
  ctx.clearRect(0, 0, SAMPLE_W, SAMPLE_H);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const title = textOverride?.trim() || preset.title;
  const scene: ParticleRevealScene = preset.scene;

  if (scene === 'wordmark') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitText(ctx, title, 760, 150);
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    ctx.fillText(title, 480, 244);
    ctx.font = '700 22px monospace';
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fillText(preset.subtitle, 480, 346);
    line(ctx, 190, 164, 770, 164, 0.28, 1);
    line(ctx, 190, 374, 770, 374, 0.28, 1);
    for (let x = 208; x <= 752; x += 34) ring(ctx, x, 418, x % 68 === 4 ? 4 : 2.2, 0.34, 1);
  }

  if (scene === 'forge') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ring(ctx, 480, 268, 154, 0.34, 2);
    ring(ctx, 480, 268, 112, 0.78, 3);
    ring(ctx, 480, 268, 72, 0.5, 2);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * TAU - Math.PI / 2;
      const x1 = 480 + Math.cos(a) * 80;
      const y1 = 268 + Math.sin(a) * 80;
      const x2 = 480 + Math.cos(a) * 148;
      const y2 = 268 + Math.sin(a) * 148;
      line(ctx, x1, y1, x2, y2, i % 2 ? 0.38 : 0.72, i % 2 ? 2 : 4);
      ring(ctx, x2, y2, i % 2 ? 5 : 8, 0.72, 2);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(480, 154);
    ctx.lineTo(540, 258);
    ctx.lineTo(480, 382);
    ctx.lineTo(420, 258);
    ctx.closePath();
    ctx.stroke();
    ctx.font = '900 38px "Arial Black", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fillText('NOX', 480, 268);
    ctx.font = '800 19px monospace';
    ctx.fillStyle = 'rgba(255,255,255,.58)';
    ctx.fillText(title, 480, 458);
  }

  if (scene === 'command') {
    const nodes = [
      [180, 144, 'MEMORY'], [180, 390, 'TOOLS'], [780, 144, 'AGENTS'], [780, 390, 'OUTPUT'],
      [480, 86, 'SIGNAL'], [480, 452, 'PROOF'],
    ] as const;
    ring(ctx, 480, 266, 116, 0.56, 2);
    ring(ctx, 480, 266, 78, 0.86, 3);
    nodes.forEach(([x, y], index) => {
      line(ctx, 480, 266, x, y, index % 2 ? 0.34 : 0.6, index % 2 ? 2 : 3);
      ring(ctx, x, y, index < 4 ? 18 : 13, 0.85, 3);
      ring(ctx, x, y, 4, 0.95, 2);
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 66px "Arial Black", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.fillText(title, 480, 258);
    ctx.font = '700 18px monospace';
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fillText(preset.subtitle, 480, 316);
    nodes.forEach(([x, y, label]) => {
      ctx.font = '700 13px monospace';
      ctx.fillStyle = 'rgba(255,255,255,.48)';
      ctx.fillText(label, x, y + (y < 266 ? -32 : 32));
    });
  }

  if (scene === 'blueprint') {
    ctx.strokeStyle = 'rgba(255,255,255,.72)';
    ctx.lineWidth = 3;
    ctx.strokeRect(154, 100, 652, 338);
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1;
    ctx.strokeRect(174, 120, 612, 298);
    line(ctx, 174, 176, 786, 176, 0.45, 2);
    line(ctx, 376, 176, 376, 418, 0.38, 2);
    line(ctx, 584, 176, 584, 418, 0.38, 2);
    for (let i = 0; i < 4; i += 1) {
      const y = 224 + i * 46;
      line(ctx, 204, y, 344, y, 0.38 + i * 0.08, i === 3 ? 4 : 2);
      ring(ctx, 614 + i * 38, y, 7 + i * 2, 0.62, 2);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '900 52px "Arial Black", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.fillText(title, 194, 145);
    ctx.font = '700 15px monospace';
    ctx.fillStyle = 'rgba(255,255,255,.54)';
    ctx.fillText('POSITION', 204, 205);
    ctx.fillText('OFFER', 406, 205);
    ctx.fillText('PIPELINE', 614, 205);
    ctx.font = '900 72px "Arial Black", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.fillText('25K+', 406, 310);
    ctx.font = '700 14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,.44)';
    ctx.fillText('TARGET DEAL SIZE', 406, 368);
  }

  if (scene === 'collapse') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * TAU;
      const inner = 82 + (i % 3) * 12;
      const outer = 190 + (i % 4) * 18;
      line(ctx, 480 + Math.cos(a) * inner, 270 + Math.sin(a) * inner, 480 + Math.cos(a) * outer, 270 + Math.sin(a) * outer, 0.34 + (i % 4) * 0.12, 2 + (i % 3));
    }
    ring(ctx, 480, 270, 172, 0.34, 2);
    ring(ctx, 480, 270, 124, 0.72, 4);
    ring(ctx, 480, 270, 52, 0.94, 6);
    ctx.font = '900 72px "Arial Black", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.97)';
    ctx.fillText(title, 480, 254);
    ctx.font = '800 19px monospace';
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillText(preset.subtitle, 480, 322);
    for (let i = 0; i < 8; i += 1) {
      const x = 202 + i * 80;
      line(ctx, x, 450, x + 44, 450, 0.28 + (i % 3) * 0.16, i % 2 ? 2 : 4);
    }
  }

  ctx.restore();
}

export function sampleSceneParticles(preset: ParticleRevealPreset, text: string | undefined, maxCount: number): ParticlePoint[] {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_W;
  canvas.height = SAMPLE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  drawScene(ctx, preset, text);
  const pixels = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
  const candidates: ParticlePoint[] = [];
  const step = 2;
  let index = 0;
  for (let y = 0; y < SAMPLE_H; y += step) {
    for (let x = 0; x < SAMPLE_W; x += step) {
      const alpha = pixels[(y * SAMPLE_W + x) * 4 + 3];
      if (alpha < 24) continue;
      const rnd = seededRandom(index * 17 + 31);
      candidates.push({ u: x / SAMPLE_W, v: y / SAMPLE_H, seed: rnd(), tone: alpha / 255, weight: 0.68 + rnd() * 0.72 });
      index += 1;
    }
  }
  const shuffle = seededRandom(8301 + preset.label.length * 19 + (text?.length ?? 0));
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(shuffle() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, Math.min(maxCount, candidates.length));
}
