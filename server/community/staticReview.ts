import ts from 'typescript';
import type { AgentReview, EffectManifest, ImprovementPackage } from '../../src/motion-arsenal/community/types';

type Evidence = {
  imports: Set<string>;
  hooks: Set<string>;
  identifiers: Set<string>;
  dangerous: string[];
  syntaxErrors: string[];
  sourceBytes: number;
  fileCount: number;
};

const SECURITY_RULES: Array<[RegExp, string]> = [
  [/\beval\s*\(/, 'eval() is forbidden'],
  [/\bnew\s+Function\s*\(/, 'Function constructor is forbidden'],
  [/\bdocument\.cookie\b/, 'Cookie access requires manual security review'],
  [/\b(?:localStorage|sessionStorage)\b/, 'Browser persistence requires manual security review'],
  [/\bfetch\s*\(|\bWebSocket\s*\(/, 'Network access requires manual security review'],
  [/\b(?:XMLHttpRequest|EventSource)\b|\bnavigator\.sendBeacon\b/, 'Network exfiltration API is forbidden'],
  [/\binnerHTML\b|\bdangerouslySetInnerHTML\b/, 'Raw HTML injection requires manual security review'],
  [/\b(?:indexedDB|serviceWorker)\b/i, 'Persistent browser capabilities are forbidden'],
  [/\bwindow\.(?:parent|top|opener)\b/, 'Parent or opener access is forbidden'],
  [/\b(?:child_process|node:child_process|node:fs|node:net|node:http|node:https)\b/, 'Node system module is forbidden'],
  [/\bprocess\.env\b/, 'Environment access is forbidden'],
  [/\bimport\s*\(\s*(?!['"]\.{1,2}\/)/, 'Non-literal or non-local dynamic import is forbidden'],
  [/<script\b|https?:\/\/[^'"\s)]+\.js\b/i, 'External script reference is forbidden'],
  [/(?:[A-Za-z0-9+/]{512,}={0,2})/, 'Unusually large encoded block requires manual review'],
];

function collectEvidence(pkg: ImprovementPackage): Evidence {
  const evidence: Evidence = {
    imports: new Set(),
    hooks: new Set(),
    identifiers: new Set(),
    dangerous: [],
    syntaxErrors: [],
    sourceBytes: 0,
    fileCount: pkg.files.length,
  };

  for (const file of pkg.files) {
    if (!file.content || !['typescript', 'tsx'].includes(file.language)) continue;
    evidence.sourceBytes += Buffer.byteLength(file.content, 'utf8');
    const kind = file.language === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.ES2022, true, kind);
    const parseDiagnostics = (source as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
    for (const diagnostic of parseDiagnostics) {
      evidence.syntaxErrors.push(`${file.path}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
    }
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        evidence.imports.add(node.moduleSpecifier.text);
      }
      if (ts.isIdentifier(node)) {
        evidence.identifiers.add(node.text);
        if (/^use[A-Z]/.test(node.text)) evidence.hooks.add(node.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    for (const [pattern, message] of SECURITY_RULES) {
      if (pattern.test(file.content)) evidence.dangerous.push(`${file.path}: ${message}`);
    }
  }
  return evidence;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function reviewImprovementPackage(pkg: ImprovementPackage, manifest?: EffectManifest): AgentReview {
  const evidence = collectEvidence(pkg);
  if (manifest) {
    const allowed = new Set([...Object.keys(manifest.dependencies), ...Object.keys(pkg.dependencies.add)]);
    for (const specifier of evidence.imports) {
      if (specifier.startsWith('.') || specifier.startsWith('@/')) continue;
      const packageName = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
      if (!allowed.has(packageName)) evidence.dangerous.push(`Unknown dependency import: ${specifier}`);
    }
  }
  const controls = pkg.controls.length;
  const hasReducedMotion = pkg.verification.reducedMotionChecked
    || evidence.identifiers.has('usePrefersReducedMotion')
    || evidence.identifiers.has('prefersReducedMotion');
  const hasResponsiveEvidence = pkg.verification.expectedViewports.length >= 2;
  const hasCleanupEvidence = evidence.identifiers.has('cancelAnimationFrame')
    || evidence.identifiers.has('removeEventListener');
  const syntaxPenalty = evidence.syntaxErrors.length ? 5 : 0;
  const securityPenalty = evidence.dangerous.length ? 7 : 0;

  const scores = {
    // Visual and motion quality cannot be established from an AST. They stay neutral
    // and the report explicitly requires a human/browser review.
    visualQuality: 5,
    motionQuality: 5,
    configurability: clamp(4 + controls * 2),
    performance: clamp(5 + (hasCleanupEvidence ? 2 : 0) - (evidence.sourceBytes > 500_000 ? 2 : 0)),
    accessibility: clamp(4 + (hasReducedMotion ? 4 : 0)),
    mobile: clamp(4 + (hasResponsiveEvidence ? 3 : 0)),
    codeQuality: clamp(7 - syntaxPenalty),
    maintainability: clamp(7 - (evidence.fileCount > 15 ? 2 : 0) - syntaxPenalty),
    security: clamp(9 - securityPenalty),
  };
  const problems = [
    ...evidence.syntaxErrors,
    'Visual quality and motion quality require human inspection in the sandboxed preview.',
  ];
  const requiredRevisions = [
    ...(!hasReducedMotion ? ['Document and verify a reduced-motion fallback.'] : []),
    ...(!hasResponsiveEvidence ? ['Add at least two explicit viewport checks.'] : []),
    ...evidence.syntaxErrors,
  ];
  const totalScore = Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / 9 * 10);
  const decision = evidence.dangerous.length
    ? 'manual_security_review'
    : requiredRevisions.length > 1
      ? 'revise'
      : 'accept';

  return {
    decision,
    totalScore,
    scores,
    summary: `Deterministic static review: ${evidence.fileCount} files, ${evidence.sourceBytes} source bytes, ${controls} control changes.`,
    improvements: pkg.proposal.visualChanges.concat(pkg.proposal.behavioralChanges).slice(0, 20),
    problems,
    securityFindings: evidence.dangerous,
    breakingChanges: pkg.files.filter((file) => file.operation === 'delete').map((file) => `Deletes ${file.path}`),
    requiredRevisions,
    implementationNotes: [
      `Imports observed: ${[...evidence.imports].sort().join(', ') || 'none'}`,
      `Hooks observed: ${[...evidence.hooks].sort().join(', ') || 'none'}`,
      'No submitted module was imported or executed by this review.',
    ],
    requiresHumanApproval: true,
  };
}
