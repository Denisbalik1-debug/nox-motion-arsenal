import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { EffectManifest, ImprovementPackage } from '../../../src/motion-arsenal/community/types';
import type { PreviewArtifact } from '../types';

const ARTIFACT_ROOT = resolve(process.cwd(), '.community-data/preview-artifacts');
const COMPILER_ROOT = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));

function writeWithin(root: string, path: string, content: string) {
  const destination = resolve(root, path.replaceAll('/', sep));
  if (!destination.startsWith(`${resolve(root)}${sep}`)) throw new Error('SANDBOX_PATH_ESCAPE');
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content, 'utf8');
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else files.push(relative(root, path).replaceAll(sep, '/'));
    }
  };
  visit(root);
  return files.sort();
}

function applyPackage(sourceRoot: string, pkg: ImprovementPackage) {
  for (const file of pkg.files) {
    const destination = resolve(sourceRoot, file.path.replaceAll('/', sep));
    if (!destination.startsWith(`${resolve(sourceRoot)}${sep}`)) throw new Error('SANDBOX_PATH_ESCAPE');
    if (file.operation === 'delete') {
      if (existsSync(destination)) rmSync(destination);
      continue;
    }
    writeWithin(sourceRoot, file.path, file.content ?? '');
  }
}

function runCompiler(root: string, timeoutMs: number): Promise<{ files: string[]; warnings: string[] }> {
  const worker = resolve(COMPILER_ROOT, 'compilerWorker.mjs');
  const noNetwork = resolve(COMPILER_ROOT, 'noNetwork.mjs');
  const nodeModules = resolve(process.cwd(), 'node_modules');
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [
      '--permission',
      '--allow-child-process',
      '--allow-addons',
      `--allow-fs-read=${root}`,
      `--allow-fs-read=${COMPILER_ROOT}`,
      `--allow-fs-read=${nodeModules}`,
      `--allow-fs-write=${root}`,
      '--max-old-space-size=256',
      '--import',
      pathToFileURL(noNetwork).href,
      worker,
      root,
    ], {
      cwd: root,
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        TEMP: root,
        TMP: root,
        NODE_ENV: 'production',
        NOX_SANDBOX: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk).slice(0, 128_000); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk).slice(0, 128_000); });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('COMPILER_TIMEOUT'));
    }, timeoutMs);
    child.once('error', reject);
    child.once('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`COMPILER_FAILED: ${stderr || stdout}`));
      try {
        resolvePromise(JSON.parse(stdout) as { files: string[]; warnings: string[] });
      } catch {
        reject(new Error(`COMPILER_REPORT_INVALID: ${stdout}`));
      }
    });
  });
}

export async function compileStaticPreview(input: {
  submissionId: string;
  manifest: EffectManifest;
  sources: Record<string, string>;
  pkg: ImprovementPackage;
  previewOrigin: string;
  adminOrigin: string;
}): Promise<PreviewArtifact> {
  const started = Date.now();
  const sandboxRoot = mkdtempSync(join(realpathSync.native(tmpdir()), 'nox-community-compiler-'));
  try {
    const sourceRoot = join(sandboxRoot, 'source');
    mkdirSync(sourceRoot, { recursive: true });
    const trustedLibraryRoot = resolve(process.cwd(), 'src/motion-arsenal/lib');
    cpSync(trustedLibraryRoot, join(sourceRoot, 'src/motion-arsenal/lib'), { recursive: true });
    for (const [path, content] of Object.entries(input.sources)) writeWithin(sourceRoot, path, content);
    applyPackage(sourceRoot, input.pkg);
    const entryImport = `./source/${input.manifest.entryFile.replace(/\.(?:tsx?|jsx?)$/, '')}`;
    const defaults = Object.fromEntries(input.manifest.controls.map((control) => [control.key, control.defaultValue]));
    writeWithin(sandboxRoot, 'index.html', '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/preview-entry.tsx"></script></body></html>');
    writeWithin(sandboxRoot, 'preview-entry.tsx', `
      import React, { useEffect, useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import './preview.css';
      import Effect from ${JSON.stringify(entryImport)};
      const initial = ${JSON.stringify(defaults)};
      const allowedParentOrigin = ${JSON.stringify(input.adminOrigin)};
      function Preview() {
        const [props, setProps] = useState(initial);
        const [paused, setPaused] = useState(false);
        useEffect(() => {
          const receive = (event) => {
            if (event.source !== window.parent || event.origin !== allowedParentOrigin || !event.data || event.data.channel !== 'nox-preview-v1') return;
            if (event.data.type === 'set-props' && event.data.payload && typeof event.data.payload === 'object') setProps(event.data.payload);
            if (event.data.type === 'reset') setProps(initial);
            if (event.data.type === 'pause') setPaused(Boolean(event.data.payload));
          };
          addEventListener('message', receive);
          parent.postMessage({ channel: 'nox-preview-v1', type: 'ready' }, allowedParentOrigin);
          return () => removeEventListener('message', receive);
        }, []);
        return <main data-paused={paused}><Effect {...props} /></main>;
      }
      createRoot(document.getElementById('root')).render(<Preview />);
    `);
    writeWithin(sandboxRoot, 'preview.css', 'html,body,#root,main{width:100%;height:100%;margin:0;overflow:hidden;background:#070909;color:#edf3f0}main[data-paused="true"] *{animation-play-state:paused!important}');
    symlinkSync(resolve(process.cwd(), 'node_modules'), join(sandboxRoot, 'node_modules'), 'junction');
    const report = await runCompiler(sandboxRoot, 20_000);
    const dist = join(sandboxRoot, 'dist');
    const contentHash = createHash('sha256')
      .update(listFiles(dist).map((file) => `${file}:${createHash('sha256').update(readFileSync(join(dist, file))).digest('hex')}`).join('\n'))
      .digest('hex');
    const artifactId = randomUUID();
    const artifactPath = join(ARTIFACT_ROOT, artifactId);
    mkdirSync(ARTIFACT_ROOT, { recursive: true });
    cpSync(dist, artifactPath, { recursive: true, errorOnExist: true });
    const createdAt = new Date().toISOString();
    return {
      id: artifactId,
      submissionId: input.submissionId,
      contentHash,
      artifactPath,
      previewUrl: `${input.previewOrigin}/artifacts/${artifactId}/`,
      buildReport: {
        ok: true,
        durationMs: Date.now() - started,
        files: report.files,
        warnings: report.warnings,
      },
      securityReport: {
        compilerIsolation: [
          'Fresh temporary filesystem per job',
          'Node permission model restricts filesystem reads and writes',
          'Sanitized environment without repository or production secrets',
          'Network APIs disabled in the compiler process',
          '256 MiB V8 heap and 20 second wall-time limit',
          'Submitted modules are transformed, never imported by the compiler',
        ],
        limitations: [
          'Local adapter is not a kernel container; production requires a separately approved sandbox provider.',
          'Browser execution occurs only on the separate preview origin inside sandbox="allow-scripts".',
        ],
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      createdAt,
    };
  } finally {
    rmSync(sandboxRoot, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}
