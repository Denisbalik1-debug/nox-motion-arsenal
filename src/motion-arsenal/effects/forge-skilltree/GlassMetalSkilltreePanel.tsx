import React from 'react';
import { SkillNode, AtmosLayer } from './skilltreeShared';

// ---------------------------------------------------------------------------
// GlassMetalSkilltreePanel — Skilltree-Panel als Glass/Metal-Fläche:
// backdrop-blur über der Atmosphäre, Metall-Lichtkante oben, Hover-Tiefe
// (translateY + Glow-Schatten). Enthält Mini-Nodes als Panel-Inhalt.
// ---------------------------------------------------------------------------

export interface GlassMetalSkilltreePanelProps {
  blur?: number; // px
  hoverLift?: boolean;
}

export function GlassMetalSkilltreePanel({ blur = 9, hoverLift = true }: GlassMetalSkilltreePanelProps) {
  return (
    <div className="stfx-stage" style={{ display: 'grid', placeItems: 'center', padding: 16 }}>
      <AtmosLayer particles={14} stars={20} />
      <div
        className={`stfx-glass${hoverLift ? ' stfx-hover' : ''}`}
        style={{ width: 'min(86%, 420px)', height: '70%', position: 'relative', backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` }}
      >
        <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4af37' }}>
          Systemkarte
        </div>
        <SkillNode state="completed" x={22} y={46} label="Fundament" size={40} />
        <SkillNode state="active" x={50} y={38} label="Aktiver Pfad" size={48} />
        <SkillNode state="locked" x={78} y={52} label="Später" size={40} />
      </div>
    </div>
  );
}

export default GlassMetalSkilltreePanel;
