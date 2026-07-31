import { useEffect, useMemo, useRef, useState } from 'react';

export type NoxCaseStudyGalleryVariant = 'case-studies' | 'hospitality' | 'local-business';
export type NoxCaseStudyGalleryLayout = 'editorial' | 'bento' | 'carousel';

export interface NoxGalleryItem {
  id: string;
  src: string;
  alt: string;
  eyebrow?: string;
  title: string;
  description?: string;
  metric?: string;
}

export interface NoxCaseStudyGalleryProps {
  items?: NoxGalleryItem[];
  variant?: NoxCaseStudyGalleryVariant;
  layout?: NoxCaseStudyGalleryLayout;
  showCaptions?: boolean;
  enableLightbox?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
}

const makeArtwork = (label: string, accent: string, secondary: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#08090d"/><stop offset=".52" stop-color="${accent}" stop-opacity=".72"/><stop offset="1" stop-color="${secondary}" stop-opacity=".9"/></linearGradient><filter id="n"><feTurbulence baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .12 0"/></filter></defs><rect width="1200" height="800" fill="url(#g)"/><circle cx="920" cy="120" r="310" fill="none" stroke="white" stroke-opacity=".12" stroke-width="2"/><circle cx="920" cy="120" r="220" fill="none" stroke="white" stroke-opacity=".08"/><path d="M-40 640 C260 420 480 760 760 470 S1240 300 1300 560" fill="none" stroke="white" stroke-opacity=".16" stroke-width="5"/><rect x="70" y="70" width="1060" height="660" rx="28" fill="none" stroke="white" stroke-opacity=".12"/><rect width="1200" height="800" filter="url(#n)" opacity=".35"/><text x="82" y="662" fill="white" fill-opacity=".92" font-family="Arial, sans-serif" font-size="58" font-weight="700">${label}</text><text x="86" y="705" fill="white" fill-opacity=".48" font-family="Arial, sans-serif" font-size="18" letter-spacing="7">NOX CASE STUDY</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const PRESETS: Record<NoxCaseStudyGalleryVariant, NoxGalleryItem[]> = {
  'case-studies': [
    { id: 'revenue-os', src: makeArtwork('Revenue OS', '#8d1621', '#1e0b12'), alt: 'Abstract red revenue system interface', eyebrow: 'AI GROWTH SYSTEM', title: 'Revenue OS', description: 'Positioning, lead capture and follow-up unified into one conversion system.', metric: '+38% qualified demand' },
    { id: 'agent-command', src: makeArtwork('Agent Command', '#3e2aa8', '#09142c'), alt: 'Abstract violet agent command interface', eyebrow: 'AGENT OPERATIONS', title: 'Agent Command', description: 'A visible operator layer for skills, tasks, blockers and execution state.', metric: '6 agents orchestrated' },
    { id: 'local-growth', src: makeArtwork('Local Growth', '#a96713', '#281307'), alt: 'Abstract amber local growth interface', eyebrow: 'CUSTOMER WEBSITE', title: 'Local Growth Engine', description: 'Premium presentation, local intent capture and frictionless inquiry flow.', metric: '3.2× more inquiries' },
    { id: 'conversion-lab', src: makeArtwork('Conversion Lab', '#126e72', '#061d20'), alt: 'Abstract teal conversion laboratory interface', eyebrow: 'EXPERIMENT SYSTEM', title: 'Conversion Lab', description: 'Rapid offer, CTA and landing-page experiments with measurable outcomes.', metric: '12 experiments shipped' },
  ],
  hospitality: [
    { id: 'restaurant', src: makeArtwork('Signature Dining', '#7b281a', '#1f100a'), alt: 'Premium restaurant visual', eyebrow: 'HOSPITALITY', title: 'Signature Dining', description: 'Atmospheric storytelling for menus, reservations and private events.', metric: '+24% reservations' },
    { id: 'hotel', src: makeArtwork('Quiet Luxury', '#4e4939', '#13140f'), alt: 'Premium hotel visual', eyebrow: 'BOUTIQUE HOTEL', title: 'Quiet Luxury', description: 'Room narratives, local discovery and direct booking confidence.', metric: '41% direct bookings' },
    { id: 'bakery', src: makeArtwork('Craft & Origin', '#9b5d25', '#2b1809'), alt: 'Premium artisan bakery visual', eyebrow: 'ARTISAN BRAND', title: 'Craft & Origin', description: 'Product imagery, provenance and local-store conversion in one gallery.', metric: '+31% store visits' },
    { id: 'event', src: makeArtwork('Private Events', '#3c273f', '#130d16'), alt: 'Premium private event visual', eyebrow: 'EVENT SALES', title: 'Private Events', description: 'A visual proof layer for weddings, launches and corporate bookings.', metric: '18 event leads' },
  ],
  'local-business': [
    { id: 'craft', src: makeArtwork('Built to Last', '#704328', '#1d110b'), alt: 'Craft business project visual', eyebrow: 'CRAFT BUSINESS', title: 'Built to Last', description: 'Project proof, service clarity and trust signals for regional specialists.', metric: '+46% quote requests' },
    { id: 'beauty', src: makeArtwork('Editorial Beauty', '#803d5d', '#1f0d17'), alt: 'Beauty studio project visual', eyebrow: 'BEAUTY STUDIO', title: 'Editorial Beauty', description: 'High-end treatment presentation with direct appointment pathways.', metric: '2.4× bookings' },
    { id: 'property', src: makeArtwork('Property Signal', '#344e66', '#0a141d'), alt: 'Property services project visual', eyebrow: 'PROPERTY SERVICE', title: 'Property Signal', description: 'Clear service regions, before-after proof and qualified inquiry capture.', metric: '63 qualified leads' },
    { id: 'consulting', src: makeArtwork('Expert Positioning', '#62520f', '#171405'), alt: 'Consulting project visual', eyebrow: 'CONSULTING', title: 'Expert Positioning', description: 'Authority-building case studies for premium professional services.', metric: '+29% close rate' },
  ],
};

