# Publication provenance

This file records the rights review performed for the standalone public baseline. It is a publication-scope classification, not a claim about third-party trademarks or the independent licenses of npm dependencies.

## Classification

- **A — original:** NOX-authored application shell, controls, manifests, community-package validation, utility code and effect implementations not listed below.
- **B — adapted or inspired:** NOX-authored implementations based on general, publicly observable interaction or motion principles. No third-party source files or assets are included.
- **C — compatible license:** third-party tooling or code covered by a publication-compatible license and documented in `THIRD_PARTY_NOTICES.md`.
- **D — unclear:** provenance or redistribution rights are not clear enough for this public baseline.
- **E — unpublishable:** material known not to be publishable in this repository.

## Included

- The remaining Canvas UI catalog is classified **B**: seven independent NOX implementations of general interaction mechanics. The direct solver/engine ports were removed.
- The premium effects and their shared motion utilities are classified **B**: NOX implementations informed by general motion-design principles; private captures and forensic notes are not included.
- `src/motion-arsenal/effects/img2threejs/` is classified **B/C**: the procedural output was generated with the Apache-2.0 `hoainho/img2threejs` tool, then reviewed and adapted. No source image, blockout or tool source is included.
- All other effect families are classified **A**, except where their catalog metadata explicitly describes a general design influence.

## Excluded from the public baseline

The following **D** material was excluded conservatively:

- the complete OriginKit effect set and tracking metadata;
- the complete reference-lab reproduction set;
- the Canvas UI `Liquid` direct solver port;
- the Canvas UI `ParticleObject3D` direct engine port;
- private forensic dossiers and local reference captures;
- img2threejs source images, reconstruction blockouts and local specifications;
- the PixelCard test tied to the excluded OriginKit implementation;
- a cross-project glyph/placement document containing private local context.

No **E** material is knowingly included. If a contributor cannot establish publication rights for a new asset or implementation, it must not be added.
