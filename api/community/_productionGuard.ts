type ApiResponse = {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
};

export function productionCommunityGuard(response: ApiResponse): void {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (process.env.COMMUNITY_TOKEN_SUBMISSIONS_ENABLED !== 'true') {
    response.status(404).json({ code: 'FEATURE_DISABLED' });
    return;
  }
  response.status(503).json({
    code: 'PRODUCTION_STORAGE_NOT_ACTIVATED',
    message: 'Production submission storage requires a separate GO and configured Postgres adapter.',
  });
}
