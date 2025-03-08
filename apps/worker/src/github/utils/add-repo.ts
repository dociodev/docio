import { createDbClient, Domain, eq, Repository } from '@docio/db';
import { slugify } from '@docio/utils';
import { env } from '@docio/env';
import { createCloudflare } from '@docio/cloudflare';
import { createOctokit } from '@docio/octo';

export async function addRepo(
  repositoryFullName: string,
  {
    installationId,
  }: {
    installationId: number;
  },
) {
  const db = createDbClient();
  const cloudflare = createCloudflare();
  const octokit = await createOctokit(installationId);

  console.log(`📝 Setting up repository: ${repositoryFullName}`);

  const [owner, repo] = repositoryFullName.split('/');

  const docioDamainPrefix = slugify(
    repo === 'docio' ? owner : repositoryFullName,
  );
  const docioSubdomain = await getUniqDomain(
    docioDamainPrefix,
    installationId,
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
    account_id: env.CLOUDFLARE_ACCOUNT_ID,
    name: repoData.id.toString(),
    production_branch: repoData.default_branch,
  });

  console.log(`🌐 Creating DNS record for: ${docioSubdomain}`);
  const dnsRecord = await cloudflare.dns.records.create({
    zone_id: env.CLOUDFLARE_ZONE_ID,
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
      account_id: env.CLOUDFLARE_ACCOUNT_ID,
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
) {
  const db = createDbClient();

  const docioSubdomain = `${repositorySlug}.docio.dev`;

  const existingDomain = await db.query.Domain.findFirst({
    where: eq(Domain.name, docioSubdomain),
  });

  return existingDomain
    ? `${existingDomain.name}-${id.toString(16)}.docio.dev`
    : docioSubdomain;
}
