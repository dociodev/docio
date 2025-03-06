import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';

export const installationTargetRenamedHandler = on(
  'installation_target.renamed',
  async (event, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    const repos = await db.repository.findMany({
      where: {
        installationId: event.installation.id,
      },
    });

    for (const repo of repos) {
      await db.repository.update({
        where: { id: repo.id },
        data: {
          fullName: [event.account.login, repo.fullName.split('/')[1]].join(
            '/',
          ),
        },
      });
    }
  },
);
