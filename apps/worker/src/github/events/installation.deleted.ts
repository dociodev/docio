import { on } from '@docio/octo';
import { db, eq, Installation } from '@docio/db';
import type { HonoEnv } from '@docio/env';
import type { Context } from 'hono';
import { removeRepo } from '../utils/remove-repo.ts';

// app is uninstalled
export const installationDeletedHandler = on(
  'installation.deleted',
  ({ installation }, _c: Context<HonoEnv>) => {
    console.log(`🗑️ Installation deleted for ID: ${installation.id}`);

    _c.executionCtx.waitUntil(
      Promise.resolve().then(async () => {
        const { repositories } = (await db.query.Installation.findFirst({
          where: eq(Installation.id, installation.id),
          with: {
            repositories: {
              columns: {
                fullName: true,
              },
            },
          },
        })) ?? { repositories: [] };

        for (const repository of repositories ?? []) {
          console.log(`➖ Removing repository: ${repository.fullName}`);
          await removeRepo(repository.fullName);
        }

        await db.delete(Installation).where(
          eq(Installation.id, installation.id),
        );
      }),
    );
  },
);
