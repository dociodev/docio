import { on } from '@docio/octo';
import { createDbClient } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';

// app is uninstalled
export const installationDeletedHandler = on(
  'installation.deleted',
  async ({ installation }, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    await db.installation.delete({
      where: {
        id: installation.id,
      },
    });

    // TODO: remove all projects and DNS records on cloudflare
  },
);
