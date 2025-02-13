import { configure, tasks } from '@trigger.dev/sdk/v3';
import type { BuildDocsTask } from '@docio/trigger';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: { TRIGGER_SECRET_KEY: string } }>();

app.post('/github/webhook', async (c) => {
  configure({ accessToken: c.env.TRIGGER_SECRET_KEY });

  await tasks.trigger<BuildDocsTask>('build-docs', {
    payload: {
      message: 'Hello, world!',
    },
  });

  return c.json({ message: 'Hello, world!' });
});

export default app;
