import { Cloudflare } from 'cloudflare';
import { slugify } from './utils/slugify.ts';
import { $ } from '@david/dax';

export async function deploy(
  repo: string,
) {
  const slug = slugify(repo);

  const cloudflare = new Cloudflare({
    apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN')!,
  });

  const project = await cloudflare.pages.projects.get(slug, {
    account_id: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
  }).catch(() => null);

  if (!project) {
    await cloudflare.pages.projects.create({
      account_id: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
      name: slug,
      production_branch: 'main',
    });
  }

  await Deno.writeTextFile(
    './tmp/untar/wrangler.json',
    JSON.stringify(
      {
        name: slug,
        pages_build_output_dir: './doc_build',
      },
      null,
      2,
    ),
  );

  await $`wrangler pages deploy`.cwd('./tmp/untar');

  const domains = await cloudflare.pages.projects.domains.get(
    slug,
    `${slug}.docio.dev`,
    {
      account_id: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
    },
  ).catch(() => null);

  if (!domains) {
    await cloudflare.pages.projects.domains.create(
      slug,
      {
        name: `${slug}.docio.dev`,
        account_id: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
      },
    );
  }

  const dnsRecords = await cloudflare.dns.records.list({
    zone_id: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
    name: {
      exact: `${slug}.docio.dev`,
    },
    type: 'CNAME',
  });

  if (dnsRecords.result.length === 0) {
    await cloudflare.dns.records.create({
      zone_id: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
      content: `${slug}.pages.dev`,
      name: slug,
      proxied: true,
      type: 'CNAME',
    });
  }
}
