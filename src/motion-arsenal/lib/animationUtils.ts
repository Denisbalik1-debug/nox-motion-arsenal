import { useEffect, useRef, useState, type RefObject } from 'react';

// ---------------------------------------------------------------------------
// Math helpers (mirroring the MathUtils vocabulary found in the Lusion/KRANK
// bundle — lerp/damp/clamp/fit are the workhorses of every effect there).
// ---------------------------------------------------------------------------

export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
// Frame-rate independent exponential smoothing (Lusion-style "damp").
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const fract = (v: number) => v - Math.floor(v);
export const hash = (n: number) => fract(Math.sin(n) * 43758.5453123);

// Deterministic pseudo-random sequence — effects use this instead of
// Math.random so previews are stable and replayable.
export function seededRandom(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// requestAnimationFrame loop hook with delta time + automatic cleanup.
// Pauses when `running` is false (used for offscreen/reduced-motion pause).
// ---------------------------------------------------------------------------

export function useRafLoop(callback: (dt: number, elapsed: number) => void, running = true) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      // Clamp dt so background tabs / stalls don't explode physics.
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      elapsed += dt;
      cbRef.current(dt, elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

// ---------------------------------------------------------------------------
// prefers-reduced-motion — every effect must degrade to a static frame.
// ---------------------------------------------------------------------------

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// ---------------------------------------------------------------------------
// IntersectionObserver visibility — previews only animate while on screen.
// ---------------------------------------------------------------------------

export function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin = '120px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

// ---------------------------------------------------------------------------
// Pointer tracking with damped follow — the base of every cursor effect.
// Returns a mutable ref ({x, y, tx, ty, inside}) updated outside React state.
// ---------------------------------------------------------------------------

export interface PointerState {
  x: number;
  y: number;
  tx: number;
  ty: number;
  inside: boolean;
}

export function usePointer<T extends HTMLElement>(ref: RefObject<T | null>) {
  const state = useRef<PointerState>({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, inside: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      state.current.tx = (e.clientX - r.left) / Math.max(r.width, 1);
      state.current.ty = (e.clientY - r.top) / Math.max(r.height, 1);
      state.current.inside = true;
    };
    const onLeave = () => {
      state.current.inside = false;
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref]);
  return state;
}

// Scroll progress of an element through the viewport: 0 = just entered at the
// bottom, 1 = just left at the top. Drives all scroll-choreography effects.
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>) {
  const progress = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      progress.current = clamp((vh - r.top) / (vh + r.height), 0, 1);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
  return progress;
}
