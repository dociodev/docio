import { App } from '@octokit/app';
import type { Octokit } from '@octokit/core';

export function createOctoApp(appId: string, privateKey: string) {
  return new App({ privateKey, appId });
}

export function createOctokit(app: App, installationId: number) {
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
