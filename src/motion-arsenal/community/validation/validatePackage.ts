import type { ZodIssue } from 'zod';
import type { EffectManifest, ImprovementPackage, PackageValidationResult, ValidationFinding } from '../types';
import {
  ALLOWED_FILE_EXTENSIONS,
  DEFAULT_SUBMISSION_LIMITS,
  FORBIDDEN_PACKAGE_PATHS,
  type SubmissionLimits,
} from '../config/submissionLimits';
import { sha256 } from '../lib/hash';
import { improvementPackageSchema } from '../schemas/improvementPackageSchema';

const textEncoder = new TextEncoder();
const EXACT_VERSION = /^(?:\d+\.){2}\d+(?:-[0-9A-Za-z.-]+)?$/;
const BASE64_BLOCK = /(?:base64,|['"`])(?:[A-Za-z0-9+/]{1200,}={0,2})/;
const DATA_URL = /data:[^,]{0,200},.{4096,}/s;
const SECURITY_PATTERNS: Array<{ code: string; pattern: RegExp; message: string }> = [
  { code: 'FORBIDDEN_EVAL', pattern: /\beval\s*\(/, message: 'eval ist nicht erlaubt.' },
  { code: 'FORBIDDEN_FUNCTION', pattern: /\bnew\s+Function\s*\(/, message: 'new Function ist nicht erlaubt.' },
  { code: 'REMOTE_IMPORT', pattern: /\bimport\s*\(\s*['"]https?:\/\//, message: 'Dynamische Remote-Imports sind nicht erlaubt.' },
  { code: 'NETWORK_API', pattern: /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/, message: 'Netzwerk-APIs sind nicht erlaubt.' },
  { code: 'BEACON_API', pattern: /\b(sendBeacon|navigator\.sendBeacon)\b/, message: 'Beacon-Aufrufe sind nicht erlaubt.' },
  { code: 'BROWSER_STORAGE', pattern: /\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/, message: 'Browser-Storage und Cookies sind nicht erlaubt.' },
  { code: 'SERVICE_WORKER', pattern: /\bserviceWorker\b/, message: 'Service Worker sind nicht erlaubt.' },
  { code: 'PARENT_ACCESS', pattern: /\bwindow\.(parent|top|opener)\b/, message: 'Zugriff auf Parent-, Top- oder Opener-Fenster ist nicht erlaubt.' },
  { code: 'NODE_PRIVILEGED', pattern: /\b(child_process|node:fs|node:net|node:http|process\.env)\b/, message: 'Privilegierte Node-APIs sind nicht erlaubt.' },
];

function bytes(value: string): number {
  return textEncoder.encode(value).byteLength;
}

function reportBytes(pkg: ImprovementPackage): number {
  return bytes(JSON.stringify({
    proposal: pkg.proposal,
    verification: pkg.verification,
    provenance: pkg.provenance,
  }));
}

function zodFinding(issue: ZodIssue): ValidationFinding {
  return {
    code: 'SCHEMA_INVALID',
    message: issue.message,
    path: issue.path.map(String).join('.'),
    severity: 'error',
  };
}

function inspectStructure(value: unknown): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const queue: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  let nodes = 0;
  while (queue.length) {
    const current = queue.pop()!;
    nodes += 1;
    if (nodes > 20_000) {
      findings.push({ code: 'TOO_MANY_NODES', message: 'Das JSON enthält zu viele Strukturelemente.', severity: 'error' });
      break;
    }
    if (current.depth > 40) {
      findings.push({ code: 'TOO_DEEP', message: 'Das JSON ist tiefer als 40 Ebenen.', severity: 'error' });
      break;
    }
    if (current.value && typeof current.value === 'object') {
      for (const child of Object.values(current.value as Record<string, unknown>)) {
        queue.push({ value: child, depth: current.depth + 1 });
      }
    }
  }
  return findings;
}

function normalizedPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function pathFindings(pkg: ImprovementPackage, manifest: EffectManifest): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const owned = new Set(manifest.ownedFiles);
  const entryDirectory = manifest.entryFile.slice(0, manifest.entryFile.lastIndexOf('/'));
  const createRoot = `${entryDirectory}/${manifest.id}/`;

  for (const [index, file] of pkg.files.entries()) {
    const path = normalizedPath(file.path);
    const fieldPath = `files.${index}.path`;
    if (path !== file.path) {
      findings.push({ code: 'PATH_NOT_CANONICAL', message: 'Pfade müssen / verwenden und dürfen kein ./ Präfix haben.', path: fieldPath, severity: 'error' });
    }
    if (/^(?:[A-Za-z]:|\/|\\\\)/.test(file.path)) {
      findings.push({ code: 'ABSOLUTE_PATH', message: 'Absolute Pfade sind nicht erlaubt.', path: fieldPath, severity: 'error' });
    }
    if (path.split('/').includes('..')) {
      findings.push({ code: 'PATH_TRAVERSAL', message: '../-Pfadsegmente sind nicht erlaubt.', path: fieldPath, severity: 'error' });
    }
    if (FORBIDDEN_PACKAGE_PATHS.some((forbidden) => path === forbidden || path.startsWith(forbidden))) {
      findings.push({ code: 'CORE_PATH', message: 'Diese Core-, API- oder Deployment-Datei darf nicht geändert werden.', path: fieldPath, severity: 'error' });
    }
    const extension = ALLOWED_FILE_EXTENSIONS.find((allowed) => path.endsWith(allowed));
    if (!extension) {
      findings.push({ code: 'FILE_TYPE', message: 'Der Dateityp ist nicht erlaubt.', path: fieldPath, severity: 'error' });
    }
    if (file.operation === 'create') {
      if (!path.startsWith(createRoot)) {
        findings.push({
          code: 'CREATE_OUTSIDE_EFFECT',
          message: `Neue Dateien müssen unter ${createRoot} liegen.`,
          path: fieldPath,
          severity: 'error',
        });
      }
    } else if (!owned.has(path)) {
      findings.push({ code: 'NOT_OWNED', message: 'Nur im Manifest deklarierte ownedFiles dürfen ersetzt oder gelöscht werden.', path: fieldPath, severity: 'error' });
    }
    if (/\/(?:\.env(?:\.|$)|package-lock\.json$|pnpm-lock\.yaml$|yarn\.lock$)/i.test(`/${path}`)) {
      findings.push({ code: 'SECRET_OR_LOCKFILE', message: '.env-Dateien und Lockfiles sind nicht erlaubt.', path: fieldPath, severity: 'error' });
    }
    if (['.glsl', '.vert', '.frag'].includes(extension ?? '')) {
      const manifestUsesShaders = manifest.ownedFiles.some((ownedPath) => /\.(glsl|vert|frag)$/.test(ownedPath))
        || manifest.runtime === 'webgl';
      if (!manifestUsesShaders) {
        findings.push({ code: 'SHADER_NOT_ALLOWED', message: 'Shader sind für diesen Effekt nicht im Manifest freigegeben.', path: fieldPath, severity: 'error' });
      }
    }
  }
  return findings;
}

async function contentFindings(
  pkg: ImprovementPackage,
  currentSources: Record<string, string>,
  limits: SubmissionLimits,
): Promise<ValidationFinding[]> {
  const findings: ValidationFinding[] = [];
  for (const [index, file] of pkg.files.entries()) {
    const path = `files.${index}`;
    const content = file.content ?? '';
    if (file.operation !== 'delete' && file.content === undefined) {
      findings.push({ code: 'CONTENT_REQUIRED', message: 'create und replace benötigen content.', path, severity: 'error' });
      continue;
    }
    if (bytes(content) > limits.maxSingleFileBytes) {
      findings.push({ code: 'FILE_TOO_LARGE', message: `Datei überschreitet ${limits.maxSingleFileBytes} UTF-8-Bytes.`, path, severity: 'error' });
    }
    if (BASE64_BLOCK.test(content) || DATA_URL.test(content)) {
      findings.push({ code: 'BINARY_PAYLOAD', message: 'Große Base64-Blöcke oder Data-URLs sind nicht erlaubt.', path, severity: 'error' });
    }
    for (const rule of SECURITY_PATTERNS) {
      if (rule.pattern.test(content)) findings.push({ code: rule.code, message: rule.message, path, severity: 'error' });
    }
    const actualHash = `sha256:${await sha256(content)}`;
    if (actualHash !== file.contentSha256) {
      findings.push({ code: 'CONTENT_HASH_MISMATCH', message: 'contentSha256 stimmt nicht mit dem Dateiinhalt überein.', path, severity: 'error' });
    }
    if (file.operation === 'replace') {
      const current = currentSources[normalizedPath(file.path)];
      if (current === undefined) continue;
      const previousHash = `sha256:${await sha256(current)}`;
      if (file.previousSha256 !== previousHash) {
        findings.push({ code: 'PREVIOUS_HASH_MISMATCH', message: 'previousSha256 stimmt nicht mit der aktuellen Basisdatei überein.', path, severity: 'error' });
      }
    }
  }
  return findings;
}

export async function validateImprovementPackage(
  rawText: string,
  manifest: EffectManifest,
  currentSources: Record<string, string>,
  limits: SubmissionLimits = { ...DEFAULT_SUBMISSION_LIMITS },
): Promise<PackageValidationResult> {
  const emptyMetrics = { packageBytes: bytes(rawText), sourceBytes: 0, reportBytes: 0, fileCount: 0, dependenciesAdded: 0 };
  const findings: ValidationFinding[] = [];

  if (emptyMetrics.packageBytes > limits.maxPackageJsonBytes) {
    findings.push({ code: 'PACKAGE_TOO_LARGE', message: `Package überschreitet ${limits.maxPackageJsonBytes} UTF-8-Bytes.`, severity: 'error' });
    return { ok: false, findings, metrics: emptyMetrics };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    return {
      ok: false,
      findings: [{ code: 'JSON_INVALID', message: error instanceof Error ? error.message : 'JSON ist nicht lesbar.', severity: 'error' }],
      metrics: emptyMetrics,
    };
  }

  findings.push(...inspectStructure(parsed));
  const schemaResult = improvementPackageSchema.safeParse(parsed);
  if (!schemaResult.success) {
    findings.push(...schemaResult.error.issues.map(zodFinding));
    return { ok: false, findings, metrics: emptyMetrics };
  }

  const pkg = schemaResult.data;
  const sourceBytes = pkg.files.reduce((total, file) => total + bytes(file.content ?? ''), 0);
  const metrics = {
    packageBytes: emptyMetrics.packageBytes,
    sourceBytes,
    reportBytes: reportBytes(pkg),
    fileCount: pkg.files.length,
    dependenciesAdded: Object.keys(pkg.dependencies.add).length,
  };

  if (pkg.target.effectId !== manifest.id) {
    findings.push({ code: 'EFFECT_ID_MISMATCH', message: 'Das Package gehört zu einem anderen Effekt.', path: 'target.effectId', severity: 'error' });
  }
  if (pkg.target.baseVersion !== manifest.version) {
    findings.push({ code: 'BASE_VERSION_MISMATCH', message: 'Die Basisversion des Effekts hat sich geändert.', path: 'target.baseVersion', severity: 'error' });
  }
  if (pkg.target.manifestHash !== manifest.manifestHash) {
    findings.push({ code: 'MANIFEST_HASH_MISMATCH', message: 'Der Manifest-Hash stimmt nicht mit dem aktuellen Effekt überein.', path: 'target.manifestHash', severity: 'error' });
  }
  if (sourceBytes > limits.maxTotalSourceBytes) {
    findings.push({ code: 'SOURCE_TOO_LARGE', message: `Sourcecode überschreitet ${limits.maxTotalSourceBytes} UTF-8-Bytes.`, severity: 'error' });
  }
  if (metrics.reportBytes > limits.maxReportBytes) {
    findings.push({ code: 'REPORT_TOO_LARGE', message: `Bericht überschreitet ${limits.maxReportBytes} UTF-8-Bytes.`, severity: 'error' });
  }
  if (metrics.dependenciesAdded > limits.maxDependenciesAdded) {
    findings.push({ code: 'TOO_MANY_DEPENDENCIES', message: `Mehr als ${limits.maxDependenciesAdded} neue Dependencies vorgeschlagen.`, severity: 'error' });
  }
  for (const [name, version] of Object.entries(pkg.dependencies.add)) {
    if (!EXACT_VERSION.test(version)) {
      findings.push({ code: 'DEPENDENCY_VERSION', message: `${name} benötigt eine exakte SemVer-Version.`, path: `dependencies.add.${name}`, severity: 'error' });
    } else {
      findings.push({
        code: 'DEPENDENCY_REVIEW_REQUIRED',
        message: `${name}@${version} wird gespeichert, aber nicht installiert oder in einer Preview ausgeführt.`,
        path: `dependencies.add.${name}`,
        severity: 'warning',
      });
    }
  }
  findings.push(...pathFindings(pkg, manifest));
  findings.push(...await contentFindings(pkg, currentSources, limits));

  return {
    ok: !findings.some((finding) => finding.severity === 'error'),
    package: pkg,
    findings,
    metrics,
  };
}
