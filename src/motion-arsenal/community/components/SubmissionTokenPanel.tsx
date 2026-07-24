import React, { useEffect, useMemo, useState } from 'react';
import type { EffectManifest } from '../types';
import { buildImprovementPrompt } from '../prompt/buildImprovementPrompt';

type TokenAccess = {
  token: string;
  expiresAt: string;
  ttlMinutes: number;
};

function remaining(expiresAt: string, now: number): string {
  const milliseconds = Math.max(0, Date.parse(expiresAt) - now);
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function SubmissionTokenPanel({
  manifest,
  sources,
}: {
  manifest: EffectManifest;
  sources: Record<string, string>;
}) {
  const [access, setAccess] = useState<TokenAccess | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const expired = access ? Date.parse(access.expiresAt) <= now : false;
  const endpoint = `${window.location.origin}/api/community/submissions`;

  useEffect(() => {
    if (!access) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [access]);

  const promptWithAccess = useMemo(
    () => access && !expired
      ? buildImprovementPrompt(manifest, sources, true, {
          endpoint,
          token: access.token,
          expiresAt: access.expiresAt,
        })
      : '',
    [access, endpoint, expired, manifest, sources],
  );

  const createToken = async () => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/community/tokens/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectId: manifest.id,
          baseVersion: manifest.version,
          manifestHash: manifest.manifestHash,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.code ?? 'TOKEN_CREATE_FAILED');
      setAccess(body);
      setNow(Date.now());
      setMessage('Token wurde einmalig erzeugt. Er wird nicht dauerhaft im Browser gespeichert.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Token konnte nicht erzeugt werden.');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (!access) return;
    setBusy(true);
    try {
      const response = await fetch('/api/community/tokens/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: access.token }),
      });
      if (!response.ok) throw new Error('TOKEN_REVOKE_FAILED');
      setAccess(null);
      setMessage('Token widerrufen.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Token konnte nicht widerrufen werden.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="token-panel" data-testid="submission-token-panel">
      <div className="token-panel-copy">
        <span className="community-kicker">AUTOMATED SUBMISSION · LOCAL</span>
        <h4>60-Minuten-Zugang</h4>
        <p>Dieser Submission-Token ist 60 Minuten gültig und kann einmal erfolgreich verwendet werden.</p>
      </div>

      {!access ? (
        <div className="token-panel-actions">
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard?.writeText(buildImprovementPrompt(manifest, sources, true))}
          >
            PROMPT OHNE AUTOMATISCHE EINREICHUNG KOPIEREN
          </button>
          <button className="community-primary" disabled={busy} onClick={createToken}>
            60-MINUTEN-TOKEN ERZEUGEN
          </button>
        </div>
      ) : (
        <div className="token-live">
          <div className="token-clock">
            <span>Token läuft ab</span>
            <strong>{new Date(access.expiresAt).toLocaleString('de-DE')}</strong>
            <code>{expired ? 'ABGELAUFEN' : remaining(access.expiresAt, now)}</code>
          </div>
          <div className="token-panel-actions">
            <button
              className="community-primary"
              disabled={expired}
              onClick={() => navigator.clipboard?.writeText(promptWithAccess).then(() => setMessage('Prompt mit Submission-Zugang kopiert.'))}
            >
              PROMPT MIT SUBMISSION-ZUGANG KOPIEREN
            </button>
            {!expired && <button className="copy-btn" disabled={busy} onClick={revoke}>TOKEN WIDERRUFEN</button>}
            <button
              className="copy-btn"
              disabled={busy}
              onClick={() => {
                setAccess(null);
                void createToken();
              }}
            >
              NEUEN TOKEN ERZEUGEN
            </button>
          </div>
        </div>
      )}
      {message && <p className="token-message" role="status">{message}</p>}
    </div>
  );
}
