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

app.post('/github/webhook', async (c) => {
  const signature = c.req.header('X-Hub-Signature-256');

  if (!signature) {
    return c.json({ message: 'No signature' }, 400);
  }

  const body = await c.req.raw.clone().text();

  if (!body) {
    return c.json({ message: 'No body' }, 400);
  }

  if (await signRequestBody(c.env.GITHUB_WEBHOOK_SECRET, body) !== signature) {
    return c.json({ message: 'Invalid signature' }, 400);
  }

  const eventType = c.req.header('X-GitHub-Event');

  if (eventType !== 'push') {
    return c.json({ message: 'Not a push event' });
  }

  const payload = await c.req.json();

  const repoName = payload.repository.name;
  const ownerLogin = payload.repository.owner.login;

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
    owner: 'IKatsuba',
    repo: 'docio',
    event_type: 'build-docs',
    client_payload: {
      repo: `${ownerLogin}/${repoName}`,
      ref: payload.ref.replace('refs/heads/', ''),
    },
  });

  return c.json({});
});

app.get(
  '/:owner/:repo/:ref',
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
