import { Cloudflare } from 'cloudflare';
import { env } from '@docio/env';

export const cloudflare = new Cloudflare({
  apiToken: env.CLOUDFLARE_API_TOKEN,
});
