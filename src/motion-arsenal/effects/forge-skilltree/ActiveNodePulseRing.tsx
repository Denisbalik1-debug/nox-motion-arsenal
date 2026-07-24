import React from 'react';
import { SkillNode, AtmosLayer } from './skilltreeShared';

// ---------------------------------------------------------------------------
// ActiveNodePulseRing — der Aktiv-Zustand isoliert: Glow-Puls + auslaufender
// Energiering. Daneben ein ruhender Available-Node als Kontrast.
// ---------------------------------------------------------------------------

export interface ActiveNodePulseRingProps {
  pulseSpeed?: number; // 1 = Standard
  size?: number;
}

export function ActiveNodePulseRing({ pulseSpeed = 1, size = 64 }: ActiveNodePulseRingProps) {
  return (
    <div className="stfx-stage">
      <AtmosLayer particles={8} />
      <SkillNode state="available" x={28} y={50} label="Verfügbar (ruhend)" size={size * 0.8} />
      <SkillNode state="active" x={62} y={50} label="Aktive Quest" size={size} speed={pulseSpeed} floatDur={7} />
    </div>
  );
}

export default ActiveNodePulseRing;