export function NoxCaseStudyGallery({
  items,
  variant = 'case-studies',
  layout = 'editorial',
  showCaptions = true,
  enableLightbox = true,
  autoplay = false,
  autoplayDelay = 5200,
}: NoxCaseStudyGalleryProps) {
  const galleryItems = useMemo(() => (items?.length ? items : PRESETS[variant]), [items, variant]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const pointerStart = useRef<number | null>(null);

  const goTo = (index: number) => setActiveIndex((index + galleryItems.length) % galleryItems.length);
  const previous = () => goTo(activeIndex - 1);
  const next = () => goTo(activeIndex + 1);

  useEffect(() => {
    if (!autoplay || lightboxOpen || galleryItems.length < 2) return;
    const id = window.setInterval(next, Math.max(2400, autoplayDelay));
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, activeIndex, lightboxOpen, galleryItems.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, activeIndex, galleryItems.length]);

  const onPointerDown = (event: React.PointerEvent) => {
    pointerStart.current = event.clientX;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) < 42) return;
    delta > 0 ? previous() : next();
  };

  return (
    <section className={`ncsg ncsg-${layout}`} aria-label="Case study gallery" data-variant={variant}>
      <style>{CSS}</style>

      <div className="ncsg-header">
        <div>
          <span className="ncsg-kicker">SELECTED WORK</span>
          <h2>Proof that moves.</h2>
        </div>
        <div className="ncsg-count" aria-live="polite">
          {String(activeIndex + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
        </div>
      </div>

      <div className="ncsg-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {galleryItems.map((item, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              className={`ncsg-card ${active ? 'is-active' : ''}`}
              style={{ '--ncsg-index': index } as React.CSSProperties}
              aria-label={`Open ${item.title}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => {
                setActiveIndex(index);
                if (active && enableLightbox) setLightboxOpen(true);
              }}
            >
              <img src={item.src} alt={item.alt} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
              <span className="ncsg-scrim" />
              {showCaptions && (
                <span className="ncsg-copy">
                  <span className="ncsg-eyebrow">{item.eyebrow}</span>
                  <strong>{item.title}</strong>
                  <span className="ncsg-description">{item.description}</span>
                  {item.metric && <span className="ncsg-metric">{item.metric}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="ncsg-controls">
        <button type="button" onClick={previous} aria-label="Previous gallery item">←</button>
        <div className="ncsg-dots" role="tablist" aria-label="Gallery slides">
          {galleryItems.map((item, index) => (
            <button key={item.id} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Show ${item.title}`} onClick={() => goTo(index)} />
          ))}
        </div>
        <button type="button" onClick={next} aria-label="Next gallery item">→</button>
      </div>

      {lightboxOpen && (
        <div className="ncsg-lightbox" role="dialog" aria-modal="true" aria-label={galleryItems[activeIndex].title} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
          <button className="ncsg-close" type="button" onClick={() => setLightboxOpen(false)} aria-label="Close lightbox">×</button>
          <button className="ncsg-lightbox-nav is-prev" type="button" onClick={previous} aria-label="Previous image">←</button>
          <figure>
            <img src={galleryItems[activeIndex].src} alt={galleryItems[activeIndex].alt} />
            <figcaption>
              <span>{galleryItems[activeIndex].eyebrow}</span>
              <strong>{galleryItems[activeIndex].title}</strong>
              <p>{galleryItems[activeIndex].description}</p>
            </figcaption>
          </figure>
          <button className="ncsg-lightbox-nav is-next" type="button" onClick={next} aria-label="Next image">→</button>
        </div>
      )}
    </section>
  );
}

