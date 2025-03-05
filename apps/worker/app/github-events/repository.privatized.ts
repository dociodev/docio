import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const repositoryPrivatizedHandler = on(
  'repository.privatized',
  async (event, c: Context<Env>) => {
    // TODO: delete the DNS records and project on cloudflare in 1 hour
  },
);
