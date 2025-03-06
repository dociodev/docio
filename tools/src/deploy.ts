import { $ } from '@david/dax';

export async function deploy(
  repoId: number,
  ref: string,
) {
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

  await $`wrangler pages deploy --branch=${ref}`.cwd('./tmp/untar');
}
