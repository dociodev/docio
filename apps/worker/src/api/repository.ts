import { Hono } from 'hono';
import type { HonoEnv } from '@docio/env';
import { db, Domain, eq, Repository } from '@docio/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createOctokit } from '@docio/octo';
import { env } from '@docio/env';

export const repositoryApi = new Hono<HonoEnv>();

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

    if (secret !== env.WORKER_SECRET) {
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

    const octokit = await createOctokit(repository.installation.id);

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
