import React from 'react';
import { SkillNode, AtmosLayer, linkClass, det } from './skilltreeShared';

// ---------------------------------------------------------------------------
// ForgeChamberHardMode — die harte Variante der Konstellation für Black
// Forge / Hard Mode: rote Ember-Funken steigen auf, kantige Node-Kerne
// (border-radius 5px via Stage-Modifier), rot-goldene Pfade, Risiko präsent.
// ---------------------------------------------------------------------------

export interface ForgeChamberHardModeProps {
  embers?: number;
  speed?: number;
}

const ROOT = { x: 50, y: 52 };
const NODES: { x: number; y: number; label: string; state: 'active' | 'risk' | 'locked' | 'completed' | 'available' }[] = [
  { x: 24, y: 26, label: 'Konsumverzicht', state: 'active' },
  { x: 76, y: 24, label: 'Rechenschaft', state: 'available' },
  { x: 82, y: 66, label: 'Hochreiz-Muster', state: 'risk' },
  { x: 20, y: 70, label: 'Tag 7 Siegel', state: 'locked' },
  { x: 50, y: 14, label: 'Tag 1 bestanden', state: 'completed' },
];

export function ForgeChamberHardMode({ embers = 14, speed = 1 }: ForgeChamberHardModeProps) {
  return (
    <div className="stfx-stage stfx-stage--forge" style={{ ['--stfx-accent' as any]: '#d4af37' }}>
      <AtmosLayer particles={8} embers={Math.min(30, Math.max(0, Math.round(embers)))} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {NODES.map((n, i) => {
          const lc = linkClass(n.state, speed);
          return (
            <path
              key={n.label}
              className={lc.className}
              style={lc.style}
              d={`M ${ROOT.x} ${ROOT.y} Q ${(ROOT.x + n.x) / 2} ${(ROOT.y + n.y) / 2 - 4} ${n.x} ${n.y}`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <SkillNode state="active" x={ROOT.x} y={ROOT.y} label="Black Forge Protocol" size={64} speed={speed} floatDur={8} />
      {NODES.map((n, i) => (
        <SkillNode
          key={n.label}
          state={n.state}
          x={n.x} y={n.y}
          label={n.label}
          badge={n.state === 'risk' ? 'Blockiert' : undefined}
          floatDur={6 + det(i, 8) * 3}
          floatDelay={i * -1.2}
          speed={speed}
        />
      ))}
    </div>
  );
}

export default ForgeChamberHardMode;
