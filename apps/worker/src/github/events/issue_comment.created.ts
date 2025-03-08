import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { HonoEnv } from '@docio/env';

export const issueCommentCreatedHandler = on(
  'issue_comment.created',
  async (event, _c: Context<HonoEnv>) => {
    console.log(event);
  },
);
