import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';
import { db, eq, Repository } from '@docio/db';

export const installationTargetRenamedHandler = on(
  'installation_target.renamed',
  async (event, _c: Context<HonoEnv>) => {
    console.log(
      `✏️ Installation target renamed for ID: ${event.installation.id}`,
    );

    const repos = await db.query.Repository.findMany({
      where: eq(Repository.installationId, event.installation.id),
    });

    _c.executionCtx.waitUntil(
      Promise.all(
        repos.map((repo) => {
          const newFullName = [event.account.login, repo.fullName.split('/')[1]]
            .join('/');
          console.log(
            `📝 Updating repository name from ${repo.fullName} to ${newFullName}`,
          );
          return db
            .update(Repository)
            .set({
              fullName: newFullName,
            })
            .where(eq(Repository.id, repo.id))
            .catch((err) => {
              console.error(
                `❌ Error updating repository name: ${repo.fullName}`,
                err,
              );
            });
        }),
      ),
    );
  },
);
