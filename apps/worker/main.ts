import { Hono } from 'hono';
import { App } from '@octokit/app';
import { Octokit } from '@octokit/core';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono<
  {
    Bindings: {
      GITHUB_WEBHOOK_SECRET: string;
      GITHUB_PRIVATE_KEY: string;
      GITHUB_APP_ID: string;
      GITHUB_PERSONAL_ACCESS_TOKEN: string;
      WORKER_SECRET: string;
      kv: KVNamespace;
    };
  }
>();

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
  '/github/webhook',
  zValidator(
    'header',
    z.object({
      'X-Hub-Signature-256': z.string(),
      'X-GitHub-Event': z.enum(['push', 'installation']),
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
  zValidator(
    'json',
    z.object({
      repository: z.object({
        name: z.string(),
        owner: z.object({ login: z.string() }),
        default_branch: z.string(),
      }),
      ref: z.string(),
      installation: z.object({ id: z.number() }),
    }),
  ),
  async (c) => {
    const payload = c.req.valid('json');

    const repoName = payload.repository.name;
    const ownerLogin = payload.repository.owner.login;
    const ref = payload.ref.replace('refs/heads/', '').replace(
      'refs/tags/',
      '',
    );
    const defaultBranch = payload.repository.default_branch;

    if (repoName !== 'docio') {
      return c.json({ message: 'Skipping non-docio repo' }, 200);
    }

    if (ref !== defaultBranch) {
      return c.json({ message: 'Skipping non-default branch' }, 200);
    }

    await c.env.kv.put(
      `${ownerLogin}/${repoName}`,
      JSON.stringify({
        installationId: payload.installation.id,
      }),
    );

    const personalOctokit = new Octokit({
      auth: c.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    await personalOctokit.request('POST /repos/{owner}/{repo}/dispatches', {
      owner: 'docio-dev',
      repo: 'hosting',
      event_type: 'build-docs',
      client_payload: {
        repo: `${ownerLogin}/${repoName}`,
        ref,
        defaultBranch,
      },
    });

    return c.json({});
  },
);

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
