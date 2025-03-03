import { on } from '@docio/octo';

export const pingHandler = on('ping', (_event, c) => {
  console.log('Ping received');
  return c.json({ message: 'Pong' }, 200);
});
