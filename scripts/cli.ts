import { Command } from '@cliffy/command';
import { build } from './build.ts';
import { deploy } from './deploy.ts';
import { download } from './download.ts';

await new Command()
  .name('docio')
  .description('Docio CLI')
  .version('v0.0.0')
  .command('build', 'Build the project')
  .env('WORKER_SECRET=<string>', 'Worker secret', {
    required: true,
  })
  .env('WORKER_URL=<string>', 'Worker URL', {
    required: true,
  })
  .action(async () => {
    await build();
  })
  .command('download', 'Download the project')
  .arguments('<repo> <ref>')
  .action(async (_, repo, ref) => {
    await download(repo, ref);
  })
  .command('deploy', 'Deploy the project')
  .env('CLOUDFLARE_API_TOKEN=<string>', 'Cloudflare API token', {
    required: true,
  })
  .env('CLOUDFLARE_ACCOUNT_ID=<string>', 'Cloudflare account ID', {
    required: true,
  })
  .env('CLOUDFLARE_ZONE_ID=<string>', 'Cloudflare zone ID', {
    required: true,
  })
  .arguments('<repo> <ref>')
  .action(async (_, repo, ref) => {
    await deploy(repo, ref);
  })
  .parse(Deno.args);
