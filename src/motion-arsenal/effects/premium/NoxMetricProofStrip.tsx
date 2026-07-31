import React, { useEffect, useMemo, useRef, useState } from 'react';

export type MetricProofVariant = 'growth' | 'local-business' | 'hospitality';

export interface MetricProofItem {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  detail?: string;
}

export interface NoxMetricProofStripProps {
  variant?: MetricProofVariant;
  items?: MetricProofItem[];
  duration?: number;
  showDetails?: boolean;
  compact?: boolean;
}

const PRESETS: Record<MetricProofVariant, MetricProofItem[]> = {
  growth: [
    { value: 38, prefix: '+', suffix: '%', label: 'Qualified demand', detail: 'More relevant inquiries after repositioning.' },
    { value: 2.4, suffix: '×', label: 'Demo velocity', detail: 'More booked conversations from the same traffic.' },
    { value: 31, prefix: '-', suffix: '%', label: 'Sales friction', detail: 'Less explanation required before the call.' },
    { value: 12, label: 'Experiments shipped', detail: 'Offer and conversion tests launched rapidly.' },
  ],
  'local-business': [
    { value: 46, prefix: '+', suffix: '%', label: 'Quote requests', detail: 'Clearer service presentation and stronger proof.' },
    { value: 29, prefix: '+', suffix: '%', label: 'Phone calls', detail: 'Improved local intent capture.' },
    { value: 3.1, suffix: '×', label: 'Conversion rate', detail: 'More visitors becoming real inquiries.' },
    { value: 4.9, suffix: '/5', label: 'Review signal', detail: 'Trust made visible at the right moment.' },
  ],
  hospitality: [
    { value: 24, prefix: '+', suffix: '%', label: 'Direct bookings', detail: 'More guests booking without intermediaries.' },
    { value: 18, label: 'Event leads', detail: 'Qualified requests for private occasions.' },
    { value: 41, suffix: '%', label: 'Direct share', detail: 'A stronger owned booking channel.' },
    { value: 3.6, suffix: '×', label: 'Menu engagement', detail: 'More guests exploring signature offers.' },
  ],
};

const formatValue = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

export function NoxMetricProofStrip({
  variant = 'growth',
  items,
  duration = 1200,
  showDetails = true,
  compact = false,
}: NoxMetricProofStripProps) {
  const metrics = useMemo(() => (items?.length ? items : PRESETS[variant]), [items, variant]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - started) / Math.max(300, duration));
      setProgress(1 - Math.pow(1 - next, 3));
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, duration, variant, items]);

  return (
    <section ref={rootRef} className={`nmps-stage ${compact ? 'is-compact' : ''}`} aria-label="Performance metrics">
      <style>{CSS}</style>
      <div className="nmps-shell">
        <div className="nmps-heading">
          <span>MEASURABLE PROOF</span>
          <strong>Results, not decoration.</strong>
        </div>
        <div className="nmps-grid">
          {metrics.map((metric, index) => {
            const rendered = metric.value * progress;
            return (
              <article key={`${metric.label}-${index}`} className="nmps-card">
                <div className="nmps-value" aria-label={`${metric.prefix ?? ''}${formatValue(metric.value)}${metric.suffix ?? ''}`}>
                  <span>{metric.prefix}</span>{formatValue(rendered)}<span>{metric.suffix}</span>
                </div>
                <strong>{metric.label}</strong>
                {showDetails && metric.detail && <p>{metric.detail}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const CSS = String.raw`
.nmps-stage{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;padding:clamp(18px,4vw,54px);background:radial-gradient(circle at 18% 18%,rgba(201,48,48,.12),transparent 34%),linear-gradient(145deg,#08090c,#030405 74%);color:#f5f2eb;font-family:var(--sans,system-ui,sans-serif)}.nmps-shell{width:min(1180px,100%);display:grid;gap:clamp(24px,5vw,58px)}.nmps-heading{display:grid;gap:8px}.nmps-heading span{font:700 10px/1 var(--mono,monospace);letter-spacing:.22em;color:#e85b68}.nmps-heading strong{font-size:clamp(28px,5vw,62px);line-height:.95;letter-spacing:-.055em}.nmps-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid rgba(255,255,255,.1);border-radius:24px;overflow:hidden;background:rgba(255,255,255,.02)}.nmps-card{min-height:250px;padding:clamp(20px,3vw,34px);display:flex;flex-direction:column;justify-content:flex-end;border-right:1px solid rgba(255,255,255,.08)}.nmps-card:last-child{border-right:0}.nmps-value{margin-bottom:auto;font-size:clamp(42px,7vw,86px);line-height:.9;font-weight:800;letter-spacing:-.07em;color:#fff}.nmps-value span{font-size:.42em;color:#ff7b88;letter-spacing:-.02em}.nmps-card>strong{font-size:15px;letter-spacing:-.01em}.nmps-card p{margin:8px 0 0;color:rgba(255,255,255,.5);font-size:12px;line-height:1.5}.nmps-stage.is-compact .nmps-heading{display:none}.nmps-stage.is-compact .nmps-card{min-height:180px}@media(max-width:860px){.nmps-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.nmps-card:nth-child(2){border-right:0}.nmps-card:nth-child(-n+2){border-bottom:1px solid rgba(255,255,255,.08)}}@media(max-width:520px){.nmps-stage{padding:14px}.nmps-shell{gap:22px}.nmps-card{min-height:175px;padding:18px}.nmps-value{font-size:44px}.nmps-card p{display:none}}
`;

export default NoxMetricProofStrip;
