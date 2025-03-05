import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const repositoryPublicizedHandler = on(
  'repository.publicized',
  async (event, c: Context<Env>) => {
    // TODO: create a new project on cloudflare
  },
);
