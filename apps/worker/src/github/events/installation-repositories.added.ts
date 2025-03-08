import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';
import { addRepo } from '../utils/add-repo.ts';

export const installationRepositoriesAddedHandler = on(
  'installation_repositories.added',
  async (
    { repositories_added: repositories, installation },
    _c: Context<HonoEnv>,
  ) => {
    console.log(
      `📦 Adding new repositories for installation ID: ${installation.id}`,
    );

    _c.executionCtx.waitUntil(
      Promise.all(
        (repositories ?? []).map((repository) =>
          addRepo(repository.full_name, {
            installationId: installation.id,
          }).catch((err) => {
            console.error(
              `❌ Error adding repository: ${repository.full_name}`,
              err,
            );
          })
        ),
      ),
    );
  },
);
