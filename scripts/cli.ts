import { Command } from '@cliffy/command';
import { build } from './build.ts';
import { deploy } from './deploy.ts';

await new Command()
  .name('docio')
  .description('Docio CLI')
  .version('v0.0.0')
  .command('build', 'Build the project')
  .arguments('<repo> <ref> <installationId>')
  .action(async (_, repo, ref, installationId) => {
    await build(repo, ref, installationId);
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
  .arguments('<repo>')
  .action(async (_, repo) => {
    await deploy(repo);
  })
  .parse(Deno.args);
