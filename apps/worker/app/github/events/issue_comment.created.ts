import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const issueCommentCreatedHandler = on(
  'issue_comment.created',
  async (event, _c: Context<Env>) => {
    console.log(event);
  },
);
