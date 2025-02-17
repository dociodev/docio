import { configure, tasks } from '@trigger.dev/sdk/v3';
import type { BuildDocsTask } from '@docio/trigger';
import { Hono } from 'hono';

const app = new Hono<
  { Bindings: { TRIGGER_SECRET_KEY: string; GITHUB_WEBHOOK_SECRET: string } }
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

  configure({ accessToken: c.env.TRIGGER_SECRET_KEY });

  await tasks.trigger<BuildDocsTask>('build-docs', await c.req.json());

  return c.json({});
});

export default app;
