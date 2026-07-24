import React, { useCallback, useEffect, useState } from 'react';
import type { AgentReview, ImprovementPackage, SubmissionStatus } from '../types';

type AdminSubmission = {
  id: string;
  effectId: string;
  baseVersion: string;
  manifestHash: string;
  status: SubmissionStatus;
  packageHash: string;
  package: ImprovementPackage;
  createdAt: string;
  updatedAt: string;
  review?: AgentReview;
};

const ADMIN_HEADERS = { 'x-nox-local-admin': '1' };

export function AdminSubmissionsPage({ onBack }: { onBack: () => void }) {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('Lade lokale Review-Queue …');
  const [busy, setBusy] = useState(false);
  const [artifact, setArtifact] = useState<{
    previewUrl: string;
    contentHash: string;
    buildReport: { durationMs: number; files: string[]; warnings: string[] };
    securityReport: { compilerIsolation: string[]; limitations: string[] };
  } | null>(null);
  const selected = submissions.find((submission) => submission.id === selectedId) ?? submissions[0];

  const reload = useCallback(async () => {
    try {
      const response = await fetch('/api/community/admin/submissions', { headers: ADMIN_HEADERS });
      const body = await response.json();
      if (!response.ok) throw new Error(body.code ?? 'ADMIN_LOAD_FAILED');
      setSubmissions(body.submissions);
      setSelectedId((current) => current || body.submissions[0]?.id || '');
      setMessage(body.submissions.length ? '' : 'Noch keine lokalen Einreichungen.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review-Queue konnte nicht geladen werden.');
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const post = async (suffix: string, body?: unknown) => {
    if (!selected) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/community/admin/submissions/${selected.id}/${suffix}`, {
        method: 'POST',
        headers: { ...ADMIN_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.code ?? 'ADMIN_ACTION_FAILED');
      if (suffix === 'compile') setArtifact(payload.artifact);
      await reload();
      setMessage(suffix === 'review' ? 'Deterministischer Review gespeichert.' : 'Status aktualisiert.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="community-workbench admin-workbench" data-testid="admin-submissions">
      <header className="community-header">
        <button className="back-btn" onClick={onBack}>← ARSENAL</button>
        <div>
          <span className="community-kicker">LOCAL ADMIN · HUMAN GATE</span>
          <h2>Submission Review Queue</h2>
          <p>Kein Review veröffentlicht Code. Jeder Bericht bleibt Empfehlung und braucht menschliche Freigabe.</p>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-queue" aria-label="Submission queue">
          {submissions.map((submission) => (
            <button
              key={submission.id}
              className={submission.id === selected?.id ? 'active' : ''}
              onClick={() => setSelectedId(submission.id)}
            >
              <strong>{submission.package.proposal.title}</strong>
              <span>{submission.effectId}</span>
              <code>{submission.status}</code>
            </button>
          ))}
          {!submissions.length && <p className="community-muted">Queue ist leer.</p>}
        </aside>

        <main className="admin-review">
          {selected ? (
            <>
              <div className="manifest-seal">
                <span>SUBMISSION</span>
                <strong>{selected.package.proposal.title}</strong>
                <code>{selected.id}</code>
                <span>{new Date(selected.createdAt).toLocaleString('de-DE')} · {selected.status}</span>
              </div>
              <section className="community-panel">
                <h3>Vorschlag</h3>
                <p>{selected.package.proposal.summary}</p>
                <p className="community-muted">{selected.package.proposal.motivation}</p>
                <div className="admin-facts">
                  <span>{selected.package.files.length} Dateien</span>
                  <span>{selected.package.controls.length} Controls</span>
                  <span>{Object.keys(selected.package.dependencies.add).length} neue Dependencies</span>
                  <span>Base {selected.baseVersion}</span>
                </div>
              </section>
              <section className="community-panel">
                <h3>Dateien</h3>
                {selected.package.files.map((file) => (
                  <details key={file.path}>
                    <summary><code>{file.operation}</code> {file.path}</summary>
                    <pre className="admin-code">{file.content ?? '— kein Inhalt —'}</pre>
                  </details>
                ))}
              </section>
              <section className="community-panel">
                <h3>Deterministischer Agent-Review</h3>
                {selected.review ? (
                  <div className="review-report">
                    <strong>{selected.review.decision} · {selected.review.totalScore}/100</strong>
                    <p>{selected.review.summary}</p>
                    {Object.entries(selected.review.scores).map(([key, value]) => (
                      <div className="review-score" key={key}><span>{key}</span><meter min="0" max="10" value={value} /> <code>{value}</code></div>
                    ))}
                    {selected.review.securityFindings.map((finding) => <p className="finding error" key={finding}>{finding}</p>)}
                    <p className="community-muted">Human approval: zwingend erforderlich.</p>
                  </div>
                ) : <p className="community-muted">Noch kein statischer Review.</p>}
                <button className="community-primary" disabled={busy} onClick={() => void post('review')}>
                  STATIC REVIEW AUSFÜHREN
                </button>
              </section>
              <section className="community-panel">
                <h3>Isolierte lokale Preview</h3>
                <p className="community-muted">
                  Build im kurzlebigen Compilerprozess; Ausführung nur auf getrennter Origin im iframe ohne Same-Origin-Rechte.
                </p>
                <button className="community-primary" disabled={busy} onClick={() => void post('compile')}>
                  STATIC PREVIEW ARTEFAKT BAUEN
                </button>
                {artifact ? (
                  <div className="isolated-preview">
                    <div className="verification-rail">
                      <span>HASH {artifact.contentHash.slice(0, 12)}</span>
                      <span>{artifact.buildReport.durationMs} MS</span>
                      <span>CONNECT-SRC NONE</span>
                      <span>NO SAME ORIGIN</span>
                    </div>
                    <iframe
                      title="Isolierte Community Preview"
                      src={artifact.previewUrl}
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                      data-testid="isolated-preview-frame"
                    />
                    {artifact.securityReport.limitations.map((limitation) => (
                      <p className="finding warning" key={limitation}>{limitation}</p>
                    ))}
                  </div>
                ) : null}
              </section>
              <section className="community-panel">
                <h3>PR-Vorbereitung · kein Git-Schreibzugriff</h3>
                <pre className="admin-code">{JSON.stringify({
                  branch: `community/${selected.effectId}/${selected.id}`,
                  commitMessage: `feat(${selected.effectId}): apply approved community improvement`,
                  pullRequestTitle: `[Community] ${selected.package.proposal.title}`,
                  changedFiles: selected.package.files.map((file) => file.path),
                  tests: selected.package.verification.commands,
                  rollback: 'Revert the single integration commit; do not retain preview artifacts.',
                  requiresExplicitGo: ['branch', 'commit', 'push', 'publish PR', 'merge', 'deploy'],
                }, null, 2)}</pre>
              </section>
              <div className="admin-actions">
                <button disabled={busy} onClick={() => void post('status', { status: 'needs_changes', note: 'Manual review requested changes.' })}>ÄNDERUNGEN NÖTIG</button>
                <button disabled={busy} onClick={() => void post('status', { status: 'rejected', note: 'Rejected by local reviewer.' })}>ABLEHNEN</button>
                <button disabled={busy} onClick={() => void post('status', { status: 'approved', note: 'Approved for implementation preparation only.' })}>FÜR VORBEREITUNG FREIGEBEN</button>
              </div>
            </>
          ) : null}
        </main>
      </div>
      {message && <p className="token-message" role="status">{message}</p>}
    </section>
  );
}
