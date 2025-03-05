import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';
import { createCloudflare } from '@docio/cloudflare';
import { removeRepo } from '../utils/remove-repo.ts';

export const installationRepositoriesRemovedHandler = on(
  'installation_repositories.removed',
  async (
    { repositories_removed: repositories },
    c: Context<Env>,
  ) => {
    const db = createDbClient(c.env.db);

    const cloudflare = createCloudflare(c.env.CLOUDFLARE_API_TOKEN);

    for (const repository of repositories ?? []) {
      await removeRepo(repository.full_name, {
        db,
        cloudflare,
        zoneId: c.env.CLOUDFLARE_ZONE_ID,
        accountId: c.env.CLOUDFLARE_ACCOUNT_ID,
      });
    }
  },
);
