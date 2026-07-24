import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SectionSnapDepth — CSS scroll-snap Sektionen mit Fokus-Tiefe: die aktive
// Sektion baut sich mit Tiefen-Stagger auf (scale 0.94→1 + Layer-Cascade),
// inaktive dimmen und blurren weg. Aktivierung via IntersectionObserver
// (Shopify RiveInner-Mechanik: Lazy-Aktivierung bei Viewport-Enter).
// ---------------------------------------------------------------------------

export interface SectionSnapDepthProps {
  sectionCount?: number;
  dimStrength?: number; // 0..1
  accent?: string;
}

const SECTIONS = [
  { kicker: 'PHASE 01', title: 'SCAN', body: 'Das System liest deinen Ist-Zustand. Ohne Beschönigung.' },
  { kicker: 'PHASE 02', title: 'RANK', body: 'Du bekommst einen Rang, keinen Ratschlag.' },
  { kicker: 'PHASE 03', title: 'QUEST', body: 'Eine Aufgabe. Klein genug für heute. Hart genug für morgen.' },
  { kicker: 'PHASE 04', title: 'FORGE', body: 'Wiederholung schmiedet. Das Protokoll hält dich im Feuer.' },
  { kicker: 'PHASE 05', title: 'ASCEND', body: 'Black Forge wartet auf die, die 30 Tage halten.' },
];

export function SectionSnapDepth({ sectionCount = 4, dimStrength = 0.7, accent = NOX_COLORS.red }: SectionSnapDepthProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();
  const n = Math.max(2, Math.min(5, Math.round(sectionCount)));

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.55) {
            setActive(Number((e.target as HTMLElement).dataset.idx));
          }
        }
      },
      { root: sc, threshold: [0.55] },
    );
    sc.querySelectorAll('[data-idx]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [n]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0a0a0b' }}>
      <style>{`
        @keyframes ssd-layer { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .ssd-a { animation: none !important; transition: none !important; } }
      `}</style>
      <div
        ref={scrollerRef}
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', scrollSnapType: reduced ? undefined : 'y mandatory' }}
      >
        {SECTIONS.slice(0, n).map((s, i) => {
          const isActive = reduced || active === i;
          return (
            <section
              key={i}
              data-idx={i}
              style={{
                height: '100%',
                scrollSnapAlign: 'start',
                display: 'grid',
                placeItems: 'center',
                position: 'relative',
              }}
            >
              <div
                className="ssd-a"
                style={{
                  textAlign: 'center',
                  maxWidth: '80%',
                  transform: isActive ? 'scale(1)' : 'scale(0.94)',
                  opacity: isActive ? 1 : 1 - dimStrength,
                  filter: isActive ? 'none' : `blur(${dimStrength * 4}px)`,
                  transition: `transform 0.7s ${EASE.outQuint}, opacity 0.55s ease, filter 0.55s ease`,
                }}
              >
                {/* Layer-Cascade beim Aktivwerden — key erzwingt Re-Animation */}
                <div key={isActive ? `on-${i}` : `off-${i}`}>
                  <div className="ssd-a" style={{ animation: isActive && !reduced ? `ssd-layer 0.5s ${EASE.outExpo} 0.05s both` : undefined, fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.32em', color: accent, marginBottom: 10 }}>
                    {s.kicker}
                  </div>
                  <div className="ssd-a" style={{ animation: isActive && !reduced ? `ssd-layer 0.55s ${EASE.outExpo} 0.14s both` : undefined, fontSize: 'clamp(34px, 7vw, 72px)', fontWeight: 800, letterSpacing: '-0.02em', color: NOX_COLORS.text, lineHeight: 1 }}>
                    {s.title}
                  </div>
                  <div className="ssd-a" style={{ animation: isActive && !reduced ? `ssd-layer 0.6s ${EASE.outExpo} 0.24s both` : undefined, fontSize: 13.5, color: NOX_COLORS.textDim, marginTop: 12 }}>
                    {s.body}
                  </div>
                  <div className="ssd-a" style={{ animation: isActive && !reduced ? `ssd-layer 0.6s ${EASE.outExpo} 0.34s both` : undefined, margin: '18px auto 0', width: 54, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                </div>
              </div>
              {/* Sektions-Index */}
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--mono, monospace)', fontSize: 10, color: isActive ? accent : '#3a3a40' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default SectionSnapDepth;
