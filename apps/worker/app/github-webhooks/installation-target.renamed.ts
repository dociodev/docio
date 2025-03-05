import { on } from '@docio/octo';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const installationTargetRenamedHandler = on(
  'installation_target.renamed',
  function (event, _c: Context<Env>) {
    console.log(event);
  },
);
