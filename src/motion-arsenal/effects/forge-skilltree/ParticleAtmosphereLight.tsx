import React from 'react';
import { AtmosLayer } from './skilltreeShared';

// ---------------------------------------------------------------------------
// ParticleAtmosphereLight — die leichteste Atmosphäre: radiale Glow-Gradients
// + driftende CSS-Partikel + optionales Sternfeld. Kein Canvas, kein rAF —
// als Hintergrund unter Dashboard-/Skilltree-Flächen gedacht.
// ---------------------------------------------------------------------------

export interface ParticleAtmosphereLightProps {
  particles?: number;
  stars?: number;
}

export function ParticleAtmosphereLight({ particles = 20, stars = 30 }: ParticleAtmosphereLightProps) {
  return (
    <div className="stfx-stage">
      <AtmosLayer particles={Math.min(60, Math.max(0, Math.round(particles)))} stars={Math.min(80, Math.max(0, Math.round(stars)))} />
      <span style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a' }}>
        Pure CSS · 0 rAF · als Unterlage für Panels/Skilltrees
      </span>
    </div>
  );
}

export default ParticleAtmosphereLight;
