import { logger, task } from '@trigger.dev/sdk/v3';
import $ from 'dax-sh';

export const buildDocsTask = task({
  id: 'build-docs',
  maxDuration: 300,
  run: async (payload: any, { ctx }) => {
    logger.log('Hello, world!', { payload, ctx });

    await $`rm -rf ./tmp/repo`;
    await $`mkdir -p ./tmp/repo/docs`;
    await $`echo "Hello, world!" > ./tmp/repo/docs/index.md`;
    await $`npm init -y`.cwd('./tmp/repo');
    await $`npm install rspress`.cwd('./tmp/repo');
    await $`rspress build`.cwd('./tmp/repo');

    return {
      message: 'Hello, world!',
    };
  },
});

export type BuildDocsTask = typeof buildDocsTask;
