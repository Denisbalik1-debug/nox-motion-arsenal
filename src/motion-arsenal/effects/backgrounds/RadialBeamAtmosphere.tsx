import React, { useRef } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// RadialBeamAtmosphere — NOX Adapted. God-Ray-Atmosphäre aus zwei gegenläufig
// rotierenden conic-gradient-Strahlenkränzen + radialer Fade-Maske + Kern-Glow
// + Grain. Mechanik: Gobo-Light-Projection aus dem KRANK-Capture (projizierte
// Lichtkegel), umgesetzt als reine CSS-Compositing-Lösung (kein WebGL nötig).
// ---------------------------------------------------------------------------

export interface RadialBeamProps {
  beamCount?: number;
  rotationSpeed?: number; // Sekunden pro Umdrehung (kleiner = schneller)
  color?: string;
  coreGlow?: number; // 0..1
  originY?: number; // 0..100 — vertikale Position des Strahlen-Ursprungs in %
}

export function RadialBeamAtmosphere({ beamCount = 9, rotationSpeed = 60, color = '#C93030', coreGlow = 0.7, originY = 78 }: RadialBeamProps) {
  const reduced = usePrefersReducedMotion();
  const n = Math.max(4, Math.min(18, Math.round(beamCount)));
  const seg = 360 / n;
  // Strahlenkranz: schmale helle Keile im conic-gradient
  const beams = `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent ${seg * 0.62}deg, ${color}22 ${seg * 0.72}deg, ${color}55 ${seg * 0.82}deg, ${color}22 ${seg * 0.9}deg, transparent ${seg}deg)`;
  const beams2 = `repeating-conic-gradient(from ${seg / 2}deg at 50% 50%, transparent 0deg, transparent ${seg * 0.7}deg, ${color}18 ${seg * 0.8}deg, ${color}33 ${seg * 0.88}deg, transparent ${seg}deg)`;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#08080a' }}>
      <style>{`
        @keyframes rba-spin { to { transform: rotate(360deg); } }
        @keyframes rba-spin-rev { to { transform: rotate(-360deg); } }
        @keyframes rba-corepulse { 0%,100% { opacity: 1; } 50% { opacity: 0.65; } }
        @media (prefers-reduced-motion: reduce) { .rba-a { animation: none !important; } }
      `}</style>
      {/* Strahlen-Layer (2 gegenläufig, unterschiedliche Perioden) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `${originY}%`,
          width: '240vmax',
          height: '240vmax',
          marginLeft: '-120vmax',
          marginTop: '-120vmax',
          // Radiale Maske: Strahlen laufen nach außen aus
          WebkitMaskImage: 'radial-gradient(50% 50% at 50% 50%, black 0%, rgba(0,0,0,0.5) 26%, transparent 52%)',
          maskImage: 'radial-gradient(50% 50% at 50% 50%, black 0%, rgba(0,0,0,0.5) 26%, transparent 52%)',
        }}
      >
        <div className="rba-a" style={{ position: 'absolute', inset: 0, background: beams, animation: reduced ? undefined : `rba-spin ${rotationSpeed}s linear infinite`, mixBlendMode: 'screen' }} />
        <div className="rba-a" style={{ position: 'absolute', inset: 0, background: beams2, animation: reduced ? undefined : `rba-spin-rev ${rotationSpeed * 1.6}s linear infinite`, mixBlendMode: 'screen', opacity: 0.7 }} />
      </div>
      {/* Kern-Glow am Ursprung */}
      <div
        className="rba-a"
        style={{
          position: 'absolute',
          left: '50%',
          top: `${originY}%`,
          width: '70vmin',
          height: '46vmin',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(50% 50% at 50% 50%, ${color}66 0%, ${color}22 40%, transparent 70%)`,
          filter: 'blur(18px)',
          mixBlendMode: 'screen',
          opacity: coreGlow,
          animation: reduced ? undefined : 'rba-corepulse 7s ease-in-out infinite',
        }}
      />
      {/* Horizont-Abdunklung oben für Lesbarkeit */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,10,0.7) 0%, transparent 45%)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.045, mixBlendMode: 'overlay' }} aria-hidden>
        <filter id="rba-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" /></filter>
        <rect width="100%" height="100%" filter="url(#rba-grain)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>LIGHT SOURCE DETECTED</div>
          <div style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', fontWeight: 750, color: '#f0ece4' }}>RADIAL BEAM ATMOSPHERE</div>
        </div>
      </div>
    </div>
  );
}

export default RadialBeamAtmosphere;
