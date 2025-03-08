import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient, eq, Repository } from '@docio/db';

export const repositoryPrivatizedHandler = on(
  'repository.privatized',
  async (event, _c: Context<Env>) => {
    console.log(`🔒 Repository made private: ${event.repository.full_name}`);
    const db = createDbClient();

    await db.update(Repository).set({
      private: true,
    }).where(eq(Repository.id, event.repository.id));
  },
);
