import type {
  AgentReview,
  EffectManifest,
  ImprovementPackage,
  PackageValidationResult,
  SubmissionStatus,
  SubmissionTokenRecord,
} from '../../src/motion-arsenal/community/types';

export type ManifestRegistryRecord = {
  manifest: EffectManifest;
  sources: Record<string, string>;
};

export type ManifestRegistry = Map<string, ManifestRegistryRecord>;

export type StoredSubmission = {
  id: string;
  effectId: string;
  baseVersion: string;
  manifestHash: string;
  status: SubmissionStatus;
  packageHash: string;
  package: ImprovementPackage;
  createdAt: string;
  updatedAt: string;
  review?: AgentReview;
};

export type PreviewArtifact = {
  id: string;
  submissionId: string;
  contentHash: string;
  artifactPath: string;
  previewUrl: string;
  buildReport: {
    ok: boolean;
    durationMs: number;
    files: string[];
    warnings: string[];
  };
  securityReport: {
    compilerIsolation: string[];
    limitations: string[];
  };
  expiresAt: string;
  createdAt: string;
};

export type CommunityStore = {
  syncManifests(records: ManifestRegistry): void;
  createToken(record: SubmissionTokenRecord & { createdByIpHash: string }): void;
  getTokenByHash(tokenHash: string): SubmissionTokenRecord | undefined;
  revokeToken(tokenHash: string, at: string): boolean;
  countRecentEvents(eventType: string, actorIdHash: string, since: string): number;
  countActiveTokens(effectId: string, actorIdHash: string, now: string): number;
  writeAudit(event: {
    eventType: string;
    actorType: string;
    actorIdHash?: string;
    effectId?: string;
    submissionId?: string;
    tokenId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }): void;
  recordFailedAttempt(tokenHash: string, now: string, reason: string): SubmissionTokenRecord | undefined;
  consumeTokenAndCreateSubmission(input: {
    tokenHash: string;
    submissionId: string;
    packageHash: string;
    idempotencyKey: string;
    pkg: ImprovementPackage;
    validation: PackageValidationResult;
    now: string;
  }): { created: boolean; submissionId: string };
  listSubmissions(): StoredSubmission[];
  getSubmission(id: string): StoredSubmission | undefined;
  updateSubmissionStatus(id: string, status: SubmissionStatus, note: string, now: string): boolean;
  saveReview(submissionId: string, review: AgentReview, now: string): void;
  savePreviewArtifact(artifact: PreviewArtifact): void;
  getPreviewArtifact(id: string): PreviewArtifact | undefined;
};
