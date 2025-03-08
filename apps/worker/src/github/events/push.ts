import { createOctokit, on } from '@docio/octo';
import { Octokit } from '@octokit/core';
import type { Context } from 'hono';
import { env, type HonoEnv } from '@docio/env';
import { db, eq, Repository } from '@docio/db';

export const pushHandler = on(
  'push',
  ({ repository, ref }, c: Context<HonoEnv>) => {
    console.log(`📥 Push event received for ${repository.full_name}@${ref}`);

    const repoName = repository.name;
    const normalizedRef = ref.replace('refs/heads/', '').replace(
      'refs/tags/',
      '',
    );
    const defaultBranch = repository.default_branch;

    if (repoName !== 'docio' && repository.full_name !== 'dociodev/local') {
      console.log(`⏭️ Skipping non-docio repo: ${repoName}`);
      return c.json({ message: 'Skipping non-docio repo' }, 200);
    }

    if (normalizedRef !== defaultBranch) {
      console.log(`⏭️ Skipping non-default branch: ${normalizedRef}`);
      return c.json({ message: 'Skipping non-default branch' }, 200);
    }

    c.executionCtx.waitUntil(
      Promise.resolve().then(async () => {
        const { installation } = (await db.query.Repository.findFirst({
          where: eq(Repository.id, repository.id),
          with: {
            installation: {
              columns: {
                id: true,
              },
            },
          },
        })) ?? {};

        if (!installation) {
          console.log(`⏭️ Skipping non-docio repo: ${repoName}`);
          return c.json({ message: 'Skipping non-docio repo' }, 200);
        }

        const [owner, repo] = repository.full_name.split('/');

        const octokit = await createOctokit(installation.id);

        const deployment = await octokit.request(
          'POST /repos/{owner}/{repo}/deployments',
          {
            owner,
            repo,
            ref: normalizedRef,
            auto_merge: false,
            environment: normalizedRef === defaultBranch
              ? 'production'
              : 'staging',
          },
        );

        if (deployment.status !== 201) {
          console.log(`⏭️ Failed to create deployment: ${deployment.status}`);
          return c.json({ message: 'Failed to create deployment' }, 200);
        }

        const deploymentId = deployment.data.id;

        await octokit.request(
          'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
          {
            owner,
            repo,
            deployment_id: deploymentId,
            state: 'queued',
          },
        );

        const personalOctokit = new Octokit({
          auth: env.GITHUB_PERSONAL_ACCESS_TOKEN,
          baseUrl: env.OCTOMOCK_URL || undefined,
        });

        console.log(`🚀 Triggering build-docs workflow`);
        await personalOctokit.request('POST /repos/{owner}/{repo}/dispatches', {
          owner: 'dociodev',
          repo: 'hosting',
          event_type: 'build-docs',
          client_payload: {
            id: repository.id,
            fullName: repository.full_name,
            ref: normalizedRef,
            deploymentId,
          },
        });
      }),
    );
  },
);
