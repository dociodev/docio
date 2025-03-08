import type { Octokit } from '@octokit/core';
import { type DbClient, Domain, eq, Repository } from '@docio/db';
import { slugify } from '@docio/utils';
import type { Cloudflare } from 'cloudflare';

export async function addRepo(
  repositoryFullName: string,
  {
    installationId,
    octokit,
    db,
    cloudflare,
    accountId,
    zoneId,
  }: {
    installationId: number;
    octokit: Octokit;
    db: DbClient;
    cloudflare: Cloudflare;
    accountId: string;
    zoneId: string;
  },
) {
  console.log(`📝 Setting up repository: ${repositoryFullName}`);

  const [owner, repo] = repositoryFullName.split('/');

  const docioDamainPrefix = slugify(
    repo === 'docio' ? owner : repositoryFullName,
  );
  const docioSubdomain = await getUniqDomain(
    docioDamainPrefix,
    installationId,
    { db },
  );

  const { data: repoData } = await octokit.request(
    'GET /repos/{owner}/{repo}',
    {
      owner,
      repo,
    },
  );

  await db.insert(Repository).values({
    id: repoData.id,
    installationId: installationId,
    name: repoData.name,
    fullName: repoData.full_name,
    private: repoData.private,
    defaultBranch: repoData.default_branch,
    updatedAt: new Date(),
  });

  console.log(
    `🔧 Creating Cloudflare Pages project for repo ID: ${repoData.id}`,
  );
  const project = await cloudflare.pages.projects.create({
    account_id: accountId,
    name: repoData.id.toString(),
    production_branch: repoData.default_branch,
  });

  console.log(`🌐 Creating DNS record for: ${docioSubdomain}`);
  const dnsRecord = await cloudflare.dns.records.create({
    zone_id: zoneId,
    content: project.subdomain,
    name: docioSubdomain,
    proxied: true,
    type: 'CNAME',
  });

  console.log(`🔗 Setting up custom domain: ${docioSubdomain}`);
  const domain = await cloudflare.pages.projects.domains.create(
    repoData.id.toString(),
    {
      name: docioSubdomain,
      account_id: accountId,
    },
  );

  if (!domain) {
    throw new Error('Failed to create domain');
  }

  await db.insert(Domain).values({
    id: domain.id!,
    name: domain.name!,
    isDocioDomain: true,
    dnsRecordId: dnsRecord.id!,
    repositoryId: repoData.id,
    isVerified: true,
    updatedAt: new Date(),
  });
}

async function getUniqDomain(
  repositorySlug: string,
  id: number,
  { db }: { db: DbClient },
) {
  const docioSubdomain = `${repositorySlug}.docio.dev`;

  const existingDomain = await db.query.Domain.findFirst({
    where: eq(Domain.name, docioSubdomain),
  });

  return existingDomain
    ? `${existingDomain.name}-${id.toString(16)}.docio.dev`
    : docioSubdomain;
}
