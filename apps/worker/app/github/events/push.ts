import { on } from '@docio/octo';
import { Octokit } from '@octokit/core';
import type { Context } from 'hono';
import type { Env } from '@docio/env';

export const pushHandler = on(
  'push',
  async ({ repository, ref }, c: Context<Env>) => {
    console.log(`📥 Push event received for ${repository.full_name}@${ref}`);

    const repoName = repository.name;
    const normalizedRef = ref.replace('refs/heads/', '').replace(
      'refs/tags/',
      '',
    );
    const defaultBranch = repository.default_branch;

    if (repoName !== 'docio') {
      console.log(`⏭️ Skipping non-docio repo: ${repoName}`);
      return c.json({ message: 'Skipping non-docio repo' }, 200);
    }

    if (normalizedRef !== defaultBranch) {
      console.log(`⏭️ Skipping non-default branch: ${normalizedRef}`);
      return c.json({ message: 'Skipping non-default branch' }, 200);
    }

    const personalOctokit = new Octokit({
      auth: c.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      baseUrl: c.env.OCTOMOCK_URL || undefined,
    });

    console.log(`🚀 Triggering build-docs workflow`);
    await personalOctokit.request('POST /repos/{owner}/{repo}/dispatches', {
      owner: 'docio-dev',
      repo: 'hosting',
      event_type: 'build-docs',
      client_payload: {
        id: repository.id,
        fullName: repository.full_name,
        ref: normalizedRef,
      },
    });

    return c.json({});
  },
);
