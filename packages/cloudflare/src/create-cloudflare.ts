import { Cloudflare } from 'cloudflare';
import { env } from '@docio/env';

export function createCloudflare() {
  return new Cloudflare({ apiToken: env.CLOUDFLARE_API_TOKEN });
}
