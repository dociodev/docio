import { Hono } from 'hono';
import type { Env } from '@docio/env';
import { Client, Receiver } from '@upstash/qstash';
import { createDbClient } from '@docio/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { removeRepo } from '../github/utils/remove-repo.ts';
import { createCloudflare } from '@docio/cloudflare';

export const repositoryApi = new Hono<Env>();

repositoryApi.delete(
  '/repository/:id',
  async (c, next) => {
    const receiver = new Receiver({
      currentSigningKey: c.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: c.env.QSTASH_NEXT_SIGNING_KEY,
    });

    const isValid = await receiver.verify({
      body: await c.req.raw.clone().text(),
      signature: c.req.header('Upstash-Signature')!,
    });

    if (!isValid) {
      return c.json({ message: 'Not authorized' }, 401);
    }

    await next();
  },
  zValidator(
    'param',
    z.object({
      id: z.coerce.number(),
    }),
  ),
  async (c) => {
    const { id } = c.req.valid('param');

    const db = createDbClient(c.env.db);

    const repo = await db.repository.findUnique({
      where: {
        id,
      },
      select: {
        fullName: true,
      },
    });

    if (!repo) {
      return c.json({ message: 'Repository not found' }, 404);
    }

    const cloudflare = createCloudflare(c.env.CLOUDFLARE_API_TOKEN);
    const qstash = new Client({
      token: c.env.QSTASH_TOKEN,
      baseUrl: c.env.QSTASH_URL,
    });

    await removeRepo(repo.fullName, {
      db,
      cloudflare,
      zoneId: c.env.CLOUDFLARE_ZONE_ID,
      accountId: c.env.CLOUDFLARE_ACCOUNT_ID,
      qstash,
    });
  },
);
