import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';
import { removeRepo } from '../utils/remove-repo.ts';

export const installationRepositoriesRemovedHandler = on(
  'installation_repositories.removed',
  async (
    { repositories_removed: repositories },
    _c: Context<HonoEnv>,
  ) => {
    console.log(`🗑️ Processing repositories removal request`);
    for (const repository of repositories ?? []) {
      console.log(`➖ Removing repository: ${repository.full_name}`);
      await removeRepo(repository.full_name);
    }
  },
);
