import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '@docio/env';
import { createDbClient, eq, Repository } from '@docio/db';
import { createOctoApp, createOctokit, getOctokitToken } from '@docio/octo';
import { repositoryApi } from './api/repository.ts';
import { eventMiddleware } from './github/events/index.ts';

const app = new Hono<Env>();

async function signRequestBody(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return 'sha256=' +
    Array.from(new Uint8Array(signature)).map((b) =>
      b.toString(16).padStart(2, '0')
    ).join('');
}

app.post(
  '/api/github/webhook',
  zValidator(
    'header',
    z.object({
      'X-Hub-Signature-256': z.string(),
      'X-GitHub-Event': z.string(),
    }),
  ),
  async (c, next) => {
    const { 'X-Hub-Signature-256': signature, 'X-GitHub-Event': event } = c.req
      .valid('header');
    console.log(`📨 Received GitHub webhook: ${event}`);

    const body = await c.req.raw.clone().text();

    if (!body) {
      return c.json({ message: 'No body' }, 400);
    }

    if (
      await signRequestBody(
        Deno.env.get('GITHUB_APP_WEBHOOK_SECRET')!,
        body,
      ) !== signature
    ) {
      return c.json({ message: 'Invalid signature' }, 400);
    }

    await next();
  },
  eventMiddleware,
  (c) => c.json({}),
);

app.get(
  '/api/github/:owner/:repo/:ref',
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
      owner: z.string(),
      repo: z.string(),
      ref: z.string(),
    }),
  ),
  async (c) => {
    const { owner, repo, ref } = c.req.valid('param');
    console.log(`📦 Fetching repository content: ${owner}/${repo}@${ref}`);

    const db = createDbClient();

    const repository = await db.query.Repository.findFirst({
      where: eq(Repository.fullName, `${owner}/${repo}`),
      with: {
        installation: {
          columns: {
            id: true,
          },
        },
      },
    });

    if (!repository || !repository.installation) {
      console.error(
        `Repository ${owner}/${repo} not found or has no installation ID`,
      );
      return c.json({ message: 'Not found' }, 404);
    }

    const app = createOctoApp(
      Deno.env.get('GITHUB_APP_ID')!,
      Deno.env.get('GITHUB_APP_PRIVATE_KEY')!,
    );
    const octokit = await createOctokit(app, repository.installation.id);
    const token = await getOctokitToken(octokit, repository.installation.id);

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

app.route('/api', repositoryApi);

export default app;
