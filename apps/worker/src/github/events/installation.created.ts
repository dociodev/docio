import { on } from '@docio/octo';
import { db, Installation } from '@docio/db';
import type { HonoEnv } from '@docio/env';
import type { Context } from 'hono';
import { addRepo } from '../utils/add-repo.ts';

// app is installed
export const installationCreatedHandler = on(
  'installation.created',
  ({ installation, repositories }, _c: Context<HonoEnv>) => {
    console.log(`📦 New installation created for ID: ${installation.id}`);

    _c.executionCtx.waitUntil(
      Promise.resolve().then(async () => {
        await db.insert(Installation).values({
          id: installation.id,
          updatedAt: new Date(),
        });

        for (const repository of repositories ?? []) {
          console.log(`➕ Adding repository: ${repository.full_name}`);
          await addRepo(repository.full_name, {
            installationId: installation.id,
          }).catch((err) => {
            console.error(
              `❌ Error adding repository: ${repository.full_name}`,
              err,
            );
          });
        }
      }),
    );
  },
);
