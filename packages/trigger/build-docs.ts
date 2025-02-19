import { logger, task } from '@trigger.dev/sdk/v3';
import $ from 'dax-sh';
import { App } from '@octokit/app';
import process from 'node:process';
import asyncfs from 'node:fs/promises';
import fs from 'node:fs';
import { Cloudflare } from 'cloudflare';

const app = new App({
  privateKey: await asyncfs.readFile(
    process.env.GITHUB_PRIVATE_KEY_PATH!,
    'utf8',
  ),
  appId: process.env.GITHUB_APP_ID!,
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
});

const cloudflare = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
});

export const buildDocsTask = task({
  id: 'build-docs',
  maxDuration: 300,
  run: async (payload: any, { ctx }) => {
    const repoName = payload.repository.name;
    const ownerLogin = payload.repository.owner.login;

    await cleanUp();

    const octokit = await app.getInstallationOctokit(payload.installation.id);

    const { token } = await octokit.auth({
      type: 'installation',
      installationId: payload.installation.id,
    }) as { token: string };

    await getFiles(ownerLogin, repoName, token);

    const buildSuccess = await buildDocs();

    if (!buildSuccess) {
      return {
        success: false,
      };
    }

    await createPageProjectIfNotExists(ownerLogin, repoName);

    await deploy(ownerLogin, repoName);

    await addCustomDomainIfNotExists(ownerLogin, repoName);
    await createDnsRecordIfNotExists(ownerLogin, repoName);

    return {
      success: true,
    };
  },
});

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[\/:]/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^[^a-z]+/, '');
}

async function createDnsRecordIfNotExists(
  ownerLogin: string,
  repoName: string,
) {
  return await logger.trace('Creating DNS record', async () => {
    const domains = await cloudflare.dns.records.list({
      zone_id: process.env.CLOUDFLARE_ZONE_ID!,
      name: {
        exact: `${slugify(`${ownerLogin}/${repoName}`)}.docio.dev`,
      },
      type: 'CNAME',
    });

    logger.info('Domains', { domains: domains.result });

    if (domains.result.length === 0) {
      await cloudflare.dns.records.create({
        zone_id: process.env.CLOUDFLARE_ZONE_ID!,
        content: `${slugify(`${ownerLogin}/${repoName}`)}.pages.dev`,
        name: `${slugify(`${ownerLogin}/${repoName}`)}`,
        proxied: true,
        type: 'CNAME',
      });
    }
  });
}

async function addCustomDomainIfNotExists(
  ownerLogin: string,
  repoName: string,
) {
  return await logger.trace('Adding custom domain', async () => {
    const domains = await cloudflare.pages.projects.domains.get(
      slugify(`${ownerLogin}/${repoName}`),
      `${slugify(`${ownerLogin}/${repoName}`)}.docio.dev`,
      {
        account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
      },
    ).catch((error) => {
      logger.error('Error getting domains', { error });
      return null;
    });

    logger.info('Domains', { domains });

    if (domains) {
      return;
    }

    await cloudflare.pages.projects.domains.create(
      slugify(`${ownerLogin}/${repoName}`),
      {
        name: `${slugify(`${ownerLogin}/${repoName}`)}.docio.dev`,
        account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
      },
    );
  });
}

async function cleanUp() {
  await logger.trace('Cleaning up', async () => {
    await $`rm -rf ./tmp/repo`;
  });
}

async function getFiles(
  ownerLogin: string,
  repoName: string,
  token: string,
) {
  return await logger.trace('Cloning repository', async () => {
    const repoUrl =
      `https://${token}:x-oauth-basic@github.com/${ownerLogin}/${repoName}.git`;
    await $`git clone ${repoUrl} ./tmp/repo`;
    await $`rm -rf ./tmp/repo/.git`;
  });
}

async function buildDocs() {
  return await logger.trace('Building docs', async () => {
    try {
      fs.writeFileSync(
        './tmp/repo/run.ts',
        `import config from "./rspress.config.ts";

console.log(config);
`,
      );

      const result = await $`deno run ./run.ts`.cwd('./tmp/repo').text();

      fs.writeFileSync(
        './tmp/repo/rspress.config.ts',
        `export default ${JSON.stringify(JSON.parse(result), null, 2)};`,
      );

      await $`rspress build`.cwd('./tmp/repo');

      return fs.existsSync('./tmp/repo/doc_build');
    } catch (error) {
      logger.error('Error building docs', { error });
      return false;
    }
  });
}

async function createPageProjectIfNotExists(
  ownerLogin: string,
  repoName: string,
) {
  await logger.trace('Creating page project', async () => {
    const project = await cloudflare.pages.projects.get(
      slugify(`${ownerLogin}/${repoName}`),
      {
        account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
      },
    ).catch((error) => {
      logger.error('Error getting project', { error });
      return null;
    });

    if (project) {
      return;
    }

    await cloudflare.pages.projects.create({
      account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
      name: slugify(`${ownerLogin}/${repoName}`),
      production_branch: 'main',
    });
  });
}

async function deploy(ownerLogin: string, repoName: string) {
  await logger.trace('Deploying docs', async () => {
    await asyncfs.writeFile(
      './tmp/repo/wrangler.json',
      JSON.stringify(
        {
          name: slugify(`${ownerLogin}/${repoName}`),
          pages_build_output_dir: './doc_build',
        },
        null,
        2,
      ),
    );
    await $`wrangler pages deploy`.cwd('./tmp/repo');
  });
}

export type BuildDocsTask = typeof buildDocsTask;
