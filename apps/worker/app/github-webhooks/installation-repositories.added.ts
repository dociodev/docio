import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';

export const installationRepositoriesAddedHandler = on(
  'installation_repositories.added',
  async (event, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    await db.repository.createMany({
      data: event.repositories_added.map((repo) => ({
        id: repo.id,
        installationId: event.installation.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      })),
    });
  },
);
