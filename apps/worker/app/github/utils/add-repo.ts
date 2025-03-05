import type { Octokit } from '@octokit/core';
import type { PrismaClient } from '@docio/db';
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
    db: PrismaClient;
    cloudflare: Cloudflare;
    accountId: string;
    zoneId: string;
  },
) {
  const [owner, repo] = repositoryFullName.split('/');

  const docioSubdomain = slugify(
    repo === 'docio' ? owner : repositoryFullName,
  );

  const { data: repoData } = await octokit.request(
    'GET /repos/{owner}/{repo}',
    {
      owner,
      repo,
    },
  );

  await db.repository.create({
    data: {
      id: repoData.id,
      installationId: installationId,
      name: repoData.name,
      fullName: repoData.full_name,
      private: repoData.private,
      defaultBranch: repoData.default_branch,
    },
  });

  const project = await cloudflare.pages.projects.create({
    account_id: accountId,
    name: repoData.id.toString(),
    production_branch: repoData.default_branch,
  });

  const dnsRecord = await cloudflare.dns.records.create({
    zone_id: zoneId,
    content: `${docioSubdomain}.docio.dev`,
    name: project.subdomain,
    proxied: true,
    type: 'CNAME',
  });

  const doamin = await cloudflare.pages.projects.domains.create(
    repoData.id.toString(),
    {
      name: `${docioSubdomain}.docio.dev`,
      account_id: accountId,
    },
  );

  if (!doamin) {
    throw new Error('Failed to create domain');
  }

  await db.domain.create({
    data: {
      id: doamin.id!,
      name: doamin.name!,
      isDocioDomain: true,
      dnsRecordId: dnsRecord.id!,
      repositoryId: repoData.id,
      isVerified: true,
    },
  });
}
