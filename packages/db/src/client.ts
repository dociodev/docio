import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.ts';
import { env } from '@docio/env';

export const db = drizzle(env.DATABASE_URL, {
  schema,
});
