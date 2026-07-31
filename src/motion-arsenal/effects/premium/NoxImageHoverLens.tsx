import React, { useId, useMemo, useState } from 'react';

export type ImageHoverLensVariant = 'product-detail' | 'architecture' | 'food';

export interface NoxImageHoverLensProps {
  variant?: ImageHoverLensVariant;
  image?: string;
  alt?: string;
  zoom?: number;
  lensSize?: number;
  showHint?: boolean;
}

const PRESETS: Record<ImageHoverLensVariant, { image: string; alt: string; title: string; detail: string }> = {
  'product-detail': {
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=84',
    alt: 'Premium product close-up',
    title: 'Inspect the detail',
    detail: 'Product pages · craftsmanship · premium commerce',
  },
  architecture: {
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=84',
    alt: 'Modern architecture exterior',
    title: 'Reveal the structure',
    detail: 'Architecture · interiors · property',
  },
  food: {
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=84',
    alt: 'Fine dining plate',
    title: 'See the craft',
    detail: 'Restaurants · hospitality · artisan products',
  },
};

export function NoxImageHoverLens({ variant = 'product-detail', image, alt, zoom = 2.1, lensSize = 180, showHint = true }: NoxImageHoverLensProps) {
  const preset = PRESETS[variant];
  const [point, setPoint] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);
  const id = useId();
  const safeZoom = Math.max(1.2, Math.min(4, zoom));
  const safeLens = Math.max(100, Math.min(280, lensSize));
  const src = image ?? preset.image;
  const description = useMemo(() => `${preset.title}. ${preset.detail}`, [preset]);

  const updatePoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPoint({
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  };

  return (
    <section className="nihl-stage" aria-labelledby={`${id}-title`}>
      <style>{CSS}</style>
      <div className="nihl-shell">
        <div className="nihl-copy">
          <span>DETAIL REVEAL</span>
          <h2 id={`${id}-title`}>{preset.title}</h2>
          <p>{preset.detail}</p>
        </div>
        <div
          className={`nihl-frame ${active ? 'is-active' : ''}`}
          onPointerEnter={(event) => { setActive(true); updatePoint(event); }}
          onPointerMove={updatePoint}
          onPointerLeave={() => setActive(false)}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setActive(true); updatePoint(event); }}
          onPointerUp={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          tabIndex={0}
          aria-label={description}
          style={{
            '--nihl-x': `${point.x}%`,
            '--nihl-y': `${point.y}%`,
            '--nihl-size': `${safeLens}px`,
            '--nihl-bg-size': `${safeZoom * 100}%`,
          } as React.CSSProperties}
        >
          <img src={src} alt={alt ?? preset.alt} draggable={false} />
          <span className="nihl-lens" aria-hidden="true" style={{ backgroundImage: `url(${src})` }} />
          {showHint && <span className="nihl-hint">Move to inspect · tap on mobile</span>}
        </div>
      </div>
    </section>
  );
}

const CSS = String.raw`
.nihl-stage{position:absolute;inset:0;display:grid;place-items:center;padding:clamp(16px,4vw,48px);overflow:hidden;background:radial-gradient(circle at 20% 18%,rgba(201,48,48,.13),transparent 34%),#06070a;color:#f4f1ea;font-family:var(--sans,system-ui,sans-serif)}.nihl-shell{width:min(1120px,100%);display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.45fr);gap:clamp(24px,5vw,72px);align-items:center}.nihl-copy{display:grid;gap:12px}.nihl-copy>span{font:700 9px/1 var(--mono,monospace);letter-spacing:.22em;color:#ff7d89}.nihl-copy h2{margin:0;font-size:clamp(34px,6vw,78px);line-height:.9;letter-spacing:-.065em}.nihl-copy p{margin:0;color:rgba(255,255,255,.5);font:600 10px/1.5 var(--mono,monospace);letter-spacing:.08em}.nihl-frame{position:relative;height:min(70vh,660px);min-height:360px;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:clamp(20px,3vw,34px);background:#111;box-shadow:0 40px 120px -52px rgba(0,0,0,.95);touch-action:none;outline:none}.nihl-frame:focus-visible{border-color:rgba(255,125,137,.72);box-shadow:0 0 0 3px rgba(255,125,137,.14),0 40px 120px -52px rgba(0,0,0,.95)}.nihl-frame>img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.82) brightness(.72);transition:filter .35s ease,transform .8s cubic-bezier(.16,1,.3,1)}.nihl-frame.is-active>img,.nihl-frame:hover>img{filter:saturate(1) brightness(.84);transform:scale(1.018)}.nihl-lens{position:absolute;left:var(--nihl-x);top:var(--nihl-y);width:var(--nihl-size);height:var(--nihl-size);border-radius:50%;transform:translate(-50%,-50%) scale(.78);opacity:0;pointer-events:none;border:1px solid rgba(255,255,255,.72);background-repeat:no-repeat;background-size:var(--nihl-bg-size);background-position:var(--nihl-x) var(--nihl-y);box-shadow:0 16px 48px rgba(0,0,0,.48),inset 0 0 0 8px rgba(8,9,12,.22);transition:opacity .22s ease,transform .35s cubic-bezier(.16,1,.3,1)}.nihl-frame.is-active .nihl-lens,.nihl-frame:hover .nihl-lens,.nihl-frame:focus-visible .nihl-lens{opacity:1;transform:translate(-50%,-50%) scale(1)}.nihl-hint{position:absolute;left:16px;bottom:16px;padding:8px 10px;border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(5,6,8,.62);backdrop-filter:blur(12px);font:700 8px/1 var(--mono,monospace);letter-spacing:.1em;color:rgba(255,255,255,.72)}@media(max-width:760px){.nihl-stage{overflow:auto;align-items:start}.nihl-shell{grid-template-columns:1fr}.nihl-copy h2{font-size:44px}.nihl-frame{height:62vh;min-height:380px}.nihl-lens{width:min(var(--nihl-size),42vw);height:min(var(--nihl-size),42vw)}}@media(hover:none){.nihl-frame:hover .nihl-lens{opacity:0}.nihl-frame.is-active .nihl-lens,.nihl-frame:focus-visible .nihl-lens{opacity:1}}@media(prefers-reduced-motion:reduce){.nihl-frame>img,.nihl-lens{transition:none!important}.nihl-frame.is-active>img,.nihl-frame:hover>img{transform:none}}
`;

export default NoxImageHoverLens;
