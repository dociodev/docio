import { on } from '@docio/octo';
import { createDbClient } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';

// app is installed
export const installationCreatedHandler = on(
  'installation.created',
  async ({ installation, repositories }, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    await db.installation.create({
      data: {
        id: installation.id,
      },
    });

    await db.repository.createMany({
      data: repositories?.map((repo) => ({
        id: repo.id,
        installationId: installation.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      })) ?? [],
    });
  },
);
