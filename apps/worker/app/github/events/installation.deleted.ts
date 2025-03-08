import { on } from '@docio/octo';
import { createDbClient, eq, Installation } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';
import { createCloudflare } from '@docio/cloudflare';
import { removeRepo } from '../utils/remove-repo.ts';
import { Client } from '@upstash/qstash';

// app is uninstalled
export const installationDeletedHandler = on(
  'installation.deleted',
  async ({ installation }, _c: Context<Env>) => {
    console.log(`🗑️ Installation deleted for ID: ${installation.id}`);
    const db = createDbClient();
    const qstash = new Client({
      token: Deno.env.get('QSTASH_TOKEN')!,
      baseUrl: Deno.env.get('QSTASH_URL')!,
    });

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

    const cloudflare = createCloudflare(Deno.env.get('CLOUDFLARE_API_TOKEN')!);

    for (const repository of repositories ?? []) {
      console.log(`➖ Removing repository: ${repository.fullName}`);
      await removeRepo(repository.fullName, {
        db,
        cloudflare,
        zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
        accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
        qstash,
      });
    }

    await db.delete(Installation).where(eq(Installation.id, installation.id));
  },
);
