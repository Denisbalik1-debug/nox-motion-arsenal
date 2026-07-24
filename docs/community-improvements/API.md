# Community API

Local endpoints:

- `POST /api/community/tokens/create`
- `POST /api/community/tokens/revoke`
- `POST /api/community/submissions`
- `GET /api/community/admin/submissions`
- `POST /api/community/admin/submissions/:id/status`
- `POST /api/community/admin/submissions/:id/review`
- `POST /api/community/admin/submissions/:id/compile`

Submission authentication is `Authorization: Bearer <token>` and supports `Idempotency-Key`. Admin endpoints require loopback and `x-nox-local-admin: 1`.

Expected response classes are 201 stored, 400 validation, 401 missing/invalid token, 409 scope/consumption/security conflict, 410 expired/revoked/blocked, 413 size, 429 rate limit and 5xx infrastructure failure.
