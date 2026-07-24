import rawFlags from 'virtual:community-flags';

export const COMMUNITY_FEATURE_FLAGS = {
  manualSubmissions: Boolean(rawFlags.COMMUNITY_MANUAL_SUBMISSIONS_ENABLED),
  tokenSubmissions: Boolean(rawFlags.COMMUNITY_TOKEN_SUBMISSIONS_ENABLED),
  admin: Boolean(rawFlags.COMMUNITY_ADMIN_ENABLED),
  agentReview: Boolean(rawFlags.COMMUNITY_AGENT_REVIEW_ENABLED),
  isolatedPreview: Boolean(rawFlags.COMMUNITY_ISOLATED_PREVIEW_ENABLED),
  prPreparation: Boolean(rawFlags.COMMUNITY_PR_PREPARATION_ENABLED),
} as const;
