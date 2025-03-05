import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const pullRequestClosedHandler = on(
  'pull_request.closed',
  async (event, c: Context<Env>) => {
    // TODO: delete the deployment for the pull request
  },
);
