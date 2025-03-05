import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const installationRepositoriesAddedHandler = on(
  'installation_repositories.added',
  async (event, c: Context<Env>) => {
    console.log(event);
  },
);
