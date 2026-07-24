# Rollout Checklist

- All baseline and community tests green.
- Verify 76 stable manifests and forbidden-path fixtures.
- Review CSP against every existing effect, including required `gstatic` asset access.
- Select and approve a production Postgres provider.
- Select and approve a kernel-isolated compiler provider.
- Run production migrations in a non-production environment first.
- Configure secrets only in the approved runtime.
- Enable flags one phase at a time.
- Verify auth before enabling admin.
- Verify separate preview origin and CSP.
- Obtain explicit GO before branch, commit, push, PR, merge, deploy or production activation.
