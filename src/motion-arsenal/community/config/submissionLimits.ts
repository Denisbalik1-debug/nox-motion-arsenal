export const DEFAULT_SUBMISSION_LIMITS = {
  tokenTtlMinutes: 60,
  maxTokenAttempts: 5,
  maxRequestBytes: 2 * 1024 * 1024,
  maxPackageJsonBytes: 2 * 1024 * 1024,
  maxTotalSourceBytes: 1536 * 1024,
  maxSingleFileBytes: 256 * 1024,
  maxFiles: 30,
  maxReportBytes: 256 * 1024,
  maxTitleLength: 160,
  maxSummaryLength: 10_000,
  maxPathLength: 240,
  maxDependenciesAdded: 5,
} as const;

export type SubmissionLimits = {
  -readonly [Key in keyof typeof DEFAULT_SUBMISSION_LIMITS]: number;
};

export const ALLOWED_FILE_EXTENSIONS = ['.ts', '.tsx', '.css', '.json', '.glsl', '.vert', '.frag'] as const;

export const FORBIDDEN_PACKAGE_PATHS = [
  'src/App.tsx',
  'src/main.tsx',
  'src/motion-arsenal/components/ArsenalShell.tsx',
  'src/motion-arsenal/components/EffectPreview.tsx',
  'src/motion-arsenal/data/effectsCatalog.ts',
  'src/motion-arsenal/types.ts',
  'src/styles/',
  'vite.config.ts',
  'package.json',
  'package-lock.json',
  '.github/',
  '.vercel/',
  'api/',
  'server/',
] as const;

export const FORBIDDEN_APIS = [
  'eval',
  'new Function',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'sendBeacon',
  'document.cookie',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'serviceWorker',
  'window.parent',
  'window.top',
  'window.opener',
  'child_process',
  'process.env',
] as const;

export const SAFE_LIMIT_RANGES: Record<keyof SubmissionLimits, { min: number; max: number }> = {
  tokenTtlMinutes: { min: 15, max: 240 },
  maxTokenAttempts: { min: 1, max: 10 },
  maxRequestBytes: { min: 256 * 1024, max: 5 * 1024 * 1024 },
  maxPackageJsonBytes: { min: 256 * 1024, max: 5 * 1024 * 1024 },
  maxTotalSourceBytes: { min: 128 * 1024, max: 4 * 1024 * 1024 },
  maxSingleFileBytes: { min: 16 * 1024, max: 1024 * 1024 },
  maxFiles: { min: 1, max: 100 },
  maxReportBytes: { min: 16 * 1024, max: 1024 * 1024 },
  maxTitleLength: { min: 40, max: 500 },
  maxSummaryLength: { min: 1_000, max: 50_000 },
  maxPathLength: { min: 100, max: 500 },
  maxDependenciesAdded: { min: 0, max: 20 },
};
