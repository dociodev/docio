import { createOctoApp, createOctokit, on } from '@docio/octo';
import { createDbClient, Installation } from '@docio/db';
import type { HonoEnv } from '@docio/env';
import type { Context } from 'hono';
import { createCloudflare } from '@docio/cloudflare';
import { addRepo } from '../utils/add-repo.ts';

// app is installed
export const installationCreatedHandler = on(
  'installation.created',
  async ({ installation, repositories }, _c: Context<HonoEnv>) => {
    console.log(`📦 New installation created for ID: ${installation.id}`);
    const db = createDbClient();

    await db.insert(Installation).values({
      id: installation.id,
      updatedAt: new Date(),
    });

    const app = createOctoApp(
      Deno.env.get('GITHUB_APP_ID')!,
      Deno.env.get('GITHUB_APP_PRIVATE_KEY')!,
    );
    const octokit = await createOctokit(app, installation.id);

    const cloudflare = createCloudflare(Deno.env.get('CLOUDFLARE_API_TOKEN')!);

    for (const repository of repositories ?? []) {
      console.log(`➕ Adding repository: ${repository.full_name}`);
      await addRepo(repository.full_name, {
        installationId: installation.id,
        octokit,
        db,
        cloudflare,
        accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
        zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
      });
    }
  },
);
