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
        'create',
        new Command()
          .description('Create a new migration')
          .arguments('<name:string>')
          .env('DATABASE_URL=<string>', 'Postgres database URL')
          .action(async (_, name) => {
            await $`deno --env-file=../../.env -A ../../node_modules/.bin/prisma migrate dev --name ${name}`;
          }),
      )
      .command(
        'up',
        new Command()
          .description('Apply migrations')
          .env('DATABASE_URL=<string>', 'Postgres database URL')
          .option('--remote', 'Apply migrations to the remote database', {
            default: false,
          })
          .action(async ({ remote }) => {
            await $`deno --env-file=../../.env -A ../../node_modules/.bin/prisma ${
              remote ? 'migrate deploy' : ['db', 'push']
            }`;
          }),
      ),
  )
  .parse(Deno.args);
