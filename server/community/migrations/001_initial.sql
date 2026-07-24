PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS effects (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_version TEXT NOT NULL,
  current_manifest_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS effect_versions (
  effect_id TEXT NOT NULL REFERENCES effects(id),
  version TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (effect_id, version)
) STRICT;

CREATE TABLE IF NOT EXISTS submission_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  effect_id TEXT NOT NULL REFERENCES effects(id),
  base_version TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'consumed', 'expired', 'blocked', 'revoked')),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  revoked_at TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL CHECK (max_attempts > 0),
  created_at TEXT NOT NULL,
  last_attempt_at TEXT,
  blocked_at TEXT,
  block_reason TEXT,
  submission_id TEXT,
  created_by_ip_hash TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_submission_tokens_target
  ON submission_tokens(effect_id, status, expires_at);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  effect_id TEXT NOT NULL REFERENCES effects(id),
  base_version TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  token_id TEXT REFERENCES submission_tokens(id),
  status TEXT NOT NULL CHECK (
    status IN ('draft', 'submitted', 'validation_failed', 'needs_changes', 'approved', 'rejected', 'implementation_ready', 'applied')
  ),
  package_hash TEXT NOT NULL,
  package_json TEXT NOT NULL,
  idempotency_key TEXT,
  author_display_name TEXT,
  author_contact TEXT,
  author_anonymous INTEGER NOT NULL CHECK (author_anonymous IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(token_id, idempotency_key),
  UNIQUE(token_id, package_hash)
) STRICT;

CREATE TABLE IF NOT EXISTS submission_files (
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  operation TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT,
  previous_sha256 TEXT,
  content_sha256 TEXT NOT NULL,
  PRIMARY KEY (submission_id, path)
) STRICT;

CREATE TABLE IF NOT EXISTS validation_runs (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  valid INTEGER NOT NULL CHECK (valid IN (0, 1)),
  findings_json TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_type TEXT NOT NULL,
  decision TEXT NOT NULL,
  report_json TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS preview_artifacts (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  artifact_path TEXT NOT NULL,
  build_report_json TEXT NOT NULL,
  security_report_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id_hash TEXT,
  effect_id TEXT,
  submission_id TEXT,
  token_id TEXT,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_audit_events_rate
  ON audit_events(event_type, actor_id_hash, created_at);
