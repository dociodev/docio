import { on } from '@docio/octo';
import { createDbClient } from '@docio/db';
import type { Env } from '@docio/env';
import type { Context } from 'hono';

export const installationDeletedHandler = on(
  'installation.deleted',
  async ({ installation }, c: Context<Env>) => {
    const db = createDbClient(c.env.db);

    const { id } = (await db.installation.findFirst({
      where: {
        installationId: installation.id,
      },
      select: {
        id: true,
      },
    })) ?? {};

    if (!id) {
      return c.json({ message: 'Installation not found' }, 404);
    }

    await db.repository.deleteMany({
      where: {
        installationId: id,
      },
    });

    await db.installation.delete({
      where: {
        id,
      },
    });
  },
);
