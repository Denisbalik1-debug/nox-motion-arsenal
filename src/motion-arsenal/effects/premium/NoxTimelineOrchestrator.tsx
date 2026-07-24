import { useRef } from 'react';
import { clamp, damp, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { easeOutBack, easeOutExpo, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// NoxTimelineOrchestrator — choreografierte Timeline-Sektion nach dem
// Shopify-Editions-/Theatre.js-Prinzip: EIN Timeline-Controller ist die
// Single Source of Truth, alle Objekte lesen ihren Zustand aus benannten
// Keyframes. Hier ohne Theatre-Dependency: `KEYFRAMES` definiert pro
// Systemobjekt [start, end] auf der Achse 0..1 plus Bewegungsrichtung;
// `stateAt(progress)` interpoliert mit outExpo/outBack. `progress` kommt im
// Produktiveinsatz vom Scroll (progress-Prop), in der Galerie vom Auto-Loop.
// Verbindungslinien zeichnen sich per stroke-dashoffset, sobald beide
// Endobjekte stehen — Motion folgt der Story: Module fahren ein → Layer
// verbinden sich → CTA entsteht.
// ---------------------------------------------------------------------------

export interface NoxTimelineOrchestratorProps {
  progress?: number; // 0..1 extern (Scroll); -1 = Auto-Loop für die Galerie
  playSpeed?: number; // 0.05..0.5 — Auto-Loop-Geschwindigkeit
  overshoot?: boolean; // outBack-Einfahrt statt outExpo
}

// Dokumentierte Keyframes: at = [enterStart, enterEnd] auf der 0..1-Achse.
// x/y in % der Bühne, from = Einfahrrichtung.
const KEYFRAMES = [
  { id: 'signal', label: 'Signals', x: 14, y: 26, at: [0.00, 0.16] as const, from: { x: -40, y: 0 } },
  { id: 'agents', label: 'Agent Stack', x: 38, y: 58, at: [0.12, 0.30] as const, from: { x: 0, y: 50 } },
  { id: 'automation', label: 'Automation', x: 58, y: 24, at: [0.26, 0.44] as const, from: { x: 0, y: -50 } },
  { id: 'followup', label: 'Follow-up', x: 76, y: 56, at: [0.40, 0.58] as const, from: { x: 40, y: 0 } },
  { id: 'cta', label: 'System läuft', x: 88, y: 30, at: [0.62, 0.82] as const, from: { x: 0, y: 30 } },
];

const LINKS: Array<[number, number, number]> = [
  // [fromIdx, toIdx, drawStart auf der 0..1-Achse]
  [0, 1, 0.30],
  [1, 2, 0.44],
  [2, 3, 0.58],
  [3, 4, 0.82],
];

function stateAt(progress: number, kf: (typeof KEYFRAMES)[number], overshoot: boolean) {
  const [a, b] = kf.at;
  const t = clamp((progress - a) / (b - a), 0, 1);
  const e = overshoot ? easeOutBack(t) : easeOutExpo(t);
  return {
    opacity: easeOutExpo(t),
    dx: kf.from.x * (1 - e),
    dy: kf.from.y * (1 - e),
    scale: 0.86 + 0.14 * e,
    done: t >= 1,
  };
}

export function NoxTimelineOrchestrator({
  progress = -1,
  playSpeed = 0.16,
  overshoot = true,
}: NoxTimelineOrchestratorProps) {
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const prog = useRef(0);

  useRafLoop((dt, elapsed) => {
    const target =
      progress >= 0 ? clamp(progress, 0, 1) : (elapsed * playSpeed) % 1.3 > 1 ? 1 : Math.min((elapsed * playSpeed) % 1.3, 1);
    prog.current = damp(prog.current, target, 6, dt);
    const p = prog.current;

    KEYFRAMES.forEach((kf, i) => {
      const el = nodeRefs.current[i];
      if (!el) return;
      const s = stateAt(p, kf, overshoot);
      el.style.opacity = s.opacity.toFixed(3);
      el.style.transform = `translate(-50%, -50%) translate(${s.dx.toFixed(2)}px, ${s.dy.toFixed(2)}px) scale(${s.scale.toFixed(3)})`;
    });

    LINKS.forEach(([, , drawStart], i) => {
      const line = lineRefs.current[i];
      if (!line) return;
      const t = clamp((p - drawStart) / 0.14, 0, 1);
      const len = Number(line.dataset.len ?? 100);
      line.style.strokeDashoffset = String(len * (1 - easeOutExpo(t)));
      line.style.opacity = t > 0 ? '1' : '0';
    });

    if (railRef.current) railRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
  }, !reduced);

  // Reduced motion: Endzustand statisch rendern.
  const staticState = reduced ? 1 : 0;

  return (
    <div
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, containerType: 'size' }}
    >
      <style>{`
        .nto-node {
          position: absolute;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(201, 48, 48, 0.35);
          background: rgba(17, 17, 20, 0.94);
          border-radius: 9px;
          padding: 8px 13px;
          font-family: var(--mono, monospace);
          font-size: clamp(8px, 1.6cqw, 11px);
          letter-spacing: 0.18em;
          font-weight: 700;
          color: ${NOX_COLORS.text};
          box-shadow: 0 0 26px rgba(201, 48, 48, 0.14);
          white-space: nowrap;
          will-change: transform, opacity;
        }
        .nto-node.nto-cta {
          border-color: rgba(57, 255, 139, 0.4);
          box-shadow: 0 0 26px rgba(57, 255, 139, 0.12);
        }
        .nto-line {
          stroke: rgba(255, 107, 107, 0.65);
          stroke-width: 1.4;
          filter: drop-shadow(0 0 5px rgba(201, 48, 48, 0.6));
        }
      `}</style>

      <div style={{ position: 'absolute', top: 14, left: 16, pointerEvents: 'none', zIndex: 3 }}>
        <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '0.4em', color: NOX_COLORS.textDim }}>
          TIMELINE ORCHESTRATOR // {reduced ? 'END-STATE' : progress >= 0 ? 'SCROLL-SYNC' : 'AUTO'}
        </div>
      </div>

      <div ref={stageRef} style={{ position: 'absolute', inset: '12% 4% 16% 4%' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {LINKS.map(([a, b], i) => {
            const A = KEYFRAMES[a];
            const B = KEYFRAMES[b];
            const len = Math.hypot(B.x - A.x, B.y - A.y) * 1.2;
            return (
              <line
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className="nto-line"
                x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                data-len={len}
                strokeDasharray={len}
                strokeDashoffset={reduced ? 0 : len}
                opacity={reduced ? 1 : 0}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {KEYFRAMES.map((kf, i) => (
          <div
            key={kf.id}
            ref={(el) => { nodeRefs.current[i] = el; }}
            className={`nto-node ${kf.id === 'cta' ? 'nto-cta' : ''}`}
            style={{
              left: `${kf.x}%`,
              top: `${kf.y}%`,
              opacity: staticState,
            }}
          >
            {kf.label}
          </div>
        ))}
      </div>

      {/* Progress-Rail wie eine sichtbare Zeitachse. */}
      <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: 18, height: 1, background: 'rgba(240,236,228,0.10)' }}>
        <div
          ref={railRef}
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left',
            transform: `scaleX(${staticState})`,
            background: 'linear-gradient(to right, rgba(201,48,48,0.8), rgba(57,255,139,0.55))',
          }}
        />
      </div>
    </div>
  );
}

export default NoxTimelineOrchestrator;
