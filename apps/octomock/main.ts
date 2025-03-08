import { $ } from '@david/dax';
import { env } from '@docio/env';

export default {
  async fetch(request: Request) {
    try {
      await Deno.mkdir('./tmp');
    } catch (error) {
      console.error(error);
    }

    await Deno.writeTextFile(
      './tmp/payload.json',
      JSON.stringify(
        await request.json(),
        null,
        2,
      ),
    );

    main();
    return Response.json({
      message: 'OK',
    });
  },
};

async function main() {
  try {
    await $`act repository_dispatch -s WORKER_SECRET=${env.WORKER_SECRET} -s WORKER_URL=${env
      .WORKER_URL!} -s CLOUDFLARE_API_TOKEN=${env.CLOUDFLARE_API_TOKEN} -s CLOUDFLARE_ACCOUNT_ID=${env.CLOUDFLARE_ACCOUNT_ID} -s CLOUDFLARE_ZONE_ID=${env.CLOUDFLARE_ZONE_ID} -e ./apps/octomock/tmp/payload.json`
      .cwd('../..');
  } catch (error) {
    console.error(error);
  }
}
