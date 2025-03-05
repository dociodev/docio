import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const installationRepositoriesRemovedHandler = on(
  'installation_repositories.removed',
  async (event, c: Context<Env>) => {
    console.log(event);
  },
);
