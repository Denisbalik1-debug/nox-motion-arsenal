# Phase 2: Token Submissions

A token is scoped to effect ID, base version and manifest hash. Cleartext is returned once; SQLite stores SHA-256 only. TTL is 60 minutes, maximum failed attempts is five and one successful package consumes the token.

Submission creation and token consumption share one `BEGIN IMMEDIATE` transaction. Unique `(token_id, idempotency_key)` and `(token_id, package_hash)` constraints make response-loss retries deterministic. Validation errors increment attempts; transport and server failures do not.

Local admin access requires loopback plus `x-nox-local-admin: 1`. Production admin and submission features are disabled by default.
