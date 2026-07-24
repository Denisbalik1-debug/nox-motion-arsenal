import { DEFAULT_SUBMISSION_LIMITS } from '../config/submissionLimits';
import { createImprovementPackageTemplate } from '../lib/packageTemplate';
import { improvementPackageJsonSchema } from '../schemas/improvementPackageSchema';
import type { EffectManifest } from '../types';

type SubmissionAccess = {
  endpoint: string;
  token: string;
  expiresAt: string;
};

export function buildImprovementPrompt(
  manifest: EffectManifest,
  sources: Record<string, string>,
  includeSource: boolean,
  submissionAccess?: SubmissionAccess,
): string {
  const sourceSection = includeSource
    ? manifest.ownedFiles.map((path) => `FILE: ${path}\n${sources[path] ?? ''}\nEND FILE`).join('\n\n')
    : 'Source code was intentionally not included. Ask the user to copy the prompt with effect code if implementation is required.';

  const automatedSubmission = submissionAccess ? `
AUTOMATED SUBMISSION

You may submit the final NOX Improvement Package automatically.

Endpoint:
${submissionAccess.endpoint}

One-time token:
${submissionAccess.token}

Token expires at:
${submissionAccess.expiresAt}

The token is valid for 60 minutes from creation and can be used for one successful submission.

Before submitting:
1. Complete the full implementation.
2. Validate the final package against the provided schema.
3. Ensure all files belong to the specified effect.
4. Ensure the package stays within the documented size limits.
5. Send exactly one JSON request to the provided submission endpoint.
6. Do not call any other endpoint.
7. Do not include unrelated data, credentials, environment variables or conversation history.

If automated submission fails because the token expired, return the complete final Improvement Package to the user so it can be submitted manually or with a newly generated token.
` : '';

  return `You are improving exactly one effect in the NOX Motion Arsenal.

TARGET MANIFEST
${JSON.stringify(manifest, null, 2)}

EDITABLE SOURCE
${sourceSection}

RULES
- Modify only manifest.ownedFiles.
- New files may only be created below the effect-owned directory named "${manifest.id}".
- Never modify shell, registry, global types, global styles, build, API, auth, admin, security, environment or deployment files.
- Do not use eval, new Function, remote imports, network APIs, browser storage, service workers, parent-window access, privileged Node APIs, secrets or credentials.
- Preserve responsive behavior and prefers-reduced-motion.
- Do not add a dependency unless it is unavoidable. Any proposal requires an exact version, technical reason, bundle impact, license and security note.
- Maximum request/package: ${DEFAULT_SUBMISSION_LIMITS.maxPackageJsonBytes} bytes.
- Maximum source content: ${DEFAULT_SUBMISSION_LIMITS.maxTotalSourceBytes} bytes.
- Maximum single file: ${DEFAULT_SUBMISSION_LIMITS.maxSingleFileBytes} bytes.
- Maximum files: ${DEFAULT_SUBMISSION_LIMITS.maxFiles}.
- Hash every file content with SHA-256. For replacements, hash the current source as previousSha256.

IMPROVEMENT PACKAGE TEMPLATE
${JSON.stringify(createImprovementPackageTemplate(manifest), null, 2)}

JSON SCHEMA
${JSON.stringify(improvementPackageJsonSchema, null, 2)}
${automatedSubmission}
RETURN CONTRACT
Return exactly one valid JSON object matching the schema.
Do not wrap it in a Markdown code block.
Do not add text before or after the JSON.`;
}
