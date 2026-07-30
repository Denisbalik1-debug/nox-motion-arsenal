import React from 'react';
import type { EffectEntry, EffectImprovementStatus } from '../types';
import { formatEffectUpdatedAt } from '../lib/effectDates';
import { EffectPreview } from './EffectPreview';

interface Props {
  entry: EffectEntry;
  favorite: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const IMPROVEMENT_LABELS: Record<EffectImprovementStatus, string> = {
  pending: 'PENDING',
  'in-progress': 'IN PROGRESS',
  improved: 'IMPROVED',
  'needs-review': 'NEEDS REVIEW',
};

export function EffectCard({ entry, favorite, onOpen, onToggleFavorite }: Props) {
  const m = entry.meta;
  const updated = formatEffectUpdatedAt(m.lastImprovedAt ?? m.updatedAt);
  const improvementStatus = m.improvementStatus ?? 'pending';

  return (
    <article
      className={`fx-card ${favorite ? 'is-favorite' : ''}`}
      data-effect-id={m.id}
      data-improvement-status={improvementStatus}
      onClick={() => onOpen(m.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen(m.id);
      }}
      role="link"
      tabIndex={0}
    >
      <div className="fx-preview">
        <EffectPreview entry={entry} interactive={false} variant="thumbnail" />
        <button
          type="button"
          className={`favorite-btn ${favorite ? 'on' : ''}`}
          aria-label={`${m.displayName ?? m.name} ${favorite ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`}
          aria-pressed={favorite}
          data-favorite-effect={m.id}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(m.id);
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">{favorite ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="fx-card-body">
        <div className="fx-card-heading">
          <div className="fx-card-title">{m.displayName ?? m.name}</div>
          <time
            className="fx-updated"
            dateTime={m.lastImprovedAt ?? m.updatedAt}
            title={`Zuletzt verbessert: ${updated.date}`}
          >
            IMPROVED {updated.date} · {updated.relative}
          </time>
        </div>
        <p className="fx-card-desc">{m.description}</p>
        <div className="badges">
          <span className={`badge improvement-status improvement-${improvementStatus}`}>
            {IMPROVEMENT_LABELS[improvementStatus]}
          </span>
          {m.improvementVersion && <span className="badge">v{m.improvementVersion}</span>}
          <span className="badge adapted">NOX Adapted</span>
          <span className={`badge ${m.complexity === 'heavy' ? 'heavy' : ''}`}>{m.complexity}</span>
          {m.productionSafe && <span className="badge prod">production</span>}
          <span className="badge">{m.sourceWebsite}</span>
        </div>
      </div>
    </article>
  );
}
