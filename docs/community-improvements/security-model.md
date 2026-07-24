# Security Model

Forbidden input includes traversal, absolute/core/deployment/API/admin/auth paths, secrets, lockfiles, binary payloads, oversized data URLs and unknown file types. Static policy rejects network APIs, browser storage, cookies, service workers, parent/opener access, raw HTML injection, environment access, privileged Node modules, remote scripts and suspicious encoded blocks.

Tokens and IP identifiers are hashed. Normal logs never contain tokens or submitted source. APIs use same-origin checks, streaming request limits and no wildcard CORS.

Preview CSP:

`default-src 'none'; script-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`

Residual risk: the local compiler is process-isolated, not container-isolated. Never activate it on a public production host without an approved sandbox.
