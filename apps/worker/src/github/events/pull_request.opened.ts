import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';

export const pullRequestOpenedHandler = on(
  'pull_request.opened',
  async (event, _c: Context<HonoEnv>) => {
    console.log(`📬 New pull request opened: ${event.pull_request.html_url}`);
    // TODO: create a new deployment for the pull request
  },
);
