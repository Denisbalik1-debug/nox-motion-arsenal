import React, { useEffect, useState } from 'react';
import { AtmosLayer } from './skilltreeShared';

// ---------------------------------------------------------------------------
// ProgressEnergyRing — XP-/Fortschritts-Ring als SVG-Kreis mit Glow-Füllung
// (stroke-dashoffset, CSS-Transition). Ergänzt ProgressRingCharge (conic) um
// die stroke-basierte Variante mit weichem cubic-bezier-Einlauf.
// ---------------------------------------------------------------------------

export interface ProgressEnergyRingProps {
  value?: number;   // 0..100
  size?: number;
  strokeWidth?: number;
  animateIn?: boolean;
}

export function ProgressEnergyRing({ value = 65, size = 140, strokeWidth = 5, animateIn = true }: ProgressEnergyRingProps) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(animateIn ? 0 : value);
  useEffect(() => {
    if (!animateIn) { setShown(value); return; }
    setShown(0);
    const t = setTimeout(() => setShown(value), 60);
    return () => clearTimeout(t);
  }, [value, animateIn]);
  const ratio = Math.min(1, Math.max(0, shown / 100));

  return (
    <div className="stfx-stage" style={{ display: 'grid', placeItems: 'center' }}>
      <AtmosLayer particles={10} />
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle className="stfx-ring-track" cx="50" cy="50" r={r} strokeWidth={strokeWidth} />
          <circle
            className="stfx-ring-fill"
            cx="50" cy="50" r={r} strokeWidth={strokeWidth}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - ratio)}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: size / 5.4 }}>{Math.round(shown)}%</div>
            <div style={{ color: '#71717a', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Progress Energy</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressEnergyRing;
