import { on } from '@docio/octo';
import { createDbClient } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';
import { createCloudflare } from '@docio/cloudflare';
import { removeRepo } from '../utils/remove-repo.ts';
import { Client } from '@upstash/qstash';

// app is uninstalled
export const installationDeletedHandler = on(
  'installation.deleted',
  async ({ installation }, c: Context<Env>) => {
    console.log(`🗑️ Installation deleted for ID: ${installation.id}`);
    const db = createDbClient(c.env.db);
    const qstash = new Client({
      token: c.env.QSTASH_TOKEN,
      baseUrl: c.env.QSTASH_URL,
    });

    const { repositories } = (await db.installation.findFirst({
      where: {
        id: installation.id,
      },
      select: {
        repositories: {
          select: {
            fullName: true,
          },
        },
      },
    })) ?? { repositories: [] };

    const cloudflare = createCloudflare(c.env.CLOUDFLARE_API_TOKEN);

    for (const repository of repositories ?? []) {
      console.log(`➖ Removing repository: ${repository.fullName}`);
      await removeRepo(repository.fullName, {
        db,
        cloudflare,
        zoneId: c.env.CLOUDFLARE_ZONE_ID,
        accountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        qstash,
      });
    }

    await db.installation.delete({
      where: {
        id: installation.id,
      },
    });
  },
);
