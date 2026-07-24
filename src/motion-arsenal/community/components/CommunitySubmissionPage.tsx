import React, { useMemo, useRef, useState } from 'react';
import type { EffectEntry } from '../../types';
import { EffectPreview } from '../../components/EffectPreview';
import { DEFAULT_SUBMISSION_LIMITS } from '../config/submissionLimits';
import { buildControlDiffs, proposedTrustedValues } from '../lib/controlDiff';
import { createImprovementPackageTemplate } from '../lib/packageTemplate';
import { createSafeLineDiff } from '../lib/textDiff';
import { buildEffectManifest, getOwnedSourceFiles } from '../manifests/buildManifest';
import type { PackageValidationResult } from '../types';
import { validateImprovementPackage } from '../validation/validatePackage';

interface Props {
  entry: EffectEntry;
  onBack: () => void;
}

type PreviewViewport = 'desktop' | 'tablet' | 'mobile';
const VIEWPORT_WIDTHS: Record<PreviewViewport, number> = {
  desktop: 720,
  tablet: 560,
  mobile: 360,
};

function downloadText(filename: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CommunitySubmissionPage({ entry, onBack }: Props) {
  const manifest = useMemo(() => buildEffectManifest(entry), [entry]);
  const currentSources = useMemo(() => getOwnedSourceFiles(manifest), [manifest]);
  const template = useMemo(() => JSON.stringify(createImprovementPackageTemplate(manifest), null, 2), [manifest]);
  const [rawPackage, setRawPackage] = useState(template);
  const [validation, setValidation] = useState<PackageValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const [background, setBackground] = useState<'black' | 'paper' | 'grid'>('black');
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [previewRevision, setPreviewRevision] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const pkg = validation?.package;
  const controlDiffs = useMemo(
    () => pkg ? buildControlDiffs(manifest, pkg) : [],
    [manifest, pkg],
  );
  const proposedValues = useMemo(
    () => pkg ? proposedTrustedValues(manifest, pkg) : {},
    [manifest, pkg],
  );
  const fileChanges = pkg?.files ?? [];
  const activeFile = fileChanges.find((file) => file.path === selectedFile) ?? fileChanges[0];
  const activeDiff = activeFile
    ? createSafeLineDiff(currentSources[activeFile.path] ?? '', activeFile.operation === 'delete' ? '' : activeFile.content ?? '')
    : [];

  const validate = async () => {
    setValidating(true);
    try {
      const result = await validateImprovementPackage(rawPackage, manifest, currentSources);
      setValidation(result);
      setSelectedFile(result.package?.files[0]?.path ?? null);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="community-page" data-testid="community-submit-page">
      <button className="back-btn" onClick={onBack}>← EFFEKT</button>

      <header className="community-hero">
        <div>
          <span className="community-kicker">COMMUNITY IMPROVEMENT · PHASE 1</span>
          <h1>{manifest.displayName}</h1>
          <p>
            Paket lokal prüfen, Änderungen lesen und ausschließlich erlaubte Parameter auf dem bestehenden Effekt testen.
          </p>
        </div>
        <div className="manifest-seal" aria-label="Manifest identity">
          <span>BASE</span>
          <strong>{manifest.version}</strong>
          <code>{manifest.manifestHash.slice(0, 24)}…</code>
        </div>
      </header>

      <div className="verification-rail" aria-label="Submission verification stages">
        {['JSON', 'SCHEMA', 'POLICY', 'DIFF', 'TRUSTED PREVIEW'].map((label, index) => (
          <span key={label} className={validation && (validation.ok || index < 3) ? 'done' : ''}>
            <b>{String(index + 1).padStart(2, '0')}</b>{label}
          </span>
        ))}
      </div>

      <section className="community-section">
        <div className="community-section-heading">
          <div>
            <span className="community-kicker">PACKAGE INPUT</span>
            <h2>Manuell einreichen</h2>
          </div>
          <div className="community-actions">
            <button className="copy-btn" onClick={() => setRawPackage(template)}>VORLAGE EINSETZEN</button>
            <button className="copy-btn" onClick={() => downloadText(`${manifest.id}-improvement-package.json`, template)}>
              VORLAGE LADEN
            </button>
            <button className="copy-btn" onClick={() => fileInput.current?.click()}>JSON-DATEI ÖFFNEN</button>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept=".json,application/json"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > DEFAULT_SUBMISSION_LIMITS.maxPackageJsonBytes) {
                  setValidation({
                    ok: false,
                    findings: [{ code: 'PACKAGE_TOO_LARGE', message: 'Die Datei überschreitet 2 MiB.', severity: 'error' }],
                    metrics: { packageBytes: file.size, sourceBytes: 0, reportBytes: 0, fileCount: 0, dependenciesAdded: 0 },
                  });
                  return;
                }
                setRawPackage(await file.text());
                setValidation(null);
              }}
            />
          </div>
        </div>

        <textarea
          className="package-input"
          spellCheck={false}
          aria-label="Improvement Package JSON"
          value={rawPackage}
          onChange={(event) => {
            setRawPackage(event.target.value);
            setValidation(null);
          }}
        />
        <div className="package-input-footer">
          <span>{new TextEncoder().encode(rawPackage).byteLength.toLocaleString('de-DE')} / 2.097.152 UTF-8-Bytes</span>
          <button className="community-primary" disabled={validating} onClick={validate}>
            {validating ? 'PRÜFUNG LÄUFT…' : 'PACKAGE LOKAL VALIDIEREN'}
          </button>
        </div>
      </section>

      {validation && (
        <>
          <section className={`validation-summary ${validation.ok ? 'valid' : 'invalid'}`} data-testid="validation-summary">
            <div className="validation-orb" aria-hidden="true">{validation.ok ? '✓' : '!'}</div>
            <div>
              <span className="community-kicker">{validation.ok ? 'VALIDATED PACKAGE' : 'ACTION REQUIRED'}</span>
              <h2>{validation.ok ? 'Struktur und Policies sind gültig' : 'Das Paket ist noch nicht sicher verwendbar'}</h2>
              <p>
                {validation.metrics.fileCount} Dateien · {validation.metrics.sourceBytes.toLocaleString('de-DE')} Source-Bytes ·{' '}
                {validation.metrics.dependenciesAdded} neue Dependencies
              </p>
            </div>
            {validation.ok && (
              <button
                className="copy-btn"
                onClick={() => downloadText(`${manifest.id}-validated.json`, JSON.stringify(validation.package, null, 2))}
              >
                VALIDiertes PACKAGE EXPORTIEREN
              </button>
            )}
          </section>

          <section className="community-section">
            <div className="community-section-heading">
              <div>
                <span className="community-kicker">VALIDATION REPORT</span>
                <h2>Findings</h2>
              </div>
              <span className="community-count">{validation.findings.length}</span>
            </div>
            {validation.findings.length ? (
              <div className="finding-list">
                {validation.findings.map((finding, index) => (
                  <article className={`finding ${finding.severity}`} key={`${finding.code}-${index}`}>
                    <code>{finding.code}</code>
                    <p>{finding.message}</p>
                    {finding.path && <span>{finding.path}</span>}
                  </article>
                ))}
              </div>
            ) : (
              <p className="community-empty">Keine Schema-, Policy- oder Security-Verstöße erkannt.</p>
            )}
          </section>
        </>
      )}

      {validation?.package && (
        <>
          <section className="community-section">
            <div className="community-section-heading">
              <div>
                <span className="community-kicker">CHANGESET</span>
                <h2>{validation.package.proposal.title}</h2>
              </div>
            </div>
            <p className="community-lead">{validation.package.proposal.summary}</p>
            <div className="change-grid">
              <article>
                <span>FILES</span>
                <strong>{fileChanges.length}</strong>
              </article>
              <article>
                <span>CONTROLS</span>
                <strong>{controlDiffs.length}</strong>
              </article>
              <article>
                <span>DEPENDENCIES</span>
                <strong>{Object.keys(validation.package.dependencies.add).length}</strong>
              </article>
              <article>
                <span>SECURITY ERRORS</span>
                <strong>{validation.findings.filter((finding) => finding.severity === 'error').length}</strong>
              </article>
            </div>
          </section>

          <section className="community-section diff-workbench">
            <div className="community-section-heading">
              <div>
                <span className="community-kicker">SAFE TEXT DIFF</span>
                <h2>Dateiänderungen</h2>
              </div>
            </div>
            <div className="diff-layout">
              <nav className="diff-files" aria-label="Changed files">
                {fileChanges.map((file) => (
                  <button
                    key={file.path}
                    className={(activeFile?.path === file.path) ? 'active' : ''}
                    onClick={() => setSelectedFile(file.path)}
                  >
                    <span>{file.operation}</span>
                    {file.path}
                  </button>
                ))}
                {!fileChanges.length && <p className="community-empty">Keine Dateiänderungen im Paket.</p>}
              </nav>
              <pre className="code-diff" data-testid="safe-code-diff">
                {activeDiff.map((line, index) => (
                  <span className={line.type} key={index}>
                    <i>{line.oldLine ?? ''}</i><i>{line.newLine ?? ''}</i>
                    <b>{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</b>
                    <code>{line.text}</code>
                  </span>
                ))}
              </pre>
            </div>
          </section>

          <section className="community-section">
            <div className="community-section-heading">
              <div>
                <span className="community-kicker">CONTROL CONTRACT</span>
                <h2>Parameteränderungen</h2>
              </div>
            </div>
            <div className="control-diff-list">
              {controlDiffs.map((diff) => (
                <article key={diff.key}>
                  <span className={`change-action ${diff.action}`}>{diff.action}</span>
                  <strong>{diff.key}</strong>
                  <code>{JSON.stringify(diff.current?.defaultValue)} → {JSON.stringify(diff.proposed?.defaultValue)}</code>
                  <span>{diff.previewable ? 'In Phase 1 sicher testbar' : 'Nur strukturell dargestellt'}</span>
                </article>
              ))}
              {!controlDiffs.length && <p className="community-empty">Keine Control-Änderungen vorgeschlagen.</p>}
            </div>
          </section>

          <section className="community-section trusted-preview-section">
            <div className="community-section-heading">
              <div>
                <span className="community-kicker">TRUSTED PARAMETER PREVIEW</span>
                <h2>Original gegen erlaubte Parameter</h2>
              </div>
              <div className="preview-toolbar">
                {(['desktop', 'tablet', 'mobile'] as PreviewViewport[]).map((value) => (
                  <button key={value} className={viewport === value ? 'active' : ''} onClick={() => setViewport(value)}>
                    {value}
                  </button>
                ))}
                <select value={background} onChange={(event) => setBackground(event.target.value as typeof background)}>
                  <option value="black">NOX Black</option>
                  <option value="paper">Paper</option>
                  <option value="grid">Grid</option>
                </select>
                <button onClick={() => setPlaying((value) => !value)}>{playing ? 'PAUSE' : 'PLAY'}</button>
                <button className={reducedMotion ? 'active' : ''} onClick={() => setReducedMotion((value) => !value)}>REDUCE</button>
                <button onClick={() => setPreviewRevision((value) => value + 1)}>RESET</button>
              </div>
            </div>

            <div className="trusted-preview-notice">
              Diese Vorschau führt keinen eingereichten Quellcode aus. Sie verwendet ausschließlich den vorhandenen
              vertrauenswürdigen Effekt mit erlaubten Parameteränderungen.
            </div>

            <div
              className={`trusted-preview-viewport bg-${background} ${reducedMotion ? 'force-reduced-motion' : ''}`}
              style={{ maxWidth: VIEWPORT_WIDTHS[viewport] }}
            >
              <article>
                <header>ORIGINAL</header>
                <div className="trusted-preview-stage">
                  {playing && !reducedMotion
                    ? <EffectPreview key={`original-${previewRevision}`} entry={entry} propValues={Object.fromEntries(manifest.controls.map((control) => [control.key, control.defaultValue]))} />
                    : <div className="preview-paused">VORSCHAU PAUSIERT</div>}
                </div>
              </article>
              <article>
                <header>PROPOSED PARAMETERS</header>
                <div className="trusted-preview-stage">
                  {playing && !reducedMotion
                    ? <EffectPreview key={`proposed-${previewRevision}`} entry={entry} propValues={proposedValues} />
                    : <div className="preview-paused">REDUCED / PAUSED</div>}
                </div>
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