const CSS = String.raw`
.ncsg{position:absolute;inset:0;overflow:hidden;padding:clamp(16px,3vw,34px);background:radial-gradient(circle at 78% 20%,rgba(139,31,45,.15),transparent 34%),linear-gradient(145deg,#08090c,#030406 72%);color:#f5f2eb;font-family:var(--sans,Inter,system-ui,sans-serif);container-type:size}.ncsg-header{position:relative;z-index:4;display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:clamp(12px,2.5cqh,24px)}.ncsg-kicker{display:block;margin-bottom:7px;color:rgba(229,72,88,.88);font:700 clamp(8px,1.3cqw,11px)/1 var(--mono,monospace);letter-spacing:.24em}.ncsg h2{margin:0;font-size:clamp(22px,4.8cqw,54px);line-height:.92;letter-spacing:-.055em}.ncsg-count{font:600 clamp(9px,1.4cqw,12px)/1 var(--mono,monospace);letter-spacing:.15em;color:rgba(255,255,255,.48)}.ncsg-stage{position:relative;height:calc(100% - clamp(94px,18cqh,150px));min-height:220px;touch-action:pan-y}.ncsg-card{position:absolute;inset:0;border:0;padding:0;overflow:hidden;border-radius:clamp(14px,2.5cqw,28px);background:#111;color:inherit;text-align:left;cursor:pointer;opacity:0;transform:translate3d(calc((var(--ncsg-index) - 1) * 7%),0,0) scale(.94);filter:saturate(.5) brightness(.52);pointer-events:none;transition:opacity .55s cubic-bezier(.16,1,.3,1),transform .65s cubic-bezier(.16,1,.3,1),filter .55s ease;box-shadow:0 30px 90px rgba(0,0,0,.34)}.ncsg-card.is-active{opacity:1;transform:none;filter:none;pointer-events:auto}.ncsg-card img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 1.1s cubic-bezier(.16,1,.3,1)}.ncsg-card:hover img{transform:scale(1.025)}.ncsg-scrim{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(2,3,6,.24) 54%,rgba(2,3,6,.92) 100%)}.ncsg-copy{position:absolute;left:clamp(16px,4cqw,48px);right:clamp(16px,4cqw,48px);bottom:clamp(16px,4cqh,40px);display:grid;gap:7px;max-width:min(620px,78%)}.ncsg-eyebrow{font:700 clamp(8px,1.25cqw,11px)/1 var(--mono,monospace);letter-spacing:.2em;color:rgba(255,255,255,.58)}.ncsg-copy strong{font-size:clamp(22px,5cqw,58px);line-height:.94;letter-spacing:-.05em}.ncsg-description{max-width:52ch;color:rgba(255,255,255,.68);font-size:clamp(11px,1.55cqw,15px);line-height:1.45}.ncsg-metric{justify-self:start;margin-top:5px;padding:7px 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(5,6,8,.36);backdrop-filter:blur(12px);font:700 clamp(8px,1.2cqw,11px)/1 var(--mono,monospace);letter-spacing:.08em}.ncsg-controls{position:absolute;right:clamp(16px,3vw,34px);bottom:clamp(12px,2vw,24px);z-index:5;display:flex;align-items:center;gap:10px}.ncsg-controls>button,.ncsg-lightbox-nav,.ncsg-close{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,255,255,.16);border-radius:50%;background:rgba(8,9,12,.72);color:#fff;cursor:pointer;backdrop-filter:blur(12px)}.ncsg-dots{display:flex;gap:5px}.ncsg-dots button{width:18px;height:3px;padding:0;border:0;border-radius:99px;background:rgba(255,255,255,.2);cursor:pointer;transition:width .3s ease,background .3s ease}.ncsg-dots button[aria-selected=true]{width:34px;background:#e54858}.ncsg-bento .ncsg-stage{display:grid;grid-template-columns:1.35fr .65fr;grid-template-rows:1fr 1fr;gap:10px}.ncsg-bento .ncsg-card{position:relative;inset:auto;opacity:.72;transform:none;filter:saturate(.72) brightness(.7);pointer-events:auto}.ncsg-bento .ncsg-card:first-child{grid-row:1/-1}.ncsg-bento .ncsg-card:nth-child(n+4){display:none}.ncsg-bento .ncsg-card.is-active{opacity:1;filter:none}.ncsg-bento .ncsg-copy{max-width:90%}.ncsg-bento .ncsg-description{display:none}.ncsg-carousel .ncsg-card{inset:4% 14%}.ncsg-lightbox{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:clamp(18px,4vw,54px);background:rgba(2,3,5,.94);backdrop-filter:blur(18px)}.ncsg-lightbox figure{margin:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,330px);width:min(1180px,92vw);max-height:88vh;border:1px solid rgba(255,255,255,.12);border-radius:22px;overflow:hidden;background:#090a0d}.ncsg-lightbox figure img{width:100%;height:100%;min-height:360px;object-fit:cover}.ncsg-lightbox figcaption{display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(22px,4vw,48px)}.ncsg-lightbox figcaption span{font:700 9px/1 var(--mono,monospace);letter-spacing:.2em;color:#e54858}.ncsg-lightbox figcaption strong{margin-top:10px;font-size:clamp(26px,4vw,48px);line-height:.95;letter-spacing:-.05em}.ncsg-lightbox figcaption p{color:rgba(255,255,255,.62);line-height:1.55}.ncsg-close{position:absolute;top:18px;right:18px;font-size:24px}.ncsg-lightbox-nav{position:absolute;top:50%;transform:translateY(-50%)}.ncsg-lightbox-nav.is-prev{left:18px}.ncsg-lightbox-nav.is-next{right:18px}@media(max-width:620px){.ncsg{padding:14px}.ncsg-stage{height:calc(100% - 104px)}.ncsg-copy{max-width:92%}.ncsg-description{display:none}.ncsg-bento .ncsg-stage{display:block}.ncsg-bento .ncsg-card{position:absolute;inset:0}.ncsg-bento .ncsg-card:not(.is-active){opacity:0;pointer-events:none}.ncsg-carousel .ncsg-card{inset:0}.ncsg-lightbox figure{grid-template-columns:1fr}.ncsg-lightbox figure img{min-height:48vh}.ncsg-lightbox figcaption{padding:18px}.ncsg-lightbox-nav{display:none}}@media(prefers-reduced-motion:reduce){.ncsg-card,.ncsg-card img,.ncsg-dots button{transition:none}.ncsg-card:hover img{transform:none}}
`;

export default NoxCaseStudyGallery;
