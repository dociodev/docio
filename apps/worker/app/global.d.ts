import type {} from 'hono';

declare module 'hono' {
  interface Env {
    Variables: {};
    Bindings: {
      GITHUB_WEBHOOK_SECRET: string;
      GITHUB_PRIVATE_KEY: string;
      GITHUB_APP_ID: string;
      GITHUB_PERSONAL_ACCESS_TOKEN: string;
      WORKER_SECRET: string;
      kv: KVNamespace;
      db: D1Database;
    };
  }
}
