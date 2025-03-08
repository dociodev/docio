import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.ts';

export function createDbClient() {
  return drizzle(Deno.env.get('DATABASE_URL')!, {
    schema,
  });
}

export type DbClient = ReturnType<typeof createDbClient>;
