import { Cloudflare } from 'cloudflare';

export function createCloudflare(apiToken: string) {
  return new Cloudflare({ apiToken });
}
