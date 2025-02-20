import { Hono } from 'hono';
import { App } from '@octokit/app';

const app = new Hono<
  {
    Bindings: {
      GITHUB_WEBHOOK_SECRET: string;
      GITHUB_PRIVATE_KEY: string;
      GITHUB_APP_ID: string;
      reposBucket: R2Bucket;
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

  const app = new App({
    privateKey: c.env.GITHUB_PRIVATE_KEY!,
    appId: c.env.GITHUB_APP_ID!,
    webhooks: {
      secret: c.env.GITHUB_WEBHOOK_SECRET!,
    },
  });

  const octokit = await app.getInstallationOctokit(payload.installation.id);

  const { token } = await octokit.auth({
    type: 'installation',
    installationId: payload.installation.id,
  }) as { token: string };

  const repoZip = await fetch(
    `https://api.github.com/repos/${ownerLogin}/${repoName}/tarball/${
      payload.ref.replace('refs/heads/', '')
    }`,
    {
      redirect: 'follow',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Docio Dev Local',
      },
    },
  );

  if (!repoZip.ok) {
    console.error(
      `Failed to fetch repo zip for ${ownerLogin}/${repoName}. Status: ${repoZip.status}`,
    );
    console.error(await repoZip.text());

    return c.json({ message: 'Failed to fetch repo zip' }, 500);
  }

  console.log(`Status: ${repoZip.status}`);

  await c.env.reposBucket.put(`${ownerLogin}/${repoName}`, repoZip.body);

  await octokit.request('POST /repos/{owner}/{repo}/dispatches', {
    owner: ownerLogin,
    repo: repoName,
    event_type: 'build-docs',
    client_payload: {
      repo: `${ownerLogin}/${repoName}`,
    },
  });

  return c.json({});
});

app.get('/:owner/:repo', async (c) => {
  const owner = c.req.param('owner');
  const repo = c.req.param('repo');

  const object = await c.env.reposBucket.get(`${owner}/${repo}`);

  if (!object) {
    return c.json({ message: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  return new Response(object.body, {
    headers,
  });
});

export default app;
