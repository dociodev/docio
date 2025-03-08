import { createOctoApp, createOctokit, on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';
import { addRepo } from '../utils/add-repo.ts';
import { createCloudflare } from '@docio/cloudflare';

export const installationRepositoriesAddedHandler = on(
  'installation_repositories.added',
  async (
    { repositories_added: repositories, installation },
    c: Context<Env>,
  ) => {
    console.log(
      `📦 Adding new repositories for installation ID: ${installation.id}`,
    );
    const db = createDbClient();

    const app = createOctoApp(
      Deno.env.get('GITHUB_APP_ID')!,
      Deno.env.get('GITHUB_APP_PRIVATE_KEY')!,
    );
    const octokit = await createOctokit(app, installation.id);

    const cloudflare = createCloudflare(Deno.env.get('CLOUDFLARE_API_TOKEN')!);

    for (const repository of repositories ?? []) {
      console.log(`➕ Setting up repository: ${repository.full_name}`);
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
