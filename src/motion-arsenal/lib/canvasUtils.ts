import { useEffect, useRef, type RefObject } from 'react';

// ---------------------------------------------------------------------------
// DPR-aware 2D canvas hook. Handles resize + devicePixelRatio (capped at 2 —
// same cap the Shopify Editions capture uses for its scenes).
// ---------------------------------------------------------------------------

export function useCanvas2D(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, size: { w: number; h: number; dpr: number }, dt: number, elapsed: number) => void,
  running = true,
  /** Optionale schärfere DPR-Grenze — Effekte mit eigenem Mobile-Budget. */
  maxDpr = 2,
) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = { w: 0, h: 0, dpr: 1 };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      size.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      size.w = Math.max(1, Math.round(r.width));
      size.h = Math.max(1, Math.round(r.height));
      canvas.width = size.w * size.dpr;
      canvas.height = size.h * size.dpr;
    };
    resize();
    // Ein Resize setzt canvas.width und LEERT damit die Zeichenfläche. Solange
    // ein Loop läuft, füllt der nächste Frame das wieder auf — im Standbild-
    // Modus (reduced motion, offscreen) bliebe sie sonst dauerhaft leer. Der
    // ResizeObserver feuert direkt beim observe() und traf damit genau den
    // einen gezeichneten Frame.
    const ro = new ResizeObserver(() => {
      resize();
      if (running) return;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      drawRef.current(ctx, size, 0, 0);
    });
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      elapsed += dt;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      drawRef.current(ctx, size, dt, elapsed);
      if (running) raf = requestAnimationFrame(tick);
    };
    // Always render at least one frame (reduced motion / paused → static image).
    raf = requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [canvasRef, running, maxDpr]);
}

// ---------------------------------------------------------------------------
// Minimal WebGL fullscreen-quad shader runner — the same "one quad, one
// fragment shader" pattern the KRANK/Active-Theory bundles use for their
// atmosphere passes, without pulling in a full engine.
//
// The fragment shader gets: u_time, u_resolution, u_pointer (0..1),
// plus any custom float/vec3 uniforms passed via `uniforms`.
// ---------------------------------------------------------------------------

const QUAD_VS = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export interface ShaderQuadOptions {
  fragment: string;
  uniforms?: Record<string, number | [number, number, number]>;
  running?: boolean;
  // Static time used when not running (reduced motion still shows a frame).
  frozenTime?: number;
  pointerRef?: RefObject<{ x: number; y: number }>;
  dprCap?: number;
}

export function useShaderQuad(canvasRef: RefObject<HTMLCanvasElement | null>, opts: ShaderQuadOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const { fragment, running = true } = opts;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        // Surface shader bugs loudly during development, fail soft in prod.
        console.error('[motion-arsenal] shader error:', gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, QUAD_VS);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uPtr = gl.getUniformLocation(prog, 'u_pointer');
    const customLocs = new Map<string, WebGLUniformLocation | null>();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, optsRef.current.dprCap ?? 1.5);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const start = performance.now();
    const render = (now: number) => {
      const o = optsRef.current;
      const t = o.running === false ? (o.frozenTime ?? 4) : (now - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      const p = o.pointerRef?.current ?? { x: 0.5, y: 0.5 };
      if (uPtr) gl.uniform2f(uPtr, p.x, 1 - p.y);
      if (o.uniforms) {
        for (const [k, v] of Object.entries(o.uniforms)) {
          if (!customLocs.has(k)) customLocs.set(k, gl.getUniformLocation(prog, k));
          const l = customLocs.get(k);
          if (!l) continue;
          if (typeof v === 'number') gl.uniform1f(l, v);
          else gl.uniform3f(l, v[0], v[1], v[2]);
        }
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (o.running !== false) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      // NICHT loseContext() aufrufen: canvas.getContext() liefert nach einem
      // Remount (StrictMode!) denselben — dann toten — Context zurück und
      // alle Compiles schlagen fehl. Der Context stirbt mit dem Canvas-Element.
    };
  }, [canvasRef, fragment, running]);
}

// Shared GLSL building blocks (hash/noise/fbm) in the exact style found in the
// reference bundles — import and prepend to fragment shaders.
export const GLSL_NOISE = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}
`;
