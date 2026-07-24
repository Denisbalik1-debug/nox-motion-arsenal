import React, { useEffect } from 'react';
import type { EffectEntry } from '../types';
import { EffectPreview } from './EffectPreview';

interface Props {
  entry: EffectEntry;
  propValues: Record<string, unknown>;
  onClose: () => void;
}

export function FullscreenPreview({ entry, propValues, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fullscreen-overlay">
      <EffectPreview entry={entry} propValues={propValues} variant="fullscreen" />
      <button className="fullscreen-close" onClick={onClose}>
        ✕ ESC — SCHLIESSEN
      </button>
    </div>
  );
}
