import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Shared demo helpers for the cards category.
// Hover is the primary trigger for card effects; on touch devices
// (`(hover: none)`) every card runs a self-playing demo cycle instead.
// ---------------------------------------------------------------------------

/** True when the device has no hover capability (touch-first). */
export function useTouchMode(): boolean {
  const [touch, setTouch] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: none)').matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(hover: none)');
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return touch;
}

/**
 * Boolean square wave for auto-demo cycles: toggles every `period / 2`
 * seconds while `enabled`. Used as the hover stand-in on touch devices.
 */
export function useAutoPulse(enabled: boolean, period = 4): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setOn(false);
      return;
    }
    const id = window.setInterval(() => setOn((v) => !v), Math.max(0.5, period / 2) * 1000);
    return () => window.clearInterval(id);
  }, [enabled, period]);
  return on;
}
