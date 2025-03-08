import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';
import { db, eq, Repository } from '@docio/db';

export const repositoryPublicizedHandler = on(
  'repository.publicized',
  async (event, _c: Context<HonoEnv>) => {
    console.log(`🔓 Repository made public: ${event.repository.full_name}`);

    await db.update(Repository).set({
      private: false,
    }).where(eq(Repository.id, event.repository.id));
  },
);
