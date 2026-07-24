import React from 'react';
import './skilltree.css';

// ---------------------------------------------------------------------------
// Geteilte Primitives der Kategorie "NOX Forge Skilltree Systems".
// Rekonstruiert aus dem Forge-Design-Lab (?designLab=1) — hier ist ab jetzt
// die Single Source für Skilltree-FX-Experimente. Kein WebGL, keine Deps.
// ---------------------------------------------------------------------------

export type SkillNodeState = 'locked' | 'available' | 'active' | 'completed' | 'risk' | 'recommended';

export const NODE_STATE_LABEL: Record<SkillNodeState, string> = {
  locked: 'Gesperrt',
  available: 'Verfügbar',
  active: 'Aktiv',
  completed: 'Abgeschlossen',
  risk: 'Risiko',
  recommended: 'Empfohlen',
};

// Deterministische Pseudo-Zufallswerte (stabil über Renders, kein Math.random).
export function det(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Minimale Inline-SVG-Icons (keine Icon-Library im Arsenal).
const ic = (d: string) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
export const ICONS: Record<SkillNodeState, React.ReactNode> = {
  locked: ic('M7 11V7a5 5 0 0 1 10 0v4 M5 11h14v10H5z'),
  available: ic('M13 2 3 14h7l-1 8 10-12h-7z'),
  active: ic('M12 2c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 3-7 1 2 3 3 3-3z'),
  completed: ic('M20 6 9 17l-5-5'),
  risk: ic('M12 3 2 21h20z M12 10v5 M12 18v.5'),
  recommended: ic('M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z'),
};

// Ein Skilltree-Node mit State-Visual (Position in % im Parent).
export function SkillNode({
  state, x, y, label, size = 50, badge, floatDur = 7, floatDelay = 0, speed = 1, glitch = 1,
}: {
  state: SkillNodeState; x: number; y: number; label?: string;
  size?: number; badge?: string; floatDur?: number; floatDelay?: number; speed?: number; glitch?: number;
}) {
  return (
    <div
      className={`stfx-node stfx-node--${state}`}
      style={{
        left: `${x}%`, top: `${y}%`,
        ['--d' as any]: `${floatDur}s`, ['--dl' as any]: `${floatDelay}s`,
        ['--stfx-size' as any]: `${size}px`,
        ['--stfx-speed' as any]: speed,
        ['--stfx-glitch' as any]: glitch,
      }}
      title={label ? `${label} — ${NODE_STATE_LABEL[state]}` : NODE_STATE_LABEL[state]}
    >
      <span className="stfx-core">{ICONS[state]}</span>
      {label && <span className="stfx-label">{label}</span>}
      {badge && <span className="stfx-badge">{badge}</span>}
    </div>
  );
}

export function linkClass(state: SkillNodeState, speed = 1): { className: string; style?: React.CSSProperties } {
  const style = { ['--stfx-speed' as any]: speed } as React.CSSProperties;
  if (state === 'risk') return { className: 'stfx-link stfx-link--risk', style };
  if (state === 'active' || state === 'recommended') return { className: 'stfx-link stfx-link--lit stfx-link--flow', style };
  if (state === 'completed' || state === 'available') return { className: 'stfx-link stfx-link--lit', style };
  return { className: 'stfx-link stfx-link--dim', style };
}

// Partikel-/Stern-/Ember-Layer (deterministisch platziert).
export function AtmosLayer({ particles = 0, stars = 0, embers = 0 }: { particles?: number; stars?: number; embers?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
      {Array.from({ length: particles }, (_, i) => (
        <span key={`p${i}`} className="stfx-particle" style={{
          left: `${det(i, 1) * 100}%`, top: `${det(i, 2) * 100}%`,
          ['--d' as any]: `${11 + det(i, 3) * 10}s`, ['--dl' as any]: `${det(i, 4) * -12}s`,
          ['--dx' as any]: `${(det(i, 5) - 0.5) * 56}px`, ['--dy' as any]: `${(det(i, 6) - 0.5) * 72}px`,
        }} />
      ))}
      {Array.from({ length: stars }, (_, i) => (
        <span key={`s${i}`} className="stfx-star" style={{
          left: `${det(i, 11) * 100}%`, top: `${det(i, 12) * 100}%`,
          ['--d' as any]: `${3 + det(i, 13) * 5}s`, ['--dl' as any]: `${det(i, 14) * -6}s`,
        }} />
      ))}
      {Array.from({ length: embers }, (_, i) => (
        <span key={`e${i}`} className="stfx-ember" style={{
          left: `${det(i, 21) * 100}%`, bottom: `${det(i, 22) * 25}%`,
          ['--d' as any]: `${7 + det(i, 23) * 6}s`, ['--dl' as any]: `${det(i, 24) * -10}s`,
          ['--dx' as any]: `${(det(i, 25) - 0.5) * 50}px`,
        }} />
      ))}
    </div>
  );
}

// Demo-Baumdaten (nur Demo — keine Produktdaten).
export const DEMO_NODES: { label: string; state: SkillNodeState }[] = [
  { label: 'Reizunterdrückung', state: 'completed' },
  { label: 'Impulskontrolle', state: 'active' },
  { label: 'Doomscrolling-Bremse', state: 'recommended' },
  { label: 'Hochreiz-Reset', state: 'risk' },
  { label: 'Schlafschutz', state: 'available' },
  { label: 'Deep-Work-Block', state: 'locked' },
];
