import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';

export const repositoryRenamedHandler = on(
  'repository.renamed',
  async (event, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    await db.repository.update({
      where: {
        id: event.repository.id,
      },
      data: {
        name: event.repository.name,
        fullName: event.repository.full_name,
      },
    });

    // TODO: update the DNS records on cloudflare
  },
);
