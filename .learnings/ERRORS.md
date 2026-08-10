## [ERR-20260810-SHELL] powershell_read

**Logged**: 2026-08-10T00:00:00+02:00
**Priority**: low
**Status**: pending
**Area**: infra

### Summary
PowerShell file reads intermittently terminated with exit code -1073741502.

### Error
`Script error: Exit code -1073741502`

### Context
- Attempted read-only `Get-Content` calls in the repository.

### Suggested Fix
Retry the command or use another available read path.

### Metadata
- Reproducible: unknown
- Related Files: none

---
