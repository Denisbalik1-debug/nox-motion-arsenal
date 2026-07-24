import { DEFAULT_SUBMISSION_LIMITS, SAFE_LIMIT_RANGES, type SubmissionLimits } from '../../src/motion-arsenal/community/config/submissionLimits';

const ENV_KEYS: Partial<Record<keyof SubmissionLimits, string>> = {
  tokenTtlMinutes: 'COMMUNITY_TOKEN_TTL_MINUTES',
  maxTokenAttempts: 'COMMUNITY_MAX_TOKEN_ATTEMPTS',
  maxRequestBytes: 'COMMUNITY_MAX_REQUEST_BYTES',
  maxPackageJsonBytes: 'COMMUNITY_MAX_PACKAGE_BYTES',
  maxTotalSourceBytes: 'COMMUNITY_MAX_TOTAL_SOURCE_BYTES',
  maxSingleFileBytes: 'COMMUNITY_MAX_SINGLE_FILE_BYTES',
  maxFiles: 'COMMUNITY_MAX_FILES',
  maxReportBytes: 'COMMUNITY_MAX_REPORT_BYTES',
};

export function readSubmissionLimits(environment: NodeJS.ProcessEnv = process.env): SubmissionLimits {
  const limits = { ...DEFAULT_SUBMISSION_LIMITS } as SubmissionLimits;
  for (const [key, envName] of Object.entries(ENV_KEYS) as Array<[keyof SubmissionLimits, string]>) {
    const raw = environment[envName];
    if (raw === undefined) continue;
    const value = Number(raw);
    const range = SAFE_LIMIT_RANGES[key];
    if (Number.isSafeInteger(value) && value >= range.min && value <= range.max) limits[key] = value;
    else console.warn(`[community] ${envName} is invalid; using documented default ${DEFAULT_SUBMISSION_LIMITS[key]}`);
  }
  return limits;
}

export type ServerFeatureFlags = {
  manualSubmissions: boolean;
  tokenSubmissions: boolean;
  admin: boolean;
  agentReview: boolean;
  isolatedPreview: boolean;
  prPreparation: boolean;
};

export function readServerFeatureFlags(environment: NodeJS.ProcessEnv = process.env): ServerFeatureFlags {
  const local = !environment.VERCEL && environment.NODE_ENV !== 'production';
  const enabled = (key: string) => local || environment[key] === 'true';
  return {
    manualSubmissions: enabled('COMMUNITY_MANUAL_SUBMISSIONS_ENABLED'),
    tokenSubmissions: enabled('COMMUNITY_TOKEN_SUBMISSIONS_ENABLED'),
    admin: enabled('COMMUNITY_ADMIN_ENABLED'),
    agentReview: enabled('COMMUNITY_AGENT_REVIEW_ENABLED'),
    isolatedPreview: enabled('COMMUNITY_ISOLATED_PREVIEW_ENABLED'),
    prPreparation: enabled('COMMUNITY_PR_PREPARATION_ENABLED'),
  };
}
