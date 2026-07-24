# Community Improvement Architecture

The system has three trust zones:

1. The Arsenal renders trusted catalog effects and creates manifests.
2. The community API validates packages, stores hashed tokens and records review data. It never imports submitted modules.
3. The local compiler transforms an approved package in a temporary filesystem. Browser execution is served from a separate loopback origin in an iframe with `sandbox="allow-scripts"`.

The local system uses SQLite behind `CommunityStore`. Production is fail-closed: all feature flags default off and the API guard returns `FEATURE_DISABLED`. `PostgresCommunityStoreAdapter` is the provider injection seam; no provider or secret is activated.

No phase creates a branch, commit, push, PR, merge or deployment.
