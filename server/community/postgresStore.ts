import type { CommunityStore } from './types';

export type PostgresQueryResult<Row = Record<string, unknown>> = {
  rows: Row[];
  rowCount: number;
};

export type PostgresExecutor = {
  query<Row = Record<string, unknown>>(sql: string, parameters?: unknown[]): Promise<PostgresQueryResult<Row>>;
  transaction<T>(work: (executor: PostgresExecutor) => Promise<T>): Promise<T>;
};

/**
 * Production adapter seam. The local implementation deliberately uses SQLite.
 * Activating Postgres requires an approved provider, secret injection, migration
 * run and an async CommunityStore variant; none of those are silently selected.
 */
export class PostgresCommunityStoreAdapter {
  constructor(readonly executor: PostgresExecutor) {}

  static fromEnvironment(): never {
    throw new Error(
      'POSTGRES_NOT_ACTIVATED: approve a provider and inject a PostgresExecutor; production community flags stay disabled.',
    );
  }

  assertCommunityStoreContract(_store: CommunityStore): void {
    // Compile-time contract marker for the production implementation.
  }
}
