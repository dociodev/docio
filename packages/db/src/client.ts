import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.ts';
import { env } from '@docio/env';

export function createDbClient() {
  return drizzle(env.DATABASE_URL, {
    schema,
  });
}

export type DbClient = ReturnType<typeof createDbClient>;
