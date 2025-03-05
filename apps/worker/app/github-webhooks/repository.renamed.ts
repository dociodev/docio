import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const repositoryRenamedHandler = on(
  'repository.renamed',
  async (event, c: Context<Env>) => {
    console.log(event);
  },
);
