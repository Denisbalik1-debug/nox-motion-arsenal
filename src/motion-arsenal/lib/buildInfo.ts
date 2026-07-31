import buildInfo from 'virtual:build-info';

/**
 * Commit-/Build-Stempel für den Handoff. Wird beim Build aus Git gelesen und
 * fällt auf 'unknown' zurück, wenn kein Git-Kontext verfügbar ist.
 */
export const BUILD_INFO: { commit: string; buildTime: string } = {
  commit: buildInfo.commit || 'unknown',
  buildTime: buildInfo.buildTime,
};
