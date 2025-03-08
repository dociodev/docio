import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';
import { createDbClient, eq, Repository } from '@docio/db';

export const installationTargetRenamedHandler = on(
  'installation_target.renamed',
  async (event, _c: Context<HonoEnv>) => {
    console.log(
      `✏️ Installation target renamed for ID: ${event.installation.id}`,
    );
    const db = createDbClient();

    const repos = await db.query.Repository.findMany({
      where: eq(Repository.installationId, event.installation.id),
    });

    for (const repo of repos) {
      const newFullName = [event.account.login, repo.fullName.split('/')[1]]
        .join('/');
      console.log(
        `📝 Updating repository name from ${repo.fullName} to ${newFullName}`,
      );
      await db.update(Repository).set({
        fullName: newFullName,
      }).where(eq(Repository.id, repo.id));
    }
  },
);
