import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '@docio/env';
import { createDbClient } from '@docio/db';
import { pushHandler } from './github-events/push.ts';
import { installationCreatedHandler } from './github-events/installation.created.ts';
import { pingHandler } from './github-events/ping.ts';
import { createOctoApp, createOctokit, getOctokitToken } from '@docio/octo';

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
    const { 'X-Hub-Signature-256': signature } = c.req.valid('header');

    const body = await c.req.raw.clone().text();

    if (!body) {
      return c.json({ message: 'No body' }, 400);
    }

    if (
      await signRequestBody(c.env.GITHUB_APP_WEBHOOK_SECRET, body) !== signature
    ) {
      return c.json({ message: 'Invalid signature' }, 400);
    }

    await next();
  },
  pingHandler,
  pushHandler,
  installationCreatedHandler,
  // installationDeletedHandler,
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

    const db = createDbClient(c.env.db);

    const repository = await db.repository.findFirst({
      where: {
        fullName: `${owner}/${repo}`,
      },
      select: {
        installation: true,
      },
    });

    if (!repository || !repository.installation) {
      console.error(
        `Repository ${owner}/${repo} not found or has no installation ID`,
      );
      return c.json({ message: 'Not found' }, 404);
    }

    const app = createOctoApp(
      c.env.GITHUB_APP_ID!,
      c.env.GITHUB_APP_PRIVATE_KEY!,
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

export default app;
