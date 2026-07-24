# Operations

Local setup:

```text
npm install
npm run dev
npm run lint
npm test
npm run test:community:e2e
```

SQLite lives under `.community-data/community.sqlite` and is ignored by Git. `COMMUNITY_SQLITE_PATH` can isolate test data. Preview artifacts expire logically after 24 hours and live under `.community-data/preview-artifacts`; remove them only while the local server is stopped.

Rollback is file-level because no production activation exists: turn all community flags off and revert the eventual single integration commit. Do not reuse development tokens or databases in production.
