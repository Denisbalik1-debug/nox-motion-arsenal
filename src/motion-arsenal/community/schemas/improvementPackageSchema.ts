import { z } from 'zod';
import { DEFAULT_SUBMISSION_LIMITS } from '../config/submissionLimits';

const controlDefinitionSchema = z.object({
  key: z.string().min(1).max(120),
  label: z.string().min(1).max(160),
  type: z.enum(['range', 'number', 'select', 'color', 'boolean', 'text']),
  defaultValue: z.unknown(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  step: z.number().positive().finite().optional(),
  options: z.array(z.string().max(500)).max(200).optional(),
  description: z.string().max(2_000).optional(),
}).strict();

export const improvementPackageSchema = z.object({
  schemaVersion: z.literal('1.0'),
  submissionId: z.string().min(1).max(120),
  target: z.object({
    effectId: z.string().min(1).max(160),
    baseVersion: z.string().min(1).max(160),
    manifestHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  }).strict(),
  author: z.object({
    displayName: z.string().max(160).optional(),
    contact: z.string().max(320).optional(),
    anonymous: z.boolean(),
  }).strict(),
  proposal: z.object({
    title: z.string().min(1).max(DEFAULT_SUBMISSION_LIMITS.maxTitleLength),
    summary: z.string().min(1).max(DEFAULT_SUBMISSION_LIMITS.maxSummaryLength),
    motivation: z.string().min(1).max(DEFAULT_SUBMISSION_LIMITS.maxSummaryLength),
    visualChanges: z.array(z.string().max(2_000)).max(100),
    behavioralChanges: z.array(z.string().max(2_000)).max(100),
    knownLimitations: z.array(z.string().max(2_000)).max(100),
  }).strict(),
  files: z.array(z.object({
    path: z.string().min(1).max(DEFAULT_SUBMISSION_LIMITS.maxPathLength),
    operation: z.enum(['replace', 'create', 'delete']),
    language: z.enum(['typescript', 'tsx', 'css', 'json', 'glsl', 'vert', 'frag']),
    content: z.string().optional(),
    previousSha256: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
    contentSha256: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  }).strict()).max(DEFAULT_SUBMISSION_LIMITS.maxFiles),
  dependencies: z.object({
    add: z.record(z.string().min(1).max(214), z.string().min(1).max(120)),
    remove: z.array(z.string().min(1).max(214)).max(100),
  }).strict(),
  controls: z.array(z.object({
    key: z.string().min(1).max(120),
    action: z.enum(['add', 'change', 'remove']),
    definition: controlDefinitionSchema.optional(),
  }).strict()).max(200),
  verification: z.object({
    commands: z.array(z.string().max(500)).max(100),
    manualChecks: z.array(z.string().max(2_000)).max(100),
    expectedViewports: z.array(z.string().max(80)).max(20),
    reducedMotionChecked: z.boolean(),
    performanceNotes: z.string().max(DEFAULT_SUBMISSION_LIMITS.maxReportBytes),
  }).strict(),
  provenance: z.object({
    generator: z.string().max(200).optional(),
    model: z.string().max(200).optional(),
    generatedAt: z.string().datetime({ offset: true }),
    termsAccepted: z.boolean(),
  }).strict(),
}).strict();

export const improvementPackageJsonSchema = z.toJSONSchema(improvementPackageSchema, {
  target: 'draft-2020-12',
});
