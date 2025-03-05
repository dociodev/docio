import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';

export const installationRepositoriesRemovedHandler = on(
  'installation_repositories.removed',
  async (event, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    await db.repository.deleteMany({
      where: {
        id: {
          in: event.repositories_removed.map((repo) => repo.id),
        },
      },
    });

    // TODO: remove the projects and DNS records on cloudflare
  },
);
