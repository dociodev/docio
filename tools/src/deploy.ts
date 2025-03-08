import { $ } from '@david/dax';
import { env } from '@docio/env';

export async function deploy(
  repoId: number,
  ref: string,
  deploymentId: number,
) {
  await fetch(
    `${env.WORKER_URL}/api/repository/${repoId}/deployment/${deploymentId}/in_progress`,
    {
      method: 'POST',
      headers: {
        'X-Worker-Secret': env.WORKER_SECRET,
      },
    },
  );

  const docioJson = await Deno.readTextFile('./tmp/untar/docio.json');
  const docioConfig = JSON.parse(docioJson);
  const outDir = docioConfig.outDir ?? './doc_build';

  await Deno.writeTextFile(
    './tmp/untar/wrangler.json',
    JSON.stringify(
      {
        name: repoId.toString(),
        pages_build_output_dir: outDir,
      },
      null,
      2,
    ),
  );

  try {
    await $`wrangler pages deploy --branch=${ref}`.cwd('./tmp/untar');
    await fetch(
      `${env.WORKER_URL}/api/repository/${repoId}/deployment/${deploymentId}/success`,
      {
        method: 'POST',
        headers: {
          'X-Worker-Secret': env.WORKER_SECRET,
        },
      },
    );
  } catch (error) {
    console.error(error);
    await fetch(
      `${env.WORKER_URL}/api/repository/${repoId}/deployment/${deploymentId}/failure`,
      {
        method: 'POST',
        headers: {
          'X-Worker-Secret': env.WORKER_SECRET,
        },
      },
    );
  }
}
