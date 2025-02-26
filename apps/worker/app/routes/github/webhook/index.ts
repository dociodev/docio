import { Hono } from 'hono';
import { Octokit } from '@octokit/core';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

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
  '/',
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

export default app;
