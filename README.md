# NOX Motion Arsenal

Source-viewable gallery and implementation library for 76 reusable UI and motion effects. Each effect has a stable ID, searchable metadata, adjustable controls, responsive preview and reduced-motion behavior.

## Local development

Requires Node.js `22.20.0`.

```bash
npm ci
npm run dev
```

The local gallery is available at `http://localhost:5195`.

## Verification

```bash
npm audit --audit-level=high
npm run lint
npm run build
npm test
npm run test:community:e2e
npm run test:favorites
npm run test:previews:smoke
npm run test:previews
```

The browser suites require a real Chrome installation and a running local Vite server. `test:previews` visits every registered effect and checks rendering, controls, navigation, resize behavior and browser-console errors. Generated reports, logs and test artifacts are ignored by Git.

## Repository map

- `src/motion-arsenal/effects/` — effect implementations and catalog metadata
- `src/motion-arsenal/components/` — gallery, filters, favorites, detail and controls
- `src/motion-arsenal/community/` — manifest, manual improvement-package and validation UI
- `server/community/` — local-only review/compiler implementation
- `docs/community-improvements/` — phased community architecture and security boundaries
- `docs/PROVENANCE.md` — publication and rights classification
- `THIRD_PARTY_NOTICES.md` — dependency and tool attribution

## Security boundary

The public baseline does not deploy a database, enable production community flags or execute submitted third-party code on a public service. Production API routes fail closed. The compiler path exists for isolated local development and CI verification only. See `docs/community-improvements/security-model.md`.

## Contribution and reuse

This repository is public for review and contribution, but it is not distributed under an OSI-approved open-source license. See `LICENSE` before reusing or redistributing code. Dependency licenses remain unaffected.
