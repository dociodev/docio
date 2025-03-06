import { $ } from '@david/dax';

export async function deploy(
  repoId: number,
  ref: string,
  deploymentId: number,
) {
  await fetch(
    `${
      Deno.env.get('WORKER_URL')
    }/api/repository/${repoId}/deployment/${deploymentId}/queued`,
    {
      method: 'POST',
      headers: {
        'X-Worker-Secret': Deno.env.get('WORKER_SECRET')!,
      },
    },
  );

  await Deno.writeTextFile(
    './tmp/untar/wrangler.json',
    JSON.stringify(
      {
        name: repoId.toString(),
        pages_build_output_dir: './doc_build',
      },
      null,
      2,
    ),
  );

  try {
    await $`wrangler pages deploy --branch=${ref}`.cwd('./tmp/untar');
    await fetch(
      `${
        Deno.env.get('WORKER_URL')
      }/api/repository/${repoId}/deployment/${deploymentId}/success`,
      {
        method: 'POST',
        headers: {
          'X-Worker-Secret': Deno.env.get('WORKER_SECRET')!,
        },
      },
    );
  } catch (error) {
    console.error(error);
    await fetch(
      `${
        Deno.env.get('WORKER_URL')
      }/api/repository/${repoId}/deployment/${deploymentId}/failure`,
      {
        method: 'POST',
        headers: {
          'X-Worker-Secret': Deno.env.get('WORKER_SECRET')!,
        },
      },
    );
  }
}
