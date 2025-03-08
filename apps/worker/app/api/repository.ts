import { Hono } from 'hono';
import type { Env } from '@docio/env';
import { Client, Receiver } from '@upstash/qstash';
import { createDbClient, Domain, eq, Repository } from '@docio/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { removeRepo } from '../github/utils/remove-repo.ts';
import { createCloudflare } from '@docio/cloudflare';
import { createOctoApp, createOctokit } from '@docio/octo';

export const repositoryApi = new Hono<Env>();

repositoryApi.delete(
  '/repository/:id',
  async (c, next) => {
    console.log(`🔐 Verifying QStash signature for repository deletion`);
    const receiver = new Receiver({
      currentSigningKey: Deno.env.get('QSTASH_CURRENT_SIGNING_KEY')!,
      nextSigningKey: Deno.env.get('QSTASH_NEXT_SIGNING_KEY')!,
    });

    const isValid = await receiver.verify({
      body: await c.req.raw.clone().text(),
      signature: c.req.header('Upstash-Signature')!,
    });

    if (!isValid) {
      return c.json({ message: 'Not authorized' }, 401);
    }

    await next();
  },
  zValidator(
    'param',
    z.object({
      id: z.coerce.number(),
    }),
  ),
  async (c) => {
    const { id } = c.req.valid('param');
    console.log(`🗑️ Processing repository deletion request for ID: ${id}`);

    const db = createDbClient();

    const repo = await db.query.Repository.findFirst({
      where: eq(Repository.id, id),
      columns: {
        fullName: true,
      },
    });

    if (!repo) {
      console.log(`⚠️ Repository not found: ${id}`);
      return c.json({ message: 'Repository not found' }, 404);
    }

    const cloudflare = createCloudflare(Deno.env.get('CLOUDFLARE_API_TOKEN')!);
    const qstash = new Client({
      token: Deno.env.get('QSTASH_TOKEN')!,
      baseUrl: Deno.env.get('QSTASH_URL')!,
    });

    console.log(`🚮 Removing repository: ${repo.fullName}`);
    await removeRepo(repo.fullName, {
      db,
      cloudflare,
      zoneId: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
      accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
      qstash,
    });
  },
);

repositoryApi.post(
  '/repository/:id/deployment/:deploymentId/:state',
  zValidator(
    'header',
    z.object({
      'X-Worker-Secret': z.string(),
    }),
  ),
  async (c, next) => {
    const { 'X-Worker-Secret': secret } = c.req.valid('header');

    if (secret !== Deno.env.get('WORKER_SECRET')!) {
      return c.json({ message: 'Invalid secret' }, 401);
    }

    await next();
  },
  zValidator(
    'param',
    z.object({
      id: z.coerce.number(),
      deploymentId: z.coerce.number(),
      state: z.enum(['queued', 'in_progress', 'success', 'failure']),
    }),
  ),
  async (c) => {
    const { id, deploymentId, state } = c.req.valid('param');

    const db = createDbClient();

    const repository = await db.query.Repository.findFirst({
      where: eq(Repository.id, id),
      columns: {
        fullName: true,
      },
      with: {
        domains: {
          columns: {
            name: true,
            isDocioDomain: true,
          },
          where: eq(Domain.isVerified, true),
        },
        installation: {
          columns: {
            id: true,
          },
        },
      },
    });

    if (!repository) {
      return c.json({ message: 'Repository not found' }, 404);
    }

    const [owner, repo] = repository.fullName.split('/');

    const octoApp = createOctoApp(
      Deno.env.get('GITHUB_APP_ID')!,
      Deno.env.get('GITHUB_APP_PRIVATE_KEY')!,
    );
    const octokit = await createOctokit(octoApp, repository.installation.id);

    const docioDomain = repository.domains.find((d) => d.isDocioDomain);
    const nonDocioDomain = repository.domains.find((d) => !d.isDocioDomain);

    await octokit.request(
      'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner,
        repo,
        deployment_id: deploymentId,
        state,
        environment_url: nonDocioDomain?.name
          ? `https://${nonDocioDomain.name}`
          : docioDomain?.name
          ? `https://${docioDomain.name}`
          : undefined,
      },
    );

    return c.json({ message: 'Deployment state updated' }, 200);
  },
);
