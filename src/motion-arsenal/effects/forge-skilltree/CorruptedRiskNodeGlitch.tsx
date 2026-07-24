import React from 'react';
import { SkillNode, AtmosLayer, linkClass } from './skilltreeShared';

// ---------------------------------------------------------------------------
// CorruptedRiskNodeGlitch — der Risiko-Zustand: kurzer horizontaler Glitch
// im langsamen Intervall + roter Glow-Spike, roter gestrichelter Pfad.
// Gefährlich, aber nicht billig: kein Dauerflackern, nur ein Zucken pro Zyklus.
// ---------------------------------------------------------------------------

export interface CorruptedRiskNodeGlitchProps {
  glitchIntensity?: number; // Multiplikator der Auslenkung
  cycleSpeed?: number;      // 1 = Standard (3.4s)
}

export function CorruptedRiskNodeGlitch({ glitchIntensity = 1, cycleSpeed = 1 }: CorruptedRiskNodeGlitchProps) {
  const risk = linkClass('risk');
  return (
    <div className="stfx-stage">
      <AtmosLayer particles={8} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className={risk.className} d="M 28 52 Q 44 40 62 48" vectorEffect="non-scaling-stroke" />
      </svg>
      <SkillNode state="active" x={28} y={52} label="Dein Ziel" />
      <SkillNode
        state="risk" x={62} y={48} size={62}
        label="Hochreiz-Muster"
        badge="Blockiert deinen Fortschritt"
        speed={cycleSpeed}
        glitch={glitchIntensity}
      />
    </div>
  );
}

export default CorruptedRiskNodeGlitch;
