import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const pullRequestOpenedHandler = on(
  'pull_request.opened',
  async (event, c: Context<Env>) => {
    console.log(event);
  },
);
