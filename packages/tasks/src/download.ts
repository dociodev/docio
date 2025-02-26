import { UntarStream } from '@std/tar/untar-stream';
import { dirname, join, normalize } from '@std/path';

export async function download(
  repo: string,
  ref: string,
) {
  const response = await fetch(
    `${Deno.env.get('WORKER_URL')}/api/github/${repo}/${ref}`,
    {
      headers: {
        'X-Worker-Secret': Deno.env.get('WORKER_SECRET')!,
      },
    },
  );

  if (!response.ok) {
    console.error(response.statusText);
    Deno.exit(1);
  }

  try {
    await Deno.remove('./tmp/untar', { recursive: true });
  } catch (error) {
    console.error(error);
  }

  try {
    await Deno.remove('./tmp/docs.tar');
  } catch (error) {
    console.error(error);
  }

  try {
    await Deno.mkdir('./tmp');
  } catch (error) {
    console.error(error);
  }

  await Deno.writeFile('./tmp/docs.tar', response.body!);

  for await (
    const entry of (await Deno.open('./tmp/docs.tar'))
      .readable
      .pipeThrough(new DecompressionStream('gzip'))
      .pipeThrough(new UntarStream())
  ) {
    const paths = normalize(entry.path).split('/');
    const normalizedPath = paths.length > 1
      ? paths.slice(1).join('/')
      : paths[0];
    const path = join(Deno.cwd(), 'tmp/untar', normalizedPath);
    await Deno.mkdir(dirname(path), { recursive: true });
    await entry.readable?.pipeTo((await Deno.create(path)).writable);
  }
}
