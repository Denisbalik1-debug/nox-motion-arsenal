import React, { useEffect, useMemo, useRef, useState } from 'react';

export type TestimonialVariant = 'nox-clients' | 'local-business' | 'hospitality';

export interface TestimonialItem {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  metric?: string;
  rating?: number;
}

export interface NoxTestimonialSliderProps {
  variant?: TestimonialVariant;
  items?: TestimonialItem[];
  autoplay?: boolean;
  autoplayDelay?: number;
  showRating?: boolean;
  showMetric?: boolean;
}

const PRESETS: Record<TestimonialVariant, TestimonialItem[]> = {
  'nox-clients': [
    { quote: 'Aus einer losen Website-Idee wurde ein System, das Angebot, Nachfrage und Follow-up sichtbar zusammenführt.', name: 'Demo Client', role: 'Founder', company: 'Growth Company', metric: '+38% qualified inquiries', rating: 5 },
    { quote: 'Die neue Präsentation fühlt sich nicht nur hochwertiger an — sie erklärt unser Angebot in wenigen Sekunden.', name: 'Demo Client', role: 'Managing Director', company: 'Service Business', metric: '2.4× more demos', rating: 5 },
    { quote: 'Wir konnten endlich zeigen, was hinter unserer Leistung steckt, ohne die Seite mit Text zu überladen.', name: 'Demo Client', role: 'Operator', company: 'B2B Company', metric: '-31% sales friction', rating: 5 },
  ],
  'local-business': [
    { quote: 'Kunden verstehen jetzt sofort, was wir anbieten und wie sie uns erreichen. Die Anfragen sind deutlich konkreter.', name: 'Demo Owner', role: 'Inhaber', company: 'Lokaler Betrieb', metric: '+46% quote requests', rating: 5 },
    { quote: 'Die neue Seite wirkt wie unser Geschäft vor Ort: persönlich, hochwertig und einfach zu bedienen.', name: 'Demo Owner', role: 'Geschäftsführung', company: 'Regionaler Anbieter', metric: '+29% calls', rating: 5 },
    { quote: 'Vorher wurden wir nur gefunden. Jetzt werden wir auch ausgewählt.', name: 'Demo Owner', role: 'Inhaber', company: 'Local Service', metric: '3.1× conversion rate', rating: 5 },
  ],
  hospitality: [
    { quote: 'Die Atmosphäre unserer Location kommt online endlich genauso stark an wie vor Ort.', name: 'Demo Host', role: 'General Manager', company: 'Boutique Hospitality', metric: '+24% direct bookings', rating: 5 },
    { quote: 'Menü, Events und Reservierung greifen jetzt als ein Erlebnis ineinander.', name: 'Demo Host', role: 'Restaurant Owner', company: 'Hospitality Brand', metric: '+18 event leads', rating: 5 },
    { quote: 'Die Gäste kommen besser vorbereitet und buchen häufiger direkt statt über Umwege.', name: 'Demo Host', role: 'Operations', company: 'Independent Hotel', metric: '41% direct bookings', rating: 5 },
  ],
};

export function NoxTestimonialSlider({
  variant = 'nox-clients', items, autoplay = true, autoplayDelay = 5600, showRating = true, showMetric = true,
}: NoxTestimonialSliderProps) {
  const testimonials = useMemo(() => (items?.length ? items : PRESETS[variant]), [items, variant]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const go = (next: number) => setIndex((next + testimonials.length) % testimonials.length);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!autoplay || paused || reducedMotion || testimonials.length < 2) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % testimonials.length), Math.max(2600, autoplayDelay));
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, paused, reducedMotion, testimonials.length]);

  useEffect(() => setIndex(0), [variant, items]);

  return (
    <section className="nts-stage" aria-roledescription="carousel" aria-label="Customer testimonials"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => { if (event.key === 'ArrowLeft') go(index - 1); if (event.key === 'ArrowRight') go(index + 1); }}
      onPointerDown={(event) => { pointerStart.current = event.clientX; }}
      onPointerUp={(event) => { if (pointerStart.current === null) return; const delta = event.clientX - pointerStart.current; pointerStart.current = null; if (Math.abs(delta) >= 42) go(delta > 0 ? index - 1 : index + 1); }}>
      <style>{CSS}</style>
      <div className="nts-shell">
        <div className="nts-kicker">CLIENT SIGNALS</div>
        <div className="nts-slides" aria-live="polite">
          {testimonials.map((item, itemIndex) => {
            const active = itemIndex === index;
            const rating = Math.max(1, Math.min(5, item.rating ?? 5));
            return (
              <article key={`${item.name}-${itemIndex}`} className={`nts-card ${active ? 'is-active' : ''}`} aria-hidden={!active}>
                <div className="nts-quote-mark" aria-hidden="true">“</div>
                {showRating && <div className="nts-rating" aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}</div>}
                <blockquote>{item.quote}</blockquote>
                <footer><div><strong>{item.name}</strong><span>{[item.role, item.company].filter(Boolean).join(' · ')}</span></div>{showMetric && item.metric && <em>{item.metric}</em>}</footer>
              </article>
            );
          })}
        </div>
        <div className="nts-controls">
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous testimonial">←</button>
          <div className="nts-dots" role="tablist" aria-label="Testimonials">
            {testimonials.map((item, itemIndex) => <button key={`${item.name}-dot-${itemIndex}`} type="button" role="tab" aria-selected={itemIndex === index} aria-label={`Show testimonial ${itemIndex + 1}`} onClick={() => go(itemIndex)} />)}
          </div>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next testimonial">→</button>
        </div>
      </div>
    </section>
  );
}

