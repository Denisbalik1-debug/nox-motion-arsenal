# Phase 1: Manual MVP

Each of the 76 public catalog entries produces a stable, SHA-256-addressed `EffectManifest`. The prompt contains only `ownedFiles`, exact installed dependency versions, controls, limits and the JSON contract.

`#/community/submit/<effect-id>` accepts pasted JSON or a JSON file. Zod, byte limits, path ownership, hashes, dependency policy and static heuristics run locally. Diffs are rendered as text. The side-by-side preview renders only the existing trusted effect with validated changes to existing controls; submitted source is never evaluated.

Entry points:

- `community/manifests/buildManifest.ts`
- `community/prompt/buildImprovementPrompt.ts`
- `community/validation/validatePackage.ts`
- `community/components/CommunitySubmissionPage.tsx`
