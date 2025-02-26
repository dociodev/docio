import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { App } from '@octokit/app';

const app = new Hono();

app.get(
  '/:owner/:repo/:ref',
  zValidator(
    'header',
    z.object({
      'X-Worker-Secret': z.string(),
    }),
  ),
  async (c, next) => {
    const { 'X-Worker-Secret': secret } = c.req.valid('header');

    if (secret !== c.env.WORKER_SECRET) {
      return c.json({ message: 'Invalid secret' }, 401);
    }

    await next();
  },
  zValidator(
    'param',
    z.object({
      owner: z.string(),
      repo: z.string(),
      ref: z.string(),
    }),
  ),
  async (c) => {
    const { owner, repo, ref } = c.req.valid('param');

    const { installationId } = await c.env.kv.get<{ installationId: number }>(
      `${owner}/${repo}`,
      {
        type: 'json',
      },
    ) ?? { installationId: undefined };

    if (!installationId) {
      return c.json({ message: 'Not found' }, 404);
    }

    const app = new App({
      privateKey: c.env.GITHUB_PRIVATE_KEY!,
      appId: c.env.GITHUB_APP_ID!,
      webhooks: {
        secret: c.env.GITHUB_WEBHOOK_SECRET!,
      },
    });

    const octokit = await app.getInstallationOctokit(installationId);

    const { token } = await octokit.auth({
      type: 'installation',
      installationId,
    }) as { token: string };

    const getTarballResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/tarball/${ref}`,
      {
        redirect: 'manual',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Docio Dev Local',
        },
      },
    );

    if (getTarballResponse.status !== 302) {
      console.error(
        `Failed to fetch repo zip for ${owner}/${repo}. Status: ${getTarballResponse.status}`,
      );
      console.error(await getTarballResponse.text());

      return c.json({ message: 'Failed to fetch repo zip' }, 500);
    }

    const downloadUrl = getTarballResponse.headers.get('Location');

    if (!downloadUrl) {
      return c.json({ message: 'No tarball URL' }, 500);
    }

    return fetch(downloadUrl);
  },
);

export default app;
