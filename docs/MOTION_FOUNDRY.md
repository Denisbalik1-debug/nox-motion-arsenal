# NOX Motion Foundry v1

NOX Motion Foundry turns several Motion Arsenal effect requests into one mechanical batch workflow. The operator provides effect links and desired variants. ChatGPT or another coding worker changes the effect source. Hermes performs discovery, verification, reuse and the final production deployment without spending model tokens on build or deployment work.

## Operating model

```text
Effect links and requirements
        ↓
One working branch for the complete batch
        ↓
ChatGPT / workers modify effect components
        ↓
Hermes runs one plan and one verification pass
        ↓
One protected-branch PR and squash merge
        ↓
Hermes pulls clean main and deploys directly to production
```

There is no preview stage in v1. Production publication is explicitly guarded and can only target the existing `nox-motion-arsenal` Vercel project.

## Fixed production target

The authoritative target is stored in `.nox/motion-foundry.json`:

- repository: `Finitolombardo/nox-motion-arsenal`
- production branch: `main`
- Vercel project: `nox-motion-arsenal`
- production domain: `https://nox-motion-arsenal.vercel.app`
- preview creation: disabled by default

The publish command checks `.vercel/project.json` before deploying. It refuses to continue if the linked team or project ID differs. This prevents agents from silently creating another Vercel project.

## Batch input

Create one JSON file under `batches/`:

```json
{
  "schemaVersion": "1.0",
  "id": "motion-batch-001",
  "publish": {
    "mode": "production",
    "skipPreview": true
  },
  "effects": [
    {
      "url": "https://nox-motion-arsenal.vercel.app/#/effect/nox-spinimage",
      "intent": "Three reusable premium variants",
      "variants": ["premium", "cinematic", "overdrive"],
      "brandKits": ["nox-labs"],
      "constraints": ["Keep existing props"],
      "dependencies": []
    }
  ]
}
```

`id` can be supplied instead of `url`. When automatic component discovery cannot resolve an implementation, add an explicit `files` array to that effect entry. Optional `assets` are copied by the customer-project installer.

## Commands

### Inspect and plan a batch

```bash
npm run foundry:plan -- batches/motion-batch-001.json
```

The scanner extracts effect IDs from links, searches catalog entries, resolves imported implementation files and writes:

```text
reports/motion-foundry/<batch-id>/plan.json
reports/motion-foundry/<batch-id>/plan.md
```

### Verify once

```bash
npm run foundry:verify -- batches/motion-batch-001.json
```

This runs the configured verification commands once for the complete batch:

```text
npm ci
npm run lint
npm test
npm run build
```

For an already-installed Hermes checkout:

```bash
npm run foundry:verify -- batches/motion-batch-001.json --fast
```

### Direct production deployment

After the protected batch PR is merged, Hermes pulls a clean `main` checkout and runs:

```bash
NOX_MOTION_FOUNDRY_PROD_GO=GO npm run foundry:prod -- batches/motion-batch-001.json
```

The command refuses deployment unless all of these are true:

1. explicit production environment gate is present;
2. git working tree is clean;
3. current branch is `main`;
4. `.vercel/project.json` points to the configured existing project;
5. verification passes, unless `--skip-verify` is intentionally supplied;
6. the production domain responds successfully after deployment.

No preview deployment is generated.

## Reusing effects in NOX and customer websites

Use the installer against another local project:

```bash
npm run foundry:install -- batches/motion-batch-001.json \
  --target /srv/projects/customer-site \
  --effect nox-spinimage \
  --dry-run
```

After reviewing the dry run:

```bash
npm run foundry:install -- batches/motion-batch-001.json \
  --target /srv/projects/customer-site \
  --effect nox-spinimage
```

The installer:

- copies the resolved implementation and its local transitive imports;
- copies optional assets;
- includes the central brand-kit registry when requested;
- preserves repository-relative paths;
- refuses to overwrite a different target file unless `--force` is supplied;
- records an installation receipt under `.nox/motion-installs/`;
- reports npm packages that the target project still needs.

Page placement remains project-specific. Hermes should read the receipt, import the component into the intended section, apply the requested variant and brand kit, then build and deploy that customer project.

## Brand kits

Brand kits live under:

```text
src/motion-arsenal/brand-kits/
```

A kit centralizes brand colors, logo reference, motion intensity, glow strength, energy level and default logo placement. Effects should gradually accept either a brand-kit ID or a complete `MotionBrandKit` object rather than embedding customer colors or duplicating components.

Initial kit:

```text
nox-labs
```

Future kits can represent a customer or vertical, for example `solar-premium`, `restaurant-luxury`, `industrial-tech` or `medical-clean`.

## Hermes role

Hermes should perform the mechanical work:

1. pull the repository;
2. create or reuse one batch branch;
3. run `foundry:plan`;
4. execute worker instructions and collect patches;
5. run `foundry:verify` once;
6. open one protected-branch PR;
7. merge after green CI and Operator-GO;
8. pull clean `main`;
9. run `foundry:prod`;
10. return the production link and receipt.

Codex or Claude are optional code workers, not required for building, testing, copying or deploying.

## One-time Hermes setup

On the Hermes server checkout, link the existing project once:

```bash
vercel link --project nox-motion-arsenal --scope alexander-lapizkys-projects
```

Confirm `.vercel/project.json` contains the IDs from `.nox/motion-foundry.json`. Do not run `vercel deploy` before this check succeeds.
