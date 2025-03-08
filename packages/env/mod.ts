import type { Schema } from '@octokit/webhooks-types';

export interface HonoEnv {
  // Bindings: {
  // GITHUB_APP_WEBHOOK_SECRET: string;
  // GITHUB_APP_PRIVATE_KEY: string;
  // GITHUB_APP_ID: string;
  // GITHUB_PERSONAL_ACCESS_TOKEN: string;

  // WORKER_SECRET: string;
  // OCTOMOCK_URL?: string;
  // WORKER_URL: string;

  // CLOUDFLARE_API_TOKEN: string;
  // CLOUDFLARE_ACCOUNT_ID: string;
  // CLOUDFLARE_ZONE_ID: string;

  // QSTASH_URL: string;
  // QSTASH_TOKEN: string;
  // QSTASH_CURRENT_SIGNING_KEY: string;
  // QSTASH_NEXT_SIGNING_KEY: string;

  // db: D1Database;
  // };
  Variables: {
    payload: Schema;
  };
}
