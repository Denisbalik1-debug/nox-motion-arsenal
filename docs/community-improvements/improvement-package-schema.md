# Improvement Package Schema

The authoritative runtime schema is `src/motion-arsenal/community/schemas/improvementPackageSchema.ts`. It exports both the strict Zod schema and draft-2020-12 JSON Schema.

Important invariants:

- `schemaVersion` is `1.0`.
- `target` must match effect ID, base version and manifest SHA-256.
- paths are canonical project-relative paths;
- replace/delete is limited to `ownedFiles`;
- create is limited to the effect-specific child directory;
- file content and previous source hashes must match;
- dependencies use exact SemVer and always require human review;
- UTF-8 byte limits are enforced centrally from `submissionLimits.ts`.
