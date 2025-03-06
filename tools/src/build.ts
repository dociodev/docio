import { $ } from '@david/dax';

export async function build() {
  await $`rspress build -c docio.json`.cwd('./tmp/untar');
}
