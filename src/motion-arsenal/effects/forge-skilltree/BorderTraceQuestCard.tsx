import React from 'react';
import { AtmosLayer } from './skilltreeShared';

// ---------------------------------------------------------------------------
// BorderTraceQuestCard — die aktive Quest-Karte: rotierender conic-Lichtkopf
// als Ring-Maske um eine Glass-Karte (BorderTraceDepth-Prinzip, CSS-only via
// @property-Winkel). Daneben eine erledigte Karte ohne Trace als Kontrast.
// ---------------------------------------------------------------------------

export interface BorderTraceQuestCardProps {
  traceSpeed?: number;
  accent?: string;
}

function QuestCard({ title, text, done, traceSpeed, accent }: { title: string; text: string; done?: boolean; traceSpeed?: number; accent?: string }) {
  return (
    <div
      className={`stfx-glass${done ? '' : ' stfx-trace'}`}
      style={{
        width: 'min(46%, 250px)', padding: '16px 18px',
        opacity: done ? 0.6 : 1,
        ['--stfx-speed' as any]: traceSpeed ?? 1,
        ['--stfx-accent' as any]: accent ?? '#d4af37',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: done ? '#71717a' : (accent ?? '#d4af37'), marginBottom: 8 }}>
        {done ? 'Erledigt' : 'Aktive Quest'}
      </div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 6, fontFamily: 'var(--sans, sans-serif)' }}>{title}</div>
      <div style={{ color: '#a1a1aa', fontSize: 11, lineHeight: 1.5, fontFamily: 'var(--sans, sans-serif)' }}>{text}</div>
      <div style={{ marginTop: 12, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a' }}>Belohnung: +250 XP</div>
    </div>
  );
}

export function BorderTraceQuestCard({ traceSpeed = 1, accent = '#d4af37' }: BorderTraceQuestCardProps) {
  return (
    <div className="stfx-stage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 16 }}>
      <AtmosLayer particles={10} />
      <QuestCard title="24h ohne Doomscrolling" text="Halte für 24 Stunden jede Zusage und blocke die Reizschleife nach 21 Uhr." traceSpeed={traceSpeed} accent={accent} />
      <QuestCard done title="3 Zusagen dokumentiert" text="Gestern abgeschlossen — Nachweis bestätigt." />
    </div>
  );
}

export default BorderTraceQuestCard;
