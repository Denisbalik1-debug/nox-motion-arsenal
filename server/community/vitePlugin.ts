import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { createCommunityApp, type CommunityRequest } from './app';
import { SqliteCommunityStore } from './sqliteStore';
import type { ManifestRegistry } from './types';

async function readBody(request: IncomingMessage, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) throw new Error('REQUEST_TOO_LARGE');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function headersFrom(request: IncomingMessage): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(request.headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(', ') : value]),
  );
}

async function createRegistry(server: ViteDevServer): Promise<ManifestRegistry> {
  const catalogModule = await server.ssrLoadModule('/src/motion-arsenal/data/effectsCatalog.ts');
  const manifestModule = await server.ssrLoadModule('/src/motion-arsenal/community/manifests/buildManifest.ts');
  const catalog = catalogModule.EFFECTS_CATALOG;
  const registry: ManifestRegistry = new Map();
  for (const entry of catalog) {
    const manifest = manifestModule.buildEffectManifest(entry);
    registry.set(manifest.id, {
      manifest,
      sources: manifestModule.getOwnedSourceFiles(manifest),
    });
  }
  return registry;
}

function send(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  response.statusCode = status;
  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  response.end(JSON.stringify(body));
}

export function communityApiPlugin(): Plugin {
  return {
    name: 'nox-community-local-api',
    apply: 'serve',
    configureServer(server) {
      let store: SqliteCommunityStore | undefined;
      const artifactRoot = resolve(process.cwd(), '.community-data/preview-artifacts');
      const previewServer = createServer((request, response) => {
        const match = (request.url ?? '').split('?')[0].match(/^\/artifacts\/([0-9a-f-]+)\/(.*)$/i);
        response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'none'; font-src 'none'; frame-ancestors http://127.0.0.1:* http://localhost:*; base-uri 'none'; form-action 'none'; object-src 'none'");
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        response.setHeader('Access-Control-Allow-Origin', 'null');
        response.setHeader('Referrer-Policy', 'no-referrer');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        if (!match) {
          response.statusCode = 404;
          return response.end('Not found');
        }
        const artifactDirectory = resolve(artifactRoot, match[1]);
        const requested = resolve(artifactDirectory, match[2] || 'index.html');
        if (!requested.startsWith(`${artifactDirectory}${sep}`) || !existsSync(requested) || !statSync(requested).isFile()) {
          response.statusCode = 404;
          return response.end('Not found');
        }
        const types: Record<string, string> = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.webp': 'image/webp',
        };
        response.setHeader('Content-Type', types[extname(requested)] ?? 'application/octet-stream');
        createReadStream(requested).pipe(response);
      });
      const previewReady = new Promise<string>((resolveOrigin, reject) => {
        previewServer.once('error', reject);
        previewServer.listen(0, '127.0.0.1', () => {
          const address = previewServer.address();
          if (!address || typeof address === 'string') return reject(new Error('PREVIEW_SERVER_ADDRESS_INVALID'));
          resolveOrigin(`http://127.0.0.1:${address.port}`);
        });
      });
      server.httpServer?.once('close', () => {
        previewServer.close();
        store?.database.close();
      });
      let appPromise: ReturnType<typeof initializeApp> | undefined;
      const initializeApp = async () => {
        const registry = await createRegistry(server);
        store = new SqliteCommunityStore(process.env.COMMUNITY_SQLITE_PATH);
        return createCommunityApp({ store, registry, previewOrigin: await previewReady });
      };
      server.middlewares.use(async (request, response, next) => {
        const path = (request.url ?? '').split('?')[0];
        if (!path.startsWith('/api/community/')) return next();
        try {
          appPromise ??= initializeApp();
          const app = await appPromise;
          const body = await readBody(request, app.limits.maxRequestBytes);
          const communityRequest: CommunityRequest = {
            method: request.method ?? 'GET',
            path,
            headers: headersFrom(request),
            ip: request.socket.remoteAddress ?? '',
            body,
          };
          const result = await app.handle(communityRequest);
          send(response, result.status, result.body, result.headers);
        } catch (error) {
          if (error instanceof Error && error.message === 'REQUEST_TOO_LARGE') {
            send(response, 413, { code: 'REQUEST_TOO_LARGE' }, { 'X-Content-Type-Options': 'nosniff' });
            return;
          }
          console.error('[community] local API failed:', error);
          send(response, 500, { code: 'INTERNAL_ERROR' }, { 'X-Content-Type-Options': 'nosniff' });
        }
      });
    },
  };
}
