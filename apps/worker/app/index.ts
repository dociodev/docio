import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { App } from '@octokit/app';
import { Octokit } from '@octokit/core';
import { on } from '@docio/octo';
import { createDbClient } from '@docio/db';

const app = new Hono<{
  Bindings: {
    GITHUB_WEBHOOK_SECRET: string;
    GITHUB_PRIVATE_KEY: string;
    GITHUB_APP_ID: string;
    GITHUB_PERSONAL_ACCESS_TOKEN: string;
    WORKER_SECRET: string;
    db: D1Database;
  };
}>();

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
      await signRequestBody(c.env.GITHUB_WEBHOOK_SECRET, body) !== signature
    ) {
      return c.json({ message: 'Invalid signature' }, 400);
    }

    await next();
  },
  on('push', async ({ repository, ref }, c) => {
    const repoName = repository.name;
    const normalizedRef = ref.replace('refs/heads/', '').replace(
      'refs/tags/',
      '',
    );
    const defaultBranch = repository.default_branch;

    if (repoName !== 'docio') {
      return c.json({ message: 'Skipping non-docio repo' }, 200);
    }

    if (normalizedRef !== defaultBranch) {
      return c.json({ message: 'Skipping non-default branch' }, 200);
    }

    const personalOctokit = new Octokit({
      auth: c.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    await personalOctokit.request('POST /repos/{owner}/{repo}/dispatches', {
      owner: 'docio-dev',
      repo: 'hosting',
      event_type: 'build-docs',
      client_payload: {
        repo: repository.full_name,
        ref: normalizedRef,
        defaultBranch,
      },
    });

    return c.json({});
  }),
  on('installation.created', async ({ installation, repositories }, c) => {
    const db = createDbClient(c.env.db);

    await db.installation.create({
      data: {
        installationId: installation.id,
        repositories: {
          create: repositories?.map((repo) => ({
            githubId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
          })) ?? [],
        },
      },
    });
  }),
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

    const { installationId } = (await db.installation.findFirst({
      where: {
        repositories: {
          some: {
            fullName: `${owner}/${repo}`,
          },
        },
      },
      select: {
        installationId: true,
      },
    })) ?? { installationId: undefined };

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
