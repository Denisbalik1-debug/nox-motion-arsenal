export type DiffLine = {
  type: 'context' | 'removed' | 'added';
  oldLine?: number;
  newLine?: number;
  text: string;
};

export function createSafeLineDiff(before: string, after: string, maxLines = 600): DiffLine[] {
  const oldLines = before.split(/\r?\n/);
  const newLines = after.split(/\r?\n/);
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix
    && suffix < newLines.length - prefix
    && oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) suffix += 1;

  const output: DiffLine[] = [];
  const contextStart = Math.max(0, prefix - 3);
  for (let index = contextStart; index < prefix; index += 1) {
    output.push({ type: 'context', oldLine: index + 1, newLine: index + 1, text: oldLines[index] });
  }
  for (let index = prefix; index < oldLines.length - suffix; index += 1) {
    output.push({ type: 'removed', oldLine: index + 1, text: oldLines[index] });
  }
  for (let index = prefix; index < newLines.length - suffix; index += 1) {
    output.push({ type: 'added', newLine: index + 1, text: newLines[index] });
  }
  for (let offset = Math.max(0, suffix - 3); offset < suffix; offset += 1) {
    const oldIndex = oldLines.length - suffix + offset;
    const newIndex = newLines.length - suffix + offset;
    output.push({ type: 'context', oldLine: oldIndex + 1, newLine: newIndex + 1, text: oldLines[oldIndex] });
  }
  if (output.length > maxLines) {
    return [
      ...output.slice(0, Math.floor(maxLines / 2)),
      { type: 'context', text: `… ${output.length - maxLines} Diff-Zeilen ausgeblendet …` },
      ...output.slice(-Math.ceil(maxLines / 2)),
    ];
  }
  return output;
}
