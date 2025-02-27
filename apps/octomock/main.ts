import { $ } from '@david/dax';

export default {
  fetch() {
    main();
    return Response.json({
      message: 'OK',
    });
  },
};

async function main() {
  try {
    await Deno.mkdir('./tmp');
  } catch (error) {
    console.error(error);
  }

  await Deno.writeTextFile(
    './tmp/payload.json',
    JSON.stringify(
      {
        client_payload: {
          repo: 'docio-dev/docio',
          ref: 'main',
          defaultBranch: 'main',
        },
      },
      null,
      2,
    ),
  );

  try {
    await $`act repository_dispatch -s WORKER_SECRET=${Deno.env.get(
      'WORKER_SECRET',
    )!} -s WORKER_URL=${Deno.env.get(
      'WORKER_URL',
    )!} -s CLOUDFLARE_API_TOKEN=${Deno.env.get(
      'CLOUDFLARE_API_TOKEN',
    )!} -s CLOUDFLARE_ACCOUNT_ID=${Deno.env.get(
      'CLOUDFLARE_ACCOUNT_ID',
    )!} -s CLOUDFLARE_ZONE_ID=${Deno.env.get(
      'CLOUDFLARE_ZONE_ID',
    )!} -e ./apps/octomock/tmp/payload.json`.cwd('../..');
  } catch (error) {
    console.error(error);
  }
}
