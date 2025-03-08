import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';
import { db, eq, Repository } from '@docio/db';

export const repositoryRenamedHandler = on(
  'repository.renamed',
  async (event, _c: Context<HonoEnv>) => {
    console.log(`📝 Repository renamed: ${event.repository.full_name}`);

    await db.update(Repository).set({
      name: event.repository.name,
      fullName: event.repository.full_name,
    }).where(eq(Repository.id, event.repository.id));
  },
);
