import { Cloudflare } from 'cloudflare';
import { slugify } from '@docio/utils';
import { $ } from '@david/dax';

export async function deploy(
  repo: string,
  ref: string,
  defaultBranch: string,
) {
  const slug = slugify(`${repo}/${ref}`);

  const subdomainSlug = slugify(
    (repo.endsWith('/docio') ? repo.replace('/docio', '') : repo) +
      (ref === defaultBranch ? '' : `-${ref}`),
  );

  const cloudflare = new Cloudflare({
    apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN')!,
  });

  const project = await cloudflare.pages.projects.get(slug, {
    account_id: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
  }).catch(() => null);

  console.log(project);

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
    `${subdomainSlug}.docio.dev`,
    {
      account_id: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
    },
  ).catch(() => null);

  if (!domains) {
    await cloudflare.pages.projects.domains.create(
      slug,
      {
        name: `${subdomainSlug}.docio.dev`,
        account_id: Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!,
      },
    );
  }

  const dnsRecords = await cloudflare.dns.records.list({
    zone_id: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
    name: {
      exact: `${subdomainSlug}.docio.dev`,
    },
    type: 'CNAME',
  });

  if (dnsRecords.result.length === 0) {
    await cloudflare.dns.records.create({
      zone_id: Deno.env.get('CLOUDFLARE_ZONE_ID')!,
      content: `${slug}.pages.dev`,
      name: subdomainSlug,
      proxied: true,
      type: 'CNAME',
    });
  }
}
