import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';

export const installationTargetRenamedHandler = on(
  'installation_target.renamed',
  async (event, c: Context<Env>) => {
    console.log(
      `✏️ Installation target renamed for ID: ${event.installation.id}`,
    );
    const db = createDbClient(c.env.db);

    const repos = await db.repository.findMany({
      where: {
        installationId: event.installation.id,
      },
    });

    for (const repo of repos) {
      const newFullName = [event.account.login, repo.fullName.split('/')[1]]
        .join('/');
      console.log(
        `📝 Updating repository name from ${repo.fullName} to ${newFullName}`,
      );
      await db.repository.update({
        where: { id: repo.id },
        data: {
          fullName: newFullName,
        },
      });
    }
  },
);
