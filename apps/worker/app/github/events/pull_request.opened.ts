import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const pullRequestOpenedHandler = on(
  'pull_request.opened',
  async (event, c: Context<Env>) => {
    console.log(`📬 New pull request opened: ${event.pull_request.html_url}`);
    // TODO: create a new deployment for the pull request
  },
);
