# Phase 3: Isolated Preview

Static review uses the TypeScript AST and explicit capability rules. Visual and motion scores remain neutral because code inspection cannot prove visual quality; human approval is always required.

The local compiler:

- creates a fresh temporary filesystem;
- copies only manifest-owned sources and the validated package;
- starts a short-lived process with a 256 MiB V8 heap and 20-second deadline;
- uses the Node permission model for read/write boundaries;
- supplies a minimal environment without application or production secrets;
- disables Node network entry points;
- installs no package and uses the existing exact lockfile dependencies;
- hashes and copies only static `dist` output.

Vite/Rollup requires a trusted native addon and its child build process, so the local adapter is not equivalent to a kernel container. Production requires a separately approved sandbox provider. The compiled browser code runs only on a separate loopback port with restrictive CSP and `sandbox="allow-scripts"` without `allow-same-origin`.
