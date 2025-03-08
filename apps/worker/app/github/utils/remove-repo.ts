import { type DbClient, eq, Repository, Task } from '@docio/db';
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
    db: DbClient;
    cloudflare: Cloudflare;
    zoneId: string;
    accountId: string;
    qstash: Client;
  },
) {
  console.log(
    `🗑️ Starting removal process for repository: ${repositoryFullName}`,
  );

  const repo = await db.query.Repository.findFirst({
    where: eq(Repository.fullName, repositoryFullName),
    columns: {
      id: true,
    },
    with: {
      domains: {
        columns: {
          isDocioDomain: true,
          dnsRecordId: true,
        },
      },
      tasks: {
        columns: {
          id: true,
        },
        where: eq(Task.status, 'PENDING'),
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
    console.log(`🌐 Removing DNS record: ${domain.dnsRecordId}`);
    await cloudflare.dns.records.delete(domain.dnsRecordId, {
      zone_id: zoneId,
    });
  }

  const cloudflareDomainsResponse = await cloudflare.pages.projects.domains
    .list(
      repo.id.toString(),
      {
        account_id: accountId,
      },
    );

  for await (const domainPage of cloudflareDomainsResponse.iterPages()) {
    for (const domain of domainPage.result) {
      console.log(`🌐 Removing domain: ${domain.name}`);
      await cloudflare.pages.projects.domains.delete(
        repo.id.toString(),
        domain.id!,
        {
          account_id: accountId,
        },
      );
    }
  }

  console.log(`🔧 Removing Cloudflare Pages project for repo ID: ${repo.id}`);
  await cloudflare.pages.projects.delete(repo.id.toString(), {
    account_id: accountId,
  });

  if (tasks.length > 0) {
    console.log(`🧹 Cleaning up ${tasks.length} pending tasks`);
    await qstash.dlq.deleteMany({
      dlqIds: tasks.map((task) => task.id),
    });
  }

  await db.delete(Repository).where(eq(Repository.id, repo.id));
}
