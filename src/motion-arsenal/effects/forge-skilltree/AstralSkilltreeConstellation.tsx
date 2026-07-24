import React from 'react';
import { SkillNode, AtmosLayer, linkClass, DEMO_NODES, det, SkillNodeState } from './skilltreeShared';

// ---------------------------------------------------------------------------
// AstralSkilltreeConstellation — die Voll-Demo: schwebende Node-Konstellation
// um einen Root, Sternfeld + Partikel, SVG-Energiepfade nach State.
// ---------------------------------------------------------------------------

export interface AstralSkilltreeConstellationProps {
  nodeCount?: number;
  speed?: number;
  stars?: number;
  showLabels?: boolean;
}

const ROOT = { x: 22, y: 48 };
const POS = [
  { x: 44, y: 14 }, { x: 68, y: 26 }, { x: 78, y: 52 },
  { x: 64, y: 80 }, { x: 40, y: 74 }, { x: 54, y: 46 },
];

export function AstralSkilltreeConstellation({ nodeCount = 6, speed = 1, stars = 40, showLabels = true }: AstralSkilltreeConstellationProps) {
  const nodes = DEMO_NODES.slice(0, Math.max(1, Math.min(6, Math.round(nodeCount))));
  return (
    <div className="stfx-stage">
      <AtmosLayer particles={16} stars={stars} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {nodes.map((n, i) => {
          const p = POS[i % POS.length];
          const lc = linkClass(n.state as SkillNodeState, speed);
          return (
            <path
              key={n.label}
              className={lc.className}
              style={lc.style}
              d={`M ${ROOT.x} ${ROOT.y} Q ${(ROOT.x + p.x) / 2} ${(ROOT.y + p.y) / 2 - 6} ${p.x} ${p.y}`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <SkillNode state="active" x={ROOT.x} y={ROOT.y} label={showLabels ? 'Dopamin-Kontrolle' : undefined} size={62} floatDur={8} speed={speed} />
      {nodes.map((n, i) => (
        <SkillNode
          key={n.label}
          state={n.state}
          x={POS[i % POS.length].x}
          y={POS[i % POS.length].y}
          label={showLabels ? n.label : undefined}
          badge={n.state === 'recommended' ? 'Von NOX empfohlen' : undefined}
          floatDur={6 + det(i, 7) * 3}
          floatDelay={i * -0.9}
          speed={speed}
        />
      ))}
    </div>
  );
}

export default AstralSkilltreeConstellation;
