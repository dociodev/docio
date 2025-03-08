import type { Schema } from '@octokit/webhooks-types';
import { z } from 'zod';

export interface HonoEnv {
  Variables: {
    payload: Schema;
  };
}

export const EnvSchema = z.object({
  GITHUB_APP_WEBHOOK_SECRET: z.string(),
  GITHUB_APP_PRIVATE_KEY: z.string(),
  GITHUB_APP_ID: z.string(),
  GITHUB_PERSONAL_ACCESS_TOKEN: z.string(),

  WORKER_SECRET: z.string(),
  OCTOMOCK_URL: z.string().optional(),
  WORKER_URL: z.string(),

  CLOUDFLARE_API_TOKEN: z.string(),
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  CLOUDFLARE_ZONE_ID: z.string(),

  DATABASE_URL: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env = EnvSchema.parse(Deno.env.toObject());
