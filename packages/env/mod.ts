import type { Schema } from '@octokit/webhooks-types';

export interface Env {
  Bindings: {
    GITHUB_APP_WEBHOOK_SECRET: string;
    GITHUB_APP_PRIVATE_KEY: string;
    GITHUB_APP_ID: string;
    GITHUB_PERSONAL_ACCESS_TOKEN: string;
    WORKER_SECRET: string;
    OCTOMOCK_URL?: string;
    db: D1Database;
  };
  Variables: {
    payload: Schema;
  };
}
