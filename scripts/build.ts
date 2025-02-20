import { $ } from '@david/dax';

export async function build() {
  await $`rspress build`.cwd('./tmp/untar');
}
