import { createMiddleware } from 'hono/factory';
import { installationRepositoriesAddedHandler } from './installation-repositories.added.ts';
import { installationRepositoriesRemovedHandler } from './installation-repositories.removed.ts';
import { installationTargetRenamedHandler } from './installation-target.renamed.ts';
import { installationCreatedHandler } from './installation.created.ts';
import { installationDeletedHandler } from './installation.deleted.ts';
import { issueCommentCreatedHandler } from './issue_comment.created.ts';
import { pingHandler } from './ping.ts';
import { pullRequestClosedHandler } from './pull_request.closed.ts';
import { pullRequestOpenedHandler } from './pull_request.opened.ts';
import { pushHandler } from './push.ts';
import { repositoryPrivatizedHandler } from './repository.privatized.ts';
import { repositoryPublicizedHandler } from './repository.publicized.ts';
import { repositoryRenamedHandler } from './repository.renamed.ts';

const events = [
  installationRepositoriesAddedHandler,
  installationRepositoriesRemovedHandler,
  installationTargetRenamedHandler,
  installationCreatedHandler,
  installationDeletedHandler,
  issueCommentCreatedHandler,
  pingHandler,
  pullRequestClosedHandler,
  pullRequestOpenedHandler,
  pushHandler,
  repositoryPrivatizedHandler,
  repositoryPublicizedHandler,
  repositoryRenamedHandler,
];

export const eventMiddleware = createMiddleware(async (c, next) => {
  for (const event of events) {
    const result = await event(c);

    if (result instanceof Response) {
      return result;
    }
  }

  await next();
});