const CSS = String.raw`
.nts-stage{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;padding:clamp(16px,4vw,48px);background:radial-gradient(circle at 72% 18%,rgba(201,48,48,.13),transparent 35%),linear-gradient(145deg,#09090c,#040406 72%);color:#f5f2eb;font-family:var(--sans,system-ui,sans-serif);touch-action:pan-y}.nts-shell{width:min(980px,100%);display:grid;gap:18px}.nts-kicker{font:700 10px/1 var(--mono,monospace);letter-spacing:.24em;color:#e85b68}.nts-slides{position:relative;min-height:clamp(300px,58vh,520px)}.nts-card{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:clamp(24px,6vw,72px);border:1px solid rgba(255,255,255,.11);border-radius:clamp(20px,3vw,34px);background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:0 34px 100px -46px rgba(0,0,0,.95);opacity:0;transform:translate3d(5%,0,0) scale(.97);pointer-events:none;transition:opacity .45s ease,transform .6s cubic-bezier(.16,1,.3,1)}.nts-card.is-active{opacity:1;transform:none;pointer-events:auto}.nts-quote-mark{position:absolute;top:18px;right:28px;font:700 clamp(70px,15vw,170px)/1 Georgia,serif;color:rgba(201,48,48,.13)}.nts-rating{position:relative;z-index:1;margin-bottom:20px;color:#ffc96a;font-size:14px;letter-spacing:.16em}.nts-card blockquote{position:relative;z-index:1;margin:0;max-width:22ch;font-size:clamp(26px,5vw,58px);line-height:1.02;letter-spacing:-.045em;font-weight:700}.nts-card footer{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-top:clamp(28px,6vh,58px)}.nts-card footer div{display:grid;gap:4px}.nts-card footer strong{font-size:14px}.nts-card footer span{font:500 10px/1.3 var(--mono,monospace);letter-spacing:.08em;color:rgba(255,255,255,.48)}.nts-card footer em{padding:9px 12px;border:1px solid rgba(201,48,48,.34);border-radius:999px;background:rgba(201,48,48,.09);color:#ff9aa4;font:700 10px/1 var(--mono,monospace);font-style:normal;letter-spacing:.08em;white-space:nowrap}.nts-controls{display:flex;align-items:center;justify-content:flex-end;gap:10px}.nts-controls>button{display:grid;place-items:center;width:40px;height:40px;border:1px solid rgba(255,255,255,.14);border-radius:50%;background:rgba(255,255,255,.025);color:#fff;cursor:pointer}.nts-dots{display:flex;gap:5px}.nts-dots button{width:18px;height:3px;padding:0;border:0;border-radius:99px;background:rgba(255,255,255,.18);cursor:pointer}.nts-dots button[aria-selected=true]{width:34px;background:#e85b68}@media(max-width:620px){.nts-stage{padding:14px}.nts-slides{min-height:440px}.nts-card{padding:26px 22px}.nts-card blockquote{font-size:clamp(24px,8vw,38px)}.nts-card footer{align-items:flex-start;flex-direction:column}.nts-quote-mark{right:16px}}@media(prefers-reduced-motion:reduce){.nts-card{transition:none}}
`;

export default NoxTestimonialSlider;
