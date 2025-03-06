import type { PrismaClient } from '@docio/db';
import type { Cloudflare } from 'cloudflare';
import type { Client } from '@upstash/qstash';

export async function removeRepo(
  repositoryFullName: string,
  {
    db,
    cloudflare,
    zoneId,
    accountId,
    qstash,
  }: {
    db: PrismaClient;
    cloudflare: Cloudflare;
    zoneId: string;
    accountId: string;
    qstash: Client;
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
      tasks: {
        select: {
          id: true,
        },
        where: {
          status: 'PENDING',
        },
      },
    },
  });

  if (!repo) {
    return false;
  }

  const { domains, tasks } = repo;

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

  if (tasks.length > 0) {
    await qstash.dlq.deleteMany({
      dlqIds: tasks.map((task) => task.id),
    });
  }

  await db.repository.delete({
    where: {
      id: repo.id,
    },
  });
}
