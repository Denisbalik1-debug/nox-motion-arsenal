import React, { useMemo } from 'react';

export type LogoMarqueeVariant = 'clients' | 'partners' | 'press';

export interface LogoMarqueeItem {
  name: string;
  mark?: string;
  href?: string;
}

export interface NoxLogoMarqueeProps {
  variant?: LogoMarqueeVariant;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  fadeEdges?: boolean;
  items?: LogoMarqueeItem[];
}

const PRESETS: Record<LogoMarqueeVariant, LogoMarqueeItem[]> = {
  clients: [{ name: 'NOX Labs', mark: 'NOX' }, { name: 'Ulmer Gusto', mark: 'UG' }, { name: 'Regalprüfung Süd', mark: 'RS' }, { name: 'Sailer Systems', mark: 'SS' }, { name: 'Local Growth', mark: 'LG' }, { name: 'Agent Stack', mark: 'AS' }],
  partners: [{ name: 'Automation', mark: 'AUT' }, { name: 'AI Systems', mark: 'AI' }, { name: 'Revenue Ops', mark: 'REV' }, { name: 'Creative Tech', mark: 'CT' }, { name: 'Data Layer', mark: 'DATA' }, { name: 'Growth Engine', mark: 'GE' }],
  press: [{ name: 'Featured Work', mark: 'FW' }, { name: 'Digital Craft', mark: 'DC' }, { name: 'Future Commerce', mark: 'FC' }, { name: 'Local Leaders', mark: 'LL' }, { name: 'AI Builders', mark: 'AIB' }, { name: 'Modern Business', mark: 'MB' }],
};

export function NoxLogoMarquee({ variant = 'clients', speed = 28, direction = 'left', pauseOnHover = true, fadeEdges = true, items }: NoxLogoMarqueeProps) {
  const source = items?.length ? items : PRESETS[variant];
  const repeated = useMemo(() => [...source, ...source], [source]);
  const duration = Math.max(10, Math.min(80, speed));

  return (
    <div className={`nlm-stage ${fadeEdges ? 'with-fade' : ''}`}>
      <style>{`
        .nlm-stage{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 40%,rgba(201,48,48,.09),transparent 48%),#070708;color:#f4f1ea;font-family:var(--sans,system-ui,sans-serif)}
        .nlm-shell{width:100%;display:grid;gap:24px;padding:clamp(24px,6vw,70px) 0;border-block:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.008));overflow:hidden}
        .nlm-kicker{padding-inline:clamp(18px,5vw,70px);font:700 10px/1 var(--mono,monospace);letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.48)}
        .nlm-track{display:flex;width:max-content;gap:14px;will-change:transform;animation:nlm-scroll var(--nlm-duration) linear infinite}.nlm-track.reverse{animation-direction:reverse}.nlm-shell.pause .nlm-track:hover{animation-play-state:paused}
        .nlm-item{display:flex;align-items:center;gap:12px;min-width:190px;padding:16px 20px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.025);box-shadow:inset 0 1px rgba(255,255,255,.04);text-decoration:none;color:inherit;transition:transform .24s ease,border-color .24s ease,background .24s ease}.nlm-item:hover,.nlm-item:focus-visible{transform:translateY(-3px);border-color:rgba(201,48,48,.5);background:rgba(201,48,48,.07);outline:none}
        .nlm-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;border:1px solid rgba(201,48,48,.36);background:linear-gradient(145deg,rgba(201,48,48,.18),rgba(255,255,255,.03));font:800 10px/1 var(--mono,monospace);letter-spacing:.08em;color:#ff8b8b;box-shadow:0 0 20px rgba(201,48,48,.08)}.nlm-name{font-size:14px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}
        .nlm-stage.with-fade::before,.nlm-stage.with-fade::after{content:'';position:absolute;top:0;bottom:0;width:min(14vw,150px);z-index:3;pointer-events:none}.nlm-stage.with-fade::before{left:0;background:linear-gradient(90deg,#070708,transparent)}.nlm-stage.with-fade::after{right:0;background:linear-gradient(-90deg,#070708,transparent)}
        @keyframes nlm-scroll{to{transform:translateX(calc(-50% - 7px))}}@media(max-width:620px){.nlm-shell{gap:18px}.nlm-item{min-width:158px;padding:13px 15px}.nlm-mark{width:36px;height:36px}.nlm-name{font-size:12px}}@media(prefers-reduced-motion:reduce){.nlm-track{animation:none;transform:none;flex-wrap:wrap;width:auto;justify-content:center;padding-inline:18px}.nlm-stage.with-fade::before,.nlm-stage.with-fade::after{display:none}}
      `}</style>
      <div className={`nlm-shell ${pauseOnHover ? 'pause' : ''}`}>
        <div className="nlm-kicker">Selected clients · partners · references</div>
        <div className={`nlm-track ${direction === 'right' ? 'reverse' : ''}`} style={{ '--nlm-duration': `${duration}s` } as React.CSSProperties} aria-label={`${variant} logo marquee`}>
          {repeated.map((item, index) => {
            const duplicate = index >= source.length;
            const content = <><span className="nlm-mark" aria-hidden="true">{item.mark ?? item.name.slice(0, 3).toUpperCase()}</span><span className="nlm-name">{item.name}</span></>;
            return item.href ? <a key={`${item.name}-${index}`} className="nlm-item" href={item.href} target="_blank" rel="noreferrer" aria-hidden={duplicate || undefined} tabIndex={duplicate ? -1 : undefined}>{content}</a> : <div key={`${item.name}-${index}`} className="nlm-item" aria-hidden={duplicate || undefined}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

export default NoxLogoMarquee;
