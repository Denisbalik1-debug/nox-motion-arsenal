import React from 'react';
import { AtmosLayer, det } from './skilltreeShared';

// ---------------------------------------------------------------------------
// SvgEnergyLinesFlow — die Energiepfade isoliert: gebogene SVG-Pfade mit
// wanderndem stroke-dash-Fluss (Fortschritt fließt sichtbar), plus dim/risk
// als Vergleich. Nur stroke-dashoffset — extrem billig.
// ---------------------------------------------------------------------------

export interface SvgEnergyLinesFlowProps {
  lineCount?: number;
  flowSpeed?: number;
}

export function SvgEnergyLinesFlow({ lineCount = 5, flowSpeed = 1 }: SvgEnergyLinesFlowProps) {
  const n = Math.max(2, Math.min(9, Math.round(lineCount)));
  return (
    <div className="stfx-stage">
      <AtmosLayer particles={8} stars={14} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => {
          const y0 = 14 + (i * 74) / Math.max(1, n - 1);
          const bend = (det(i, 9) - 0.5) * 26;
          const kind = i % 4 === 3 ? 'stfx-link stfx-link--risk' : 'stfx-link stfx-link--lit stfx-link--flow';
          return (
            <path
              key={i}
              className={kind}
              style={{ ['--stfx-speed' as any]: flowSpeed * (0.8 + det(i, 4) * 0.5) }}
              d={`M 8 ${y0} Q 50 ${y0 + bend} 92 ${y0}`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <span style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a' }}>
        Gold = Fortschritt fließt · Rot = Risiko-Pfad
      </span>
    </div>
  );
}

export default SvgEnergyLinesFlow;
