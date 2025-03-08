import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';
import { removeRepo } from '../utils/remove-repo.ts';

export const installationRepositoriesRemovedHandler = on(
  'installation_repositories.removed',
  (
    { repositories_removed: repositories },
    _c: Context<HonoEnv>,
  ) => {
    console.log(`🗑️ Processing repositories removal request`);

    _c.executionCtx.waitUntil(
      Promise.all(
        (repositories ?? []).map((repository) =>
          removeRepo(repository.full_name).catch((err) => {
            console.error(
              `❌ Error removing repository: ${repository.full_name}`,
              err,
            );
          })
        ),
      ),
    );
  },
);
