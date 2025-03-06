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
      .arguments('<fullName> <ref>')
      .action(async (_, fullName, ref) => {
        await download(fullName, ref);
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
      .env('WORKER_SECRET=<string>', 'Worker secret', {
        required: true,
      })
      .env('WORKER_URL=<string>', 'Worker URL', {
        required: true,
      })
      .arguments('<repoId:number> <ref> <deploymentId:number>')
      .action(async (_, repoId, ref, deploymentId) => {
        await deploy(repoId, ref, deploymentId);
      }),
  )
  .parse(Deno.args);
