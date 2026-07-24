import { useEffect, useState } from 'react';
import type { PointerState } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// Shared helpers for the cursor category.
//
// Every cursor effect works ONLY inside its own container (usePointer on the
// root — no window listeners, no global cursor hijack). On coarse-pointer
// devices (hover: none) there is no hover to react to, so effects drive a
// virtual pointer along a gentle Lissajous path instead — previews on mobile
// stay alive instead of dead.
// ---------------------------------------------------------------------------

/** True when the device supports real hover (fine pointer). */
export function useHoverCapable(): boolean {
  const [capable, setCapable] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? !window.matchMedia('(hover: none)').matches
      : true,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(hover: none)');
    const onChange = () => setCapable(!mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return capable;
}

/**
 * Touch fallback: moves the virtual pointer target on a slow organic
 * Lissajous orbit (two incommensurate frequencies per axis → never loops
 * visibly). Call once per frame from the effect's raf loop when hover is
 * unavailable.
 */
export function driftPointer(p: PointerState, elapsed: number) {
  p.tx = 0.5 + 0.33 * Math.sin(elapsed * 0.45) + 0.09 * Math.sin(elapsed * 1.31);
  p.ty = 0.5 + 0.27 * Math.cos(elapsed * 0.34) + 0.08 * Math.sin(elapsed * 0.93);
  p.inside = true;
}
