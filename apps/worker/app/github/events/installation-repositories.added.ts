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
    const db = createDbClient(c.env.db);

    const app = createOctoApp(
      c.env.GITHUB_APP_ID!,
      c.env.GITHUB_APP_PRIVATE_KEY!,
    );
    const octokit = await createOctokit(app, installation.id);

    const cloudflare = createCloudflare(c.env.CLOUDFLARE_API_TOKEN);

    for (const repository of repositories ?? []) {
      console.log(`➕ Setting up repository: ${repository.full_name}`);
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
