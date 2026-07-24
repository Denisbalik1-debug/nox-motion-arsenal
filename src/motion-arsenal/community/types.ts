import type { EffectPropControl } from '../types';

export type EffectRuntime = 'react-dom' | 'canvas2d' | 'webgl' | 'svg' | 'css';

export type EffectControlDefinition = {
  key: string;
  label: string;
  type: 'range' | 'number' | 'select' | 'color' | 'boolean' | 'text';
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
};

export interface EffectManifest {
  schemaVersion: '1.0';
  id: string;
  slug: string;
  displayName: string;
  category: string;
  version: string;
  updatedAt: string;
  manifestHash: string;
  runtime: EffectRuntime;
  entryFile: string;
  ownedFiles: string[];
  dependencies: Record<string, string>;
  controls: EffectControlDefinition[];
  constraints: {
    allowedImports: string[];
    forbiddenApis: string[];
    maxFiles: number;
    maxTotalBytes: number;
    reducedMotionRequired: boolean;
    responsiveRequired: boolean;
  };
  verification: {
    viewports: string[];
    smokeTest: string;
    expectedInteractions: string[];
  };
}

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'validation_failed'
  | 'needs_changes'
  | 'approved'
  | 'rejected'
  | 'implementation_ready'
  | 'applied';

export type ImprovementFileLanguage =
  | 'typescript'
  | 'tsx'
  | 'css'
  | 'json'
  | 'glsl'
  | 'vert'
  | 'frag';

export interface ImprovementPackage {
  schemaVersion: '1.0';
  submissionId: string;
  target: {
    effectId: string;
    baseVersion: string;
    manifestHash: string;
  };
  author: {
    displayName?: string;
    contact?: string;
    anonymous: boolean;
  };
  proposal: {
    title: string;
    summary: string;
    motivation: string;
    visualChanges: string[];
    behavioralChanges: string[];
    knownLimitations: string[];
  };
  files: Array<{
    path: string;
    operation: 'replace' | 'create' | 'delete';
    language: ImprovementFileLanguage;
    content?: string;
    previousSha256?: string;
    contentSha256: string;
  }>;
  dependencies: {
    add: Record<string, string>;
    remove: string[];
  };
  controls: Array<{
    key: string;
    action: 'add' | 'change' | 'remove';
    definition?: EffectControlDefinition;
  }>;
  verification: {
    commands: string[];
    manualChecks: string[];
    expectedViewports: string[];
    reducedMotionChecked: boolean;
    performanceNotes: string;
  };
  provenance: {
    generator?: string;
    model?: string;
    generatedAt: string;
    termsAccepted: boolean;
  };
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ValidationFinding = {
  code: string;
  message: string;
  path?: string;
  severity: ValidationSeverity;
};

export type PackageValidationResult = {
  ok: boolean;
  package?: ImprovementPackage;
  findings: ValidationFinding[];
  metrics: {
    packageBytes: number;
    sourceBytes: number;
    reportBytes: number;
    fileCount: number;
    dependenciesAdded: number;
  };
};

export type ControlDiff = {
  key: string;
  action: 'add' | 'change' | 'remove';
  current?: EffectControlDefinition;
  proposed?: EffectControlDefinition;
  previewable: boolean;
};

export type AgentReviewDecision = 'accept' | 'revise' | 'reject' | 'manual_security_review';

export type AgentReview = {
  decision: AgentReviewDecision;
  totalScore: number;
  scores: {
    visualQuality: number;
    motionQuality: number;
    configurability: number;
    performance: number;
    accessibility: number;
    mobile: number;
    codeQuality: number;
    maintainability: number;
    security: number;
  };
  summary: string;
  improvements: string[];
  problems: string[];
  securityFindings: string[];
  breakingChanges: string[];
  requiredRevisions: string[];
  implementationNotes: string[];
  requiresHumanApproval: true;
};

export type SubmissionTokenStatus = 'active' | 'consumed' | 'expired' | 'blocked' | 'revoked';

export type SubmissionTokenRecord = {
  id: string;
  tokenHash: string;
  effectId: string;
  baseVersion: string;
  manifestHash: string;
  status: SubmissionTokenStatus;
  expiresAt: string;
  consumedAt?: string;
  revokedAt?: string;
  attemptCount: number;
  maxAttempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  blockedAt?: string;
  blockReason?: string;
  submissionId?: string;
};

export function propControlToDefinition(control: EffectPropControl): EffectControlDefinition {
  return {
    key: control.key,
    label: control.label,
    type: control.type,
    defaultValue: control.default,
    min: control.min,
    max: control.max,
    step: control.step,
    options: control.options,
    description: control.group ? `${control.group} control` : undefined,
  };
}
