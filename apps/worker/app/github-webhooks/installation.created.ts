import { on } from '@docio/octo';
import { createDbClient } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';

export const installationCreatedHandler = on(
  'installation.created',
  async ({ installation, repositories }, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    const createdInstallation = await db.installation.create({
      data: {
        installationId: installation.id,
      },
    });

    await db.repository.createMany({
      data: repositories?.map((repo) => ({
        installationId: createdInstallation.id,
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      })) ?? [],
    });
  },
);
