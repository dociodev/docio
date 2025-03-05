import { createOctoApp, createOctokit, on } from '@docio/octo';
import { createDbClient } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';
import { createCloudflare } from '@docio/cloudflare';
import { addRepo } from '../utils/add-repo.ts';

// app is installed
export const installationCreatedHandler = on(
  'installation.created',
  async ({ installation, repositories }, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    await db.installation.create({
      data: {
        id: installation.id,
      },
    });

    const app = createOctoApp(
      c.env.GITHUB_APP_ID!,
      c.env.GITHUB_APP_PRIVATE_KEY!,
    );
    const octokit = await createOctokit(app, installation.id);

    const cloudflare = createCloudflare(c.env.CLOUDFLARE_API_TOKEN);

    for (const repository of repositories ?? []) {
      await addRepo(repository.full_name, {
        installationId: installation.id,
        octokit,
        db,
        cloudflare,
        accountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        zoneId: c.env.CLOUDFLARE_ZONE_ID,
      });
    }
  },
);
