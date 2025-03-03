import type {
  WebhookEventMap,
  WebhookEventName,
} from '@octokit/webhooks-types';
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';

export type EventAction<T extends WebhookEventName> = 'action' extends
  keyof WebhookEventMap[T] ? WebhookEventMap[T]['action'] : never;

export type Query<K extends string = string> = K extends `${infer Q}.${infer R}`
  ? Q extends WebhookEventName ? R extends EventAction<Q> ? `${Q}.${R}`
    : never
  : never
  : K extends WebhookEventName ? K
  : never;

export type EventNameFromQuery<
  K extends string,
  Q extends Query<K> = Query<K>,
> = Q extends `${infer E}.${infer A}` ? E
  : Q extends WebhookEventName ? Q
  : never;

export type ActionNameFromQuery<
  K extends string,
  Q extends Query<K> = Query<K>,
> = Q extends `${infer E}.${infer A}`
  ? E extends WebhookEventName ? A extends EventAction<E> ? A : never : never
  : Q extends WebhookEventName ? EventAction<Q>
  : never;

export function on<
  K extends string,
  E extends EventNameFromQuery<K>,
  A extends ActionNameFromQuery<K>,
>(
  event: Query<K>,
  listener: (
    event: WebhookEventMap[E] & { action: A },
    c: Context,
  ) => Promise<void | Response> | Response,
) {
  return createMiddleware(async (
    c: Context<{
      Variables: {
        payload: WebhookEventMap[E] & { action: A };
      };
    }>,
    next,
  ) => {
    if (!c.get('payload')) {
      c.set('payload', await c.req.json());
    }

    const payload = c.get('payload');
    const requestEventName = c.req.header('X-GitHub-Event');

    const [eventName, actionName] = event.split('.');

    if (
      requestEventName === eventName &&
      (!actionName || actionName === payload.action)
    ) {
      const result = await listener(payload, c);

      if (result instanceof Response) {
        return result;
      }
    }

    await next();
  });
}
