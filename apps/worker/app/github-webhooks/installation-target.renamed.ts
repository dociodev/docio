import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const installationTargetRenamedHandler = on(
  'installation_target.renamed',
  function (event, c: Context<Env>) {
    // TODO: update the repository names
  },
);
