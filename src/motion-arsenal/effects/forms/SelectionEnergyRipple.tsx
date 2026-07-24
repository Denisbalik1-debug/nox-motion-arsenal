import React, { useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { usePrefersReducedMotion, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// SelectionEnergyRipple — Auswahl löst einen Energie-Ripple vom Klickpunkt
// aus (radialer Ring über die Karte), dann springen Funken-Partikel mit
// Gravitations-Bogen zum Fortschritts-Zähler, der aufblitzt und hochzählt.
// Mechanik: Partikel-Ballistik (CoinRain-Integration) + additive Funken.
// ---------------------------------------------------------------------------

export interface SelectionEnergyRippleProps {
  accent?: string;
  sparkCount?: number;
  gravity?: number;
}

interface Spark {
  x: number; y: number; vx: number; vy: number; life: number;
}

const OPTIONS = ['NIE', 'SELTEN', 'MANCHMAL', 'MEISTENS', 'IMMER'];

export function SelectionEnergyRipple({ accent = NOX_COLORS.red, sparkCount = 11, gravity = 480 }: SelectionEnergyRippleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [counterFlash, setCounterFlash] = useState(0);
  const reduced = usePrefersReducedMotion();
  const sparks = useRef<Spark[]>([]);
  const rnd = useRef(seededRandom(31));

  const select = (i: number, e: React.MouseEvent) => {
    setSelected(i);
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return;
    const x = e.clientX - root.left;
    const y = e.clientY - root.top;
    setRipple({ x, y, id: Date.now() });
    if (reduced) {
      setCount((c) => c + 1);
      return;
    }
    // Funken ballistisch Richtung Zähler starten
    const target = counterRef.current?.getBoundingClientRect();
    const tx = target ? target.left - root.left + target.width / 2 : root.width - 40;
    const ty = target ? target.top - root.top + target.height / 2 : 30;
    const n = Math.max(4, Math.min(24, Math.round(sparkCount)));
    for (let i2 = 0; i2 < n; i2++) {
      // Wurf-Physik: Flugzeit ~0.55-0.8s, vy so dass Bogen beim Ziel landet
      const T = 0.55 + rnd.current() * 0.25;
      const vx = (tx - x) / T + (rnd.current() - 0.5) * 60;
      const vy = (ty - y) / T - 0.5 * gravity * T + (rnd.current() - 0.5) * 50;
      sparks.current.push({ x, y, vx, vy, life: T });
    }
    // Zähler zündet, wenn die Funken ankommen
    setTimeout(() => {
      setCount((c) => c + 1);
      setCounterFlash(Date.now());
    }, 620);
  };

  useCanvas2D(
    canvasRef,
    (ctx, size, dt) => {
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.globalCompositeOperation = 'lighter';
      sparks.current = sparks.current.filter((s) => s.life > 0);
      for (const s of sparks.current) {
        s.life -= dt;
        s.vy += gravity * dt; // CoinRain: vel.y += gravity*dt (hier nach unten +)
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const a = Math.min(1, s.life * 2.4);
        ctx.fillStyle = `rgba(255, 200, 120, ${a.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // kleiner Schweif
        ctx.strokeStyle = `rgba(201, 48, 48, ${(a * 0.5).toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03);
        ctx.stroke();
      }
    },
    !reduced,
  );

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, background: '#0b0b0d', fontFamily: 'var(--sans, sans-serif)', overflow: 'hidden' }}>
      <style>{`
        @keyframes ser-ripple { 0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0.85; } 100% { transform: translate(-50%, -50%) scale(3.4); opacity: 0; } }
        @keyframes ser-counterflash { 0% { transform: scale(1); box-shadow: 0 0 0 rgba(212,162,74,0); } 30% { transform: scale(1.14); box-shadow: 0 0 22px rgba(212,162,74,0.6); } 100% { transform: scale(1); box-shadow: 0 0 0 rgba(212,162,74,0); } }
        @media (prefers-reduced-motion: reduce) { .ser-a { animation: none !important; } }
      `}</style>
      {/* Zähler oben rechts */}
      <div
        ref={counterRef}
        key={counterFlash}
        className="ser-a"
        style={{ position: 'absolute', top: 14, right: 16, zIndex: 2, fontFamily: 'var(--mono, monospace)', fontSize: 12, letterSpacing: '0.12em', color: NOX_COLORS.gold, border: `1px solid ${NOX_COLORS.gold}66`, borderRadius: 8, padding: '7px 13px', background: '#12100a', animation: counterFlash && !reduced ? `ser-counterflash 0.55s ${EASE.krankOvershoot} both` : undefined }}
      >
        ⚡ {count} LOCKED
      </div>

      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: '0 18px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontSize: 15, fontWeight: 650, color: NOX_COLORS.text, marginBottom: 4 }}>Hältst du dein Wort dir selbst gegenüber?</div>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 9.5, letterSpacing: '0.22em', color: NOX_COLORS.textDim, marginBottom: 14 }}>SELECT TO LOCK IN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {OPTIONS.map((o, i) => (
              <button
                key={o}
                onClick={(e) => select(i, e)}
                style={{
                  position: 'relative',
                  textAlign: 'left',
                  padding: '11px 14px',
                  borderRadius: 9,
                  border: `1px solid ${selected === i ? accent : '#26262d'}`,
                  background: selected === i ? `${accent}1c` : '#121215',
                  color: selected === i ? NOX_COLORS.text : NOX_COLORS.textDim,
                  fontFamily: 'var(--mono, monospace)',
                  fontSize: 11.5,
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  transition: `border-color 0.25s ease, background 0.25s ease, color 0.25s ease`,
                  overflow: 'visible',
                }}
              >
                <span style={{ color: selected === i ? accent : '#3a3a40', marginRight: 10 }}>{i}</span>
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ripple-Ring vom Klickpunkt */}
      {ripple && !reduced && (
        <div key={ripple.id} className="ser-a" style={{ position: 'absolute', left: ripple.x, top: ripple.y, width: 90, height: 90, borderRadius: '50%', border: `1.5px solid ${accent}`, animation: `ser-ripple 0.75s ${EASE.outExpo} both`, pointerEvents: 'none' }} />
      )}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
    </div>
  );
}

export default SelectionEnergyRipple;
