import effectSources from 'virtual:effect-sources';
import packageVersions from 'virtual:effect-packages';
import type { EffectEntry } from '../../types';
import { DEFAULT_SUBMISSION_LIMITS, FORBIDDEN_APIS } from '../config/submissionLimits';
import { sha256Sync, stableStringify } from '../lib/hash';
import type { EffectManifest, EffectRuntime } from '../types';
import { propControlToDefinition } from '../types';
import { EFFECT_MANIFEST_OVERRIDES } from './overrides';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css', '.json', '.glsl', '.vert', '.frag'];
const IMPORT_PATTERN = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;

function normalizePath(path: string): string {
  const output: string[] = [];
  for (const segment of path.replaceAll('\\', '/').split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') output.pop();
    else output.push(segment);
  }
  return output.join('/');
}

function entryFileFor(importPath: string): string {
  const base = importPath.startsWith('@/') ? `src/${importPath.slice(2)}` : importPath;
  if (effectSources[base]) return base;
  return SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`).find((candidate) => effectSources[candidate]) ?? base;
}

function sourceDirectory(path: string): string {
  return path.slice(0, Math.max(0, path.lastIndexOf('/')));
}

function resolveOwnedImport(fromFile: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const base = normalizePath(`${sourceDirectory(fromFile)}/${specifier}`);
  if (effectSources[base]) return base;
  for (const extension of SOURCE_EXTENSIONS) {
    if (effectSources[`${base}${extension}`]) return `${base}${extension}`;
    if (effectSources[`${base}/index${extension}`]) return `${base}/index${extension}`;
  }
  return undefined;
}

function ownedFilesFor(entryFile: string): string[] {
  const root = sourceDirectory(entryFile);
  const queue = [entryFile];
  const owned = new Set<string>();
  while (queue.length && owned.size < DEFAULT_SUBMISSION_LIMITS.maxFiles) {
    const current = queue.shift()!;
    if (owned.has(current) || !current.startsWith(root) || !effectSources[current]) continue;
    owned.add(current);
    const source = effectSources[current];
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const resolved = resolveOwnedImport(current, match[1]);
      if (resolved && !owned.has(resolved)) queue.push(resolved);
    }
  }
  return [...owned].sort();
}

function runtimeFor(files: string[]): EffectRuntime {
  const source = files.map((path) => effectSources[path] ?? '').join('\n');
  if (/\bTHREE\b|from\s+['"]three|WebGL(RenderingContext|2RenderingContext)/.test(source)) return 'webgl';
  if (/getContext\(\s*['"]2d['"]\s*\)|CanvasRenderingContext2D/.test(source)) return 'canvas2d';
  if (/<svg\b|createElementNS\([^)]*svg/.test(source)) return 'svg';
  if (files.every((path) => path.endsWith('.css'))) return 'css';
  return 'react-dom';
}

function bareImports(files: string[]): string[] {
  const imports = new Set<string>(['react', 'react/jsx-runtime']);
  for (const path of files) {
    for (const match of (effectSources[path] ?? '').matchAll(IMPORT_PATTERN)) {
      const specifier = match[1];
      if (!specifier.startsWith('.') && !specifier.startsWith('@/')) imports.add(specifier);
    }
  }
  return [...imports].sort();
}

function packageName(specifier: string): string {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

export function buildEffectManifest(entry: EffectEntry): EffectManifest {
  const entryFile = entryFileFor(entry.meta.importPath);
  const inferredOwnedFiles = ownedFilesFor(entryFile);
  const override = EFFECT_MANIFEST_OVERRIDES[entry.meta.id];
  const ownedFiles = override?.ownedFiles ?? inferredOwnedFiles;
  const imports = bareImports(ownedFiles);
  const dependencyNames = new Set([
    ...entry.meta.dependencies.map((dependency) => packageName(dependency.toLowerCase())),
    ...imports.map(packageName),
  ]);
  const dependencies = Object.fromEntries(
    [...dependencyNames]
      .filter((name) => packageVersions[name])
      .sort()
      .map((name) => [name, packageVersions[name]]),
  );
  const sourceHash = sha256Sync(ownedFiles.map((path) => `${path}\n${effectSources[path] ?? ''}`).join('\n'));
  const withoutHash: Omit<EffectManifest, 'manifestHash'> = {
    schemaVersion: '1.0',
    id: entry.meta.id,
    slug: entry.meta.id,
    displayName: entry.meta.displayName ?? entry.meta.name,
    category: entry.meta.category,
    version: `1.0.0+${sourceHash.slice(0, 12)}`,
    updatedAt: entry.meta.updatedAt ?? new Date(0).toISOString(),
    runtime: override?.runtime ?? runtimeFor(ownedFiles),
    entryFile,
    ownedFiles,
    dependencies: override?.dependencies ?? dependencies,
    controls: entry.meta.props.map(propControlToDefinition),
    constraints: override?.constraints ?? {
      allowedImports: imports,
      forbiddenApis: [...FORBIDDEN_APIS],
      maxFiles: DEFAULT_SUBMISSION_LIMITS.maxFiles,
      maxTotalBytes: DEFAULT_SUBMISSION_LIMITS.maxTotalSourceBytes,
      reducedMotionRequired: true,
      responsiveRequired: true,
    },
    verification: override?.verification ?? {
      viewports: ['390x844', '768x1024', '1440x900'],
      smokeTest: `effect-smoke:${entry.meta.id}`,
      expectedInteractions: entry.meta.props.length ? ['controls update the trusted preview'] : ['preview mounts without errors'],
    },
  };
  return {
    ...withoutHash,
    manifestHash: `sha256:${sha256Sync(stableStringify(withoutHash))}`,
  };
}

export function buildEffectManifests(catalog: EffectEntry[]): EffectManifest[] {
  return catalog.map(buildEffectManifest);
}

export function getOwnedSourceFiles(manifest: EffectManifest): Record<string, string> {
  return Object.fromEntries(manifest.ownedFiles.map((path) => [path, effectSources[path] ?? '']));
}
