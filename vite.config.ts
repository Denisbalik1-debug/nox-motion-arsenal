import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { communityApiPlugin } from './server/community/vitePlugin';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const effectsRoot = resolve(projectRoot, 'src/motion-arsenal/effects');
const virtualEffectUpdatesId = 'virtual:effect-updates';
const resolvedVirtualEffectUpdatesId = `\0${virtualEffectUpdatesId}`;
const virtualEffectSourcesId = 'virtual:effect-sources';
const resolvedVirtualEffectSourcesId = `\0${virtualEffectSourcesId}`;
const virtualEffectPackagesId = 'virtual:effect-packages';
const resolvedVirtualEffectPackagesId = `\0${virtualEffectPackagesId}`;
const virtualCommunityFlagsId = 'virtual:community-flags';
const resolvedVirtualCommunityFlagsId = `\0${virtualCommunityFlagsId}`;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.json', '.glsl', '.vert', '.frag']);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return SOURCE_EXTENSIONS.has(extname(entry.name)) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });
}

function sourceUpdatedAt(path: string): string {
  try {
    const committedAt = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', path],
      { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    if (committedAt) return committedAt;
  } catch {
    // The Arsenal currently lives in an untracked parent checkout. File mtime
    // keeps the maintenance signal useful until it has its own Git history.
  }
  return statSync(path).mtime.toISOString();
}

function sourceKey(path: string): string {
  return relative(projectRoot, path).split(sep).join('/');
}

function effectCommunityManifestPlugin(localDevelopment: boolean): Plugin {
  return {
    name: 'nox-effect-community-manifest',
    resolveId(id) {
      if (id === virtualEffectUpdatesId) return resolvedVirtualEffectUpdatesId;
      if (id === virtualEffectSourcesId) return resolvedVirtualEffectSourcesId;
      if (id === virtualEffectPackagesId) return resolvedVirtualEffectPackagesId;
      if (id === virtualCommunityFlagsId) return resolvedVirtualCommunityFlagsId;
      return undefined;
    },
    load(id) {
      if (id === resolvedVirtualEffectUpdatesId) {
        const manifest = Object.fromEntries(
          sourceFiles(effectsRoot)
            .filter((path) => ['.ts', '.tsx'].includes(extname(path)))
            .map((path) => {
              const withoutExtension = relative(resolve(projectRoot, 'src'), path)
                .slice(0, -extname(path).length)
                .split(sep)
                .join('/');
              return [`@/${withoutExtension}`, sourceUpdatedAt(path)];
            }),
        );
        return `export default ${JSON.stringify(manifest)};`;
      }
      if (id === resolvedVirtualEffectSourcesId) {
        const sources = Object.fromEntries(
          sourceFiles(effectsRoot).map((path) => [sourceKey(path), readFileSync(path, 'utf8')]),
        );
        return `export default ${JSON.stringify(sources)};`;
      }
      if (id === resolvedVirtualEffectPackagesId) {
        const lock = JSON.parse(readFileSync(resolve(projectRoot, 'package-lock.json'), 'utf8')) as {
          packages?: Record<string, { version?: string }>;
        };
        const versions = Object.fromEntries(
          Object.entries(lock.packages ?? {})
            .filter(([key, value]) => key.startsWith('node_modules/') && value.version)
            .map(([key, value]) => [key.slice('node_modules/'.length), value.version]),
        );
        return `export default ${JSON.stringify(versions)};`;
      }
      if (id === resolvedVirtualCommunityFlagsId) {
        const names = [
          'COMMUNITY_MANUAL_SUBMISSIONS_ENABLED',
          'COMMUNITY_TOKEN_SUBMISSIONS_ENABLED',
          'COMMUNITY_ADMIN_ENABLED',
          'COMMUNITY_AGENT_REVIEW_ENABLED',
          'COMMUNITY_ISOLATED_PREVIEW_ENABLED',
          'COMMUNITY_PR_PREPARATION_ENABLED',
        ];
        const flags = Object.fromEntries(
          names.map((name) => [name, localDevelopment || process.env[name] === 'true']),
        );
        return `export default ${JSON.stringify(flags)};`;
      }
      return undefined;
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [effectCommunityManifestPlugin(command === 'serve'), communityApiPlugin(), react()],
  base: '/',
  server: { port: 5195 },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
}));
