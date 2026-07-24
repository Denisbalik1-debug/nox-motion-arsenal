const shortDate = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
});

export function effectUpdatedAtTimestamp(updatedAt?: string): number {
  if (!updatedAt) return 0;
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function formatEffectUpdatedAt(updatedAt?: string): {
  date: string;
  relative: string;
} {
  const timestamp = effectUpdatedAtTimestamp(updatedAt);
  if (!timestamp) return { date: 'UNBEKANNT', relative: 'PRÜFEN' };

  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  const relative =
    days === 0
      ? 'HEUTE'
      : days === 1
        ? 'GESTERN'
        : days < 30
          ? `VOR ${days} TAGEN`
          : days < 365
            ? `VOR ${Math.floor(days / 30)} MON.`
            : `VOR ${Math.floor(days / 365)} J.`;

  return {
    date: shortDate.format(new Date(timestamp)),
    relative,
  };
}
