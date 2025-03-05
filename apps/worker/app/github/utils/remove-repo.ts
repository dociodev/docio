import type { PrismaClient } from '@docio/db';
import type { Cloudflare } from 'cloudflare';

export async function removeRepo(
  repositoryFullName: string,
  {
    db,
    cloudflare,
    zoneId,
    accountId,
  }: {
    db: PrismaClient;
    cloudflare: Cloudflare;
    zoneId: string;
    accountId: string;
  },
) {
  const repo = await db.repository.findFirst({
    where: {
      fullName: repositoryFullName,
    },
    select: {
      id: true,
      domains: {
        where: {
          isDocioDomain: true,
        },
      },
    },
  });

  if (!repo) {
    return false;
  }

  const { domains } = repo;

  for (const domain of domains) {
    if (!domain.dnsRecordId) {
      continue;
    }

    await cloudflare.dns.records.delete(domain.dnsRecordId, {
      zone_id: zoneId,
    });
  }

  await cloudflare.pages.projects.delete(repo.id.toString(), {
    account_id: accountId,
  });

  await db.repository.delete({
    where: {
      id: repo.id,
    },
  });
}
