import { Command } from '@cliffy/command';
import { build } from './src/build.ts';
import { deploy } from './src/deploy.ts';
import { download } from './src/download.ts';

await new Command()
  .name('docio')
  .description('Docio CLI')
  .version('v0.0.0')
  .command(
    'build',
    new Command()
      .description('Build the project')
      .action(async () => {
        await build();
      }),
  )
  .command(
    'download',
    new Command()
      .description('Download the project')
      .env('WORKER_SECRET=<string>', 'Worker secret', {
        required: true,
      })
      .env('WORKER_URL=<string>', 'Worker URL', {
        required: true,
      })
      .arguments('<repo> <ref>')
      .action(async (_, repo, ref) => {
        await download(repo, ref);
      }),
  )
  .command(
    'deploy',
    new Command()
      .description('Deploy the project')
      .env('CLOUDFLARE_API_TOKEN=<string>', 'Cloudflare API token', {
        required: true,
      })
      .env('CLOUDFLARE_ACCOUNT_ID=<string>', 'Cloudflare account ID', {
        required: true,
      })
      .env('CLOUDFLARE_ZONE_ID=<string>', 'Cloudflare zone ID', {
        required: true,
      })
      .arguments('<repo> <ref> <defaultBranch>')
      .action(async (_, repo, ref, defaultBranch) => {
        await deploy(repo, ref, defaultBranch);
      }),
  )
  .parse(Deno.args);
