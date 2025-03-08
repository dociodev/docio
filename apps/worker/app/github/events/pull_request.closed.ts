import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';

export const pullRequestClosedHandler = on(
  'pull_request.closed',
  async (event, _c: Context<HonoEnv>) => {
    console.log(`🔒 Pull request closed: ${event.pull_request.html_url}`);
    // TODO: delete the deployment for the pull request
  },
);
