import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';
import { createCloudflare } from '@docio/cloudflare';
import { removeRepo } from '../utils/remove-repo.ts';
import { Client } from '@upstash/qstash';

export const installationRepositoriesRemovedHandler = on(
  'installation_repositories.removed',
  async (
    { repositories_removed: repositories },
    _c: Context<Env>,
  ) => {
    console.log(`🗑️ Processing repositories removal request`);
    const db = createDbClient();
    const qstash = new Client({
      token: Deno.env.get('QSTASH_TOKEN')!,
      baseUrl: Deno.env.get('QSTASH_URL')!,
    });

    const cloudflare = createCloudflare(Deno.env.get('CLOUDFLARE_API_TOKEN')!);

    for (const repository of repositories ?? []) {
      console.log(`➖ Removing repository: ${repository.full_name}`);
      await removeRepo(repository.full_name, {
        db,
        cloudflare,
        zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
        accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
        qstash,
      });
    }
  },
);
