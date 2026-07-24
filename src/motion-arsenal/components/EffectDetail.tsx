import React, { useMemo, useState } from 'react';
import type { EffectEntry } from '../types';
import { formatEffectUpdatedAt } from '../lib/effectDates';
import { EffectPreview } from './EffectPreview';
import { PropsPanel } from './PropsPanel';
import { FullscreenPreview } from './FullscreenPreview';
import { buildEffectManifest, getOwnedSourceFiles } from '../community/manifests/buildManifest';
import { buildImprovementPrompt } from '../community/prompt/buildImprovementPrompt';
import { createImprovementPackageTemplate } from '../community/lib/packageTemplate';
import { COMMUNITY_FEATURE_FLAGS } from '../community/config/featureFlags';
import { SubmissionTokenPanel } from '../community/components/SubmissionTokenPanel';

interface Props {
  entry: EffectEntry;
  onBack: () => void;
  onImprove: () => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
    >
      {copied ? '✓ COPIED' : label}
    </button>
  );
}

export function EffectDetail({ entry, onBack, onImprove }: Props) {
  const m = entry.meta;
  const updated = formatEffectUpdatedAt(m.updatedAt);
  const manifest = useMemo(() => buildEffectManifest(entry), [entry]);
  const ownedSources = useMemo(() => getOwnedSourceFiles(manifest), [manifest]);
  const [fullscreen, setFullscreen] = useState(false);
  const [propValues, setPropValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(m.props.map((p) => [p.key, p.default])),
  );

  const importLine = useMemo(
    () => `import { ${m.name.replace(/[^A-Za-z0-9]/g, '')} } from '${m.importPath}';`,
    [m],
  );

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← ARSENAL
      </button>
      <div className="arsenal-header" style={{ marginBottom: 16 }}>
        <h1>{m.displayName ?? m.name}</h1>
        <span className="sub">{m.name} · {m.id}</span>
      </div>
      <div className="badges" style={{ marginBottom: 16 }}>
        <span className="badge adapted">NOX Adapted</span>
        <span className={`badge ${m.complexity === 'heavy' ? 'heavy' : ''}`}>{m.complexity}</span>
        {m.status ? (
          <span className={`badge ${m.status === 'production-safe' ? 'prod' : m.status === 'experimental' ? 'heavy' : ''}`}>{m.status}</span>
        ) : m.productionSafe ? (
          <span className="badge prod">production safe</span>
        ) : (
          <span className="badge heavy">not for production</span>
        )}
        <span className="badge">{m.sourceWebsite}</span>
      </div>

      <div className="detail-grid">
        <div>
          <div className="fx-preview-detail">
            <EffectPreview key={entry.meta.id} entry={entry} propValues={propValues} variant="detail" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {m.fullBleed && (
              <button className="copy-btn" onClick={() => setFullscreen(true)}>
                ⛶ FULLSCREEN
              </button>
            )}
            <CopyButton text={importLine} label="COPY IMPORT" />
            <CopyButton text={m.usageJsx} label="COPY JSX" />
          </div>

          {COMMUNITY_FEATURE_FLAGS.manualSubmissions && (
            <div className="community-entry-panel">
              <div>
                <span className="community-kicker">COMMUNITY IMPROVEMENT</span>
                <h3>Den Effekt gezielt verbessern</h3>
                <p>Manifest, erlaubter Quellkontext und validierbares NOX Improvement Package.</p>
              </div>
              <div className="community-entry-actions">
                <CopyButton
                  text={buildImprovementPrompt(manifest, ownedSources, false)}
                  label="AI-PROMPT KOPIEREN"
                />
                <CopyButton
                  text={buildImprovementPrompt(manifest, ownedSources, true)}
                  label="PROMPT + EFFEKTCODE"
                />
                <CopyButton
                  text={JSON.stringify(createImprovementPackageTemplate(manifest), null, 2)}
                  label="PACKAGE-VORLAGE"
                />
                <button className="community-primary" onClick={onImprove}>VERBESSERUNG EINREICHEN</button>
              </div>
            </div>
          )}

          {COMMUNITY_FEATURE_FLAGS.tokenSubmissions && (
            <SubmissionTokenPanel manifest={manifest} sources={ownedSources} />
          )}

          <div className="panel" style={{ marginTop: 14 }}>
            <h4>Usage</h4>
            <div className="codebox">{`${importLine}\n\n${m.usageJsx}`}</div>
          </div>

          <div className="panel">
            <h4>Beschreibung</h4>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>{m.description}</p>
          </div>
        </div>

        <div>
          <PropsPanel
            controls={m.props}
            values={propValues}
            onChange={(k, v) => setPropValues((s) => ({ ...s, [k]: v }))}
          />
          <div className="panel">
            <h4>Metadaten</h4>
            <div className="meta-row"><span className="k">Source</span><span className="v">{m.sourceWebsite}</span></div>
            <div className="meta-row"><span className="k">Files</span><span className="v mono" style={{ fontSize: 10.5, wordBreak: 'break-all' }}>{m.sourceFiles.join(' · ')}</span></div>
            <div className="meta-row"><span className="k">Deps</span><span className="v">{m.dependencies.length ? m.dependencies.join(', ') : 'keine'}</span></div>
            <div className="meta-row"><span className="k">Best for</span><span className="v">{m.bestFor.join(', ')}</span></div>
            <div className="meta-row">
              <span className="k">Letztes Update</span>
              <time className="v" dateTime={m.updatedAt}>{updated.date} · {updated.relative}</time>
            </div>
            {m.currentUsage?.length ? (
              <div className="meta-row"><span className="k">Aktuell in</span><span className="v">{m.currentUsage.join(', ')}</span></div>
            ) : null}
            {m.technicalBasis ? (
              <div className="meta-row"><span className="k">Technik</span><span className="v">{m.technicalBasis}</span></div>
            ) : null}
            <div className="meta-row"><span className="k">Manifest</span><span className="v mono">{manifest.version}</span></div>
            <div className="meta-row">
              <span className="k">Manifest Hash</span>
              <span className="v mono" title={manifest.manifestHash}>{manifest.manifestHash.slice(0, 22)}…</span>
            </div>
            <div className="meta-row"><span className="k">Runtime</span><span className="v">{manifest.runtime}</span></div>
          </div>
          <div className="panel">
            <h4>Performance</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)' }}>{m.performanceNotes}</p>
          </div>
          <div className="panel">
            <h4>Mobile</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)' }}>{m.mobileNotes}</p>
          </div>
          <div className="panel">
            <h4>Reduced Motion</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)' }}>{m.reducedMotionNotes}</p>
          </div>
        </div>
      </div>

      {fullscreen && <FullscreenPreview entry={entry} propValues={propValues} onClose={() => setFullscreen(false)} />}
    </div>
  );
}
