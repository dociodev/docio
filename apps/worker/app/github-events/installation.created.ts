import { createOctoApp, createOctokit, on } from '@docio/octo';
import { createDbClient } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';
import { createCloudflare } from '@docio/cloudflare';
import { slugify } from '@docio/utils';

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
      const [owner, repo] = repository.full_name.split('/');
      const docioSubdomain = slugify(
        repo === 'docio' ? owner : repository.full_name,
      );

      const { data: repoData } = await octokit.request(
        'GET /repos/{owner}/{repo}',
        {
          owner,
          repo,
        },
      );

      await db.repository.create({
        data: {
          id: repoData.id,
          installationId: installation.id,
          name: repoData.name,
          fullName: repoData.full_name,
          private: repoData.private,
          defaultBranch: repoData.default_branch,
        },
      });

      const project = await cloudflare.pages.projects.create({
        account_id: c.env.CLOUDFLARE_ACCOUNT_ID,
        name: repoData.id.toString(),
        production_branch: repoData.default_branch,
      });

      const dnsRecord = await cloudflare.dns.records.create({
        zone_id: c.env.CLOUDFLARE_ZONE_ID,
        content: `${docioSubdomain}.docio.dev`,
        name: project.subdomain,
        proxied: true,
        type: 'CNAME',
      });

      const doamin = await cloudflare.pages.projects.domains.create(
        repoData.id.toString(),
        {
          name: `${docioSubdomain}.docio.dev`,
          account_id: c.env.CLOUDFLARE_ACCOUNT_ID,
        },
      );

      if (!doamin) {
        throw new Error('Failed to create domain');
      }

      await db.domain.create({
        data: {
          id: doamin.id!,
          name: doamin.name!,
          isDocioDomain: true,
          dnsRecordId: dnsRecord.id!,
          repositoryId: repoData.id,
          isVerified: true,
        },
      });
    }
  },
);
