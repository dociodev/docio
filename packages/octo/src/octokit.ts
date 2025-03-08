import { App } from '@octokit/app';
import type { Octokit } from '@octokit/core';
import { env } from '@docio/env';

export function createOctokit(installationId: number) {
  const app = new App({
    privateKey: env.GITHUB_APP_PRIVATE_KEY,
    appId: env.GITHUB_APP_ID,
  });

  return app.getInstallationOctokit(installationId);
}

export async function getOctokitToken(
  octokit: Octokit,
  installationId: number,
) {
  const { token } = await octokit.auth({
    type: 'installation',
    installationId,
  }) as { token: string };

  return token;
}
