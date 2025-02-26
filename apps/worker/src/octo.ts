import { Composer, Context } from '@octojs/app';

export const app = new Composer();

app.on('push', async (ctx, next) => {
  await next();
});
