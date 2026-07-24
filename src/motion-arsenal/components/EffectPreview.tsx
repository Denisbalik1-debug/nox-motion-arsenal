import React, { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { EffectEntry } from '../types';
import { useInView } from '../lib/animationUtils';

class PreviewErrorBoundary extends Component<{ effectId: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    // Without this the crash is invisible: the boundary swallows it and the
    // preview just reads "CRASHED" with no way to tell which effect broke.
    console.error(`[arsenal] effect "${this.props.effectId}" crashed:`, error);
  }
  render() {
    if (this.state.failed) return <div className="fallback-note">EFFECT CRASHED — siehe Konsole</div>;
    return this.props.children;
  }
}

interface Props {
  entry: EffectEntry;
  propValues?: Record<string, unknown>;
  // Card previews are interactive-off so the card click always navigates.
  interactive?: boolean;
  variant?: 'thumbnail' | 'detail' | 'fullscreen';
}

interface PreviewSize { width: number; height: number }
const THUMBNAIL_OVERVIEW_RATIO = 4 / 3;

function usePreviewSize(ref: React.RefObject<HTMLDivElement | null>): PreviewSize {
  const [size, setSize] = useState<PreviewSize>({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize((current) => current.width === width && current.height === height ? current : { width, height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

function fittedProps(entry: EffectEntry, values: Record<string, unknown> | undefined, size: PreviewSize) {
  const next = { ...(values ?? {}) };
  for (const axis of ['width', 'height'] as const) {
    const control = entry.meta.props.find((item) => item.key === axis && item.type === 'range');
    if (!control) continue;
    if (next[axis] === undefined || next[axis] === control.default) {
      next[axis] = Math.max(1, Math.round(size[axis]));
    }
  }
  return next;
}

/**
 * Mounts an effect only while it is near the viewport (heavy WebGL previews
 * would otherwise all run at once) and gates `heavy` effects behind a
 * click-to-run button — the same tier-gating idea as Shopify's detect-gpu
 * fallback chain, just manual.
 */
export function EffectPreview({ entry, propValues, interactive = true, variant = 'detail' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '60px');
  const measured = usePreviewSize(ref);
  const stage = variant === 'thumbnail'
    ? {
        width: Math.max(1, measured.width * THUMBNAIL_OVERVIEW_RATIO),
        height: Math.max(1, measured.height * THUMBNAIL_OVERVIEW_RATIO),
      }
    : measured;
  const scale = variant === 'thumbnail' && measured.width > 0 && measured.height > 0
    ? Math.min(measured.width / stage.width, measured.height / stage.height)
    : 1;
  const componentProps = useMemo(
    () => fittedProps(entry, propValues, stage),
    [entry, propValues, stage.width, stage.height],
  );

  return (
    <div
      ref={ref}
      data-preview-shell={variant}
      style={{ position: 'absolute', inset: 0, pointerEvents: interactive ? 'auto' : 'none', overflow: 'hidden' }}
    >
      {/* Keyed by effect id so switching effects gives the run-gate and the
          error boundary a fresh instance. Without the key a single crashed
          effect left the boundary latched, and every effect opened afterwards
          rendered "EFFECT CRASHED" even though it was fine. */}
      {inView && (
        <PreviewBody
          key={entry.meta.id}
          entry={entry}
          propValues={componentProps}
          variant={variant}
          stage={stage}
          scale={scale}
        />
      )}
    </div>
  );
}

function PreviewBody({ entry, propValues, variant, stage, scale }: {
  entry: EffectEntry;
  propValues?: Record<string, unknown>;
  variant: NonNullable<Props['variant']>;
  stage: PreviewSize;
  scale: number;
}) {
  const needsGate = entry.meta.clickToRun || entry.meta.complexity === 'heavy';
  const [armed, setArmed] = useState(!needsGate);
  const Comp = entry.Component;

  if (!armed) {
    return (
      <div className="run-gate" style={{ pointerEvents: 'auto' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setArmed(true);
          }}
        >
          ▶ Run Effect
        </button>
        <span>HEAVY — startet erst auf Klick</span>
      </div>
    );
  }

  return (
    <PreviewErrorBoundary effectId={entry.meta.id}>
      <Suspense fallback={<div className="fallback-note">LOADING…</div>}>
        <div
          data-preview-stage={variant}
          style={{
            position: variant === 'thumbnail' ? 'absolute' : 'relative',
            left: variant === 'thumbnail' ? '50%' : undefined,
            top: variant === 'thumbnail' ? '50%' : undefined,
            width: variant === 'thumbnail' ? stage.width : '100%',
            height: variant === 'thumbnail' ? stage.height : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: variant === 'thumbnail' ? `translate(-50%, -50%) scale(${scale})` : undefined,
            transformOrigin: 'center',
          }}
        >
          <Comp {...(propValues ?? {})} />
        </div>
      </Suspense>
    </PreviewErrorBoundary>
  );
}
