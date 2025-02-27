import { Command } from '@cliffy/command';
import { $ } from '@david/dax';

await new Command()
  .name('db')
  .version('v0.0.0')
  .description('Manage database')
  .command(
    'client',
    new Command()
      .description('Manage db client')
      .command(
        'generate',
        new Command()
          .description('Generate a db client')
          .action(async () => {
            await $`node ../../node_modules/.bin/prisma generate`;
          }),
      ),
  )
  .command(
    'migrations',
    new Command()
      .description('Manage migrations')
      .command(
        'generate',
        new Command()
          .description('Generate a new migration')
          .arguments('<name:string>')
          .action(async (_, name) => {
            await $`node ../../node_modules/.bin/wrangler d1 migrations create docio-db ${name}`
              .cwd('../../apps/worker');

            const migrations = (await Array.fromAsync(
              Deno.readDir('./migrations'),
            )).filter((file) => file.isFile && file.name.endsWith('.sql')).sort(
              (
                a,
                b,
              ) => a.name.localeCompare(b.name),
            );

            const migration = migrations.at(-1);

            if (!migration) {
              throw new Error('No migration found');
            }

            await $`node ../../node_modules/.bin/prisma migrate diff --from-local-d1 --to-schema-datamodel ../../packages/db/prisma/schema.prisma --script --output ../../packages/db/migrations/${migration.name}`
              .cwd('../../apps/worker');
          }),
      )
      .command(
        'up',
        new Command()
          .description('Apply migrations')
          .option('--remote', 'Apply migrations to the remote database', {
            default: false,
          })
          .action(async ({ remote }) => {
            await $`node ../../node_modules/.bin/wrangler d1 migrations apply docio-db ${
              remote ? '--remote' : '--local'
            }`
              .cwd('../../apps/worker');
          }),
      ),
  )
  .parse(Deno.args);
