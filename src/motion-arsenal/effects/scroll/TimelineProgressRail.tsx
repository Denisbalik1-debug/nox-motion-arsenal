import { useRef } from 'react';
import { clamp, damp, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// TimelineProgressRail — vertikale Timeline-Schiene: die Progress-Linie füllt
// sich mit dem (damped, Lenis-Gefühl) Scroll-Progress des internen Containers;
// Meilenstein-Nodes zünden nacheinander, sobald die Linie sie erreicht —
// Glow-Puls (outBack-Pop) + Checkmark-Draw via stroke-dashoffset, der aktive
// Abschnitt hebt sich mit KRANK-Overshoot-Easing ab. Scroll-Position →
// Timeline-Frame, wie die Theatre-Kopplung der Shopify-Szenen.
// ---------------------------------------------------------------------------

export interface TimelineProgressRailProps {
  milestones?: number; // 3..6
  damping?: number;
  glow?: number; // 0..1 glow intensity
  accent?: string;
  showPercent?: boolean;
}

const MILESTONES = [
  { tag: 'INIT', title: 'System Boot', body: 'Runtime hochgefahren, Wahrheitskette geladen.' },
  { tag: 'SCAN', title: 'Surface Analysis', body: 'Oberfläche abgetastet, Signale extrahiert.' },
  { tag: 'FORGE', title: 'Core Build', body: 'Kernmodul geschmiedet und verdrahtet.' },
  { tag: 'RANK', title: 'Signal Weighting', body: 'Ränge gewichtet, Rauschen verworfen.' },
  { tag: 'DEPLOY', title: 'Live Handover', body: 'Übergabe an die Produktionsschiene.' },
  { tag: 'ORBIT', title: 'Watch Loop', body: 'Beobachtungsschleife aktiv, System sendet.' },
];

export function TimelineProgressRail({
  milestones = 5,
  damping = 8,
  glow = 0.8,
  accent = NOX_COLORS.red,
  showPercent = true,
}: TimelineProgressRailProps) {
  const reduced = usePrefersReducedMotion();
  const n = clamp(Math.round(milestones), 3, MILESTONES.length);
  const items = MILESTONES.slice(0, n);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const smooth = useRef(0);

  useRafLoop(
    (dt) => {
      const el = scrollerRef.current;
      const content = contentRef.current;
      const fill = fillRef.current;
      if (!el || !content || !fill) return;
      const raw = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      smooth.current = damp(smooth.current, raw, damping, dt);
      const contentH = content.scrollHeight;
      // Fill grows through the whole content; the visible tip leads the reader.
      const fillH = smooth.current * contentH;
      fill.style.height = `${fillH.toFixed(1)}px`;
      if (tipRef.current) tipRef.current.style.top = `${fillH.toFixed(1)}px`;
      if (pctRef.current) pctRef.current.textContent = `${Math.round(smooth.current * 100)}%`;
      rowRefs.current.forEach((row) => {
        if (!row) return;
        const nodeY = row.offsetTop + 30; // node center within content
        const lit = fillH >= nodeY;
        if ((row.dataset.lit === 'true') !== lit) row.dataset.lit = String(lit);
      });
    },
    !reduced,
  );

  const glowPx = (10 + glow * 16).toFixed(0);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', containerType: 'size', background: 'linear-gradient(160deg, #0d0c0e 0%, #0a0a0b 70%)' }}>
      <style>{`
        .tpr-scroll { scrollbar-width: thin; scrollbar-color: rgba(240,236,228,0.18) transparent; }
        .tpr-scroll::-webkit-scrollbar { width: 6px; }
        .tpr-scroll::-webkit-scrollbar-track { background: transparent; }
        .tpr-scroll::-webkit-scrollbar-thumb { background: rgba(240,236,228,0.14); border-radius: 3px; }
        @keyframes tpr-ignite {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, ${accent} 60%, transparent); }
          60% { box-shadow: 0 0 ${glowPx}px ${(glow * 6).toFixed(0)}px color-mix(in srgb, ${accent} 45%, transparent); }
          100% { box-shadow: 0 0 ${(glow * 12).toFixed(0)}px 2px color-mix(in srgb, ${accent} 35%, transparent); }
        }
        .tpr-node {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(240,236,228,0.22);
          background: #111114;
          display: grid; place-items: center;
          transition: border-color 0.3s ${EASE.outExpo}, transform 0.6s ${EASE.outBack}, background 0.3s ${EASE.outExpo};
        }
        .tpr-check { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 0.7s ${EASE.outExpo} 0.12s; }
        [data-lit="true"] .tpr-node {
          border-color: ${accent};
          background: color-mix(in srgb, ${accent} 24%, #111114);
          transform: scale(1.22);
          animation: tpr-ignite 0.9s ${EASE.outBack} both;
        }
        [data-lit="true"] .tpr-check { stroke-dashoffset: 0; }
        .tpr-row-txt { transition: opacity 0.45s ${EASE.outExpo}, transform 0.5s ${EASE.krankOvershoot}; opacity: 0.35; transform: translateX(0); }
        [data-lit="true"] .tpr-row-txt { opacity: 1; transform: translateX(6px); }
        [data-lit="true"] .tpr-tag { color: ${accent}; }
        @media (prefers-reduced-motion: reduce) {
          .tpr-node, .tpr-check, .tpr-row-txt { transition: none !important; animation: none !important; }
        }
      `}</style>
      <div ref={scrollerRef} className="tpr-scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <div ref={contentRef} style={{ position: 'relative', padding: '8cqh 14px 8cqh 0' }}>
          {/* Rail */}
          <div style={{ position: 'absolute', left: 29, top: 0, bottom: 0, width: 2, background: 'rgba(240,236,228,0.1)' }}>
            <div
              ref={fillRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: reduced ? '100%' : '0px',
                background: `linear-gradient(180deg, ${accent} 0%, ${NOX_COLORS.gold} 100%)`,
                boxShadow: `0 0 ${(6 + glow * 10).toFixed(0)}px color-mix(in srgb, ${accent} 55%, transparent)`,
              }}
            />
            {!reduced && (
              <div
                ref={tipRef}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: NOX_COLORS.gold,
                  boxShadow: `0 0 ${(8 + glow * 12).toFixed(0)}px ${NOX_COLORS.gold}`,
                }}
              />
            )}
          </div>
          {/* Milestone rows */}
          {items.map((m, i) => (
            <div
              key={m.tag}
              ref={(r) => {
                rowRefs.current[i] = r;
              }}
              data-lit={reduced ? 'true' : 'false'}
              style={{ position: 'relative', minHeight: '46cqh', paddingLeft: 58, display: 'flex', alignItems: 'flex-start', paddingTop: 20 }}
            >
              <div style={{ position: 'absolute', left: 21, top: 21 }}>
                <div className="tpr-node">
                  <svg viewBox="0 0 18 18" width="11" height="11" style={{ overflow: 'visible' }}>
                    <path className="tpr-check" d="M3.5 9.5 L7.5 13 L14.5 5" fill="none" stroke={NOX_COLORS.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
                  </svg>
                </div>
              </div>
              <div className="tpr-row-txt">
                <div className="tpr-tag" style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.32em', color: NOX_COLORS.textDim, marginBottom: 4 }}>
                  {String(i + 1).padStart(2, '0')} / {m.tag}
                </div>
                <div style={{ fontSize: 'clamp(14px, 4cqw, 24px)', fontWeight: 750, letterSpacing: '-0.02em', color: NOX_COLORS.text, lineHeight: 1.05 }}>{m.title}</div>
                <div style={{ fontSize: 'clamp(10px, 2.2cqw, 13px)', color: NOX_COLORS.textDim, marginTop: 6, maxWidth: 300, lineHeight: 1.55 }}>{m.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showPercent && (
        <div
          ref={pctRef}
          style={{ position: 'absolute', top: 10, right: 14, fontFamily: 'var(--mono, monospace)', fontSize: 11, letterSpacing: '0.18em', color: NOX_COLORS.textDim, pointerEvents: 'none' }}
        >
          {reduced ? '100%' : '0%'}
        </div>
      )}
    </div>
  );
}

export default TimelineProgressRail;
