import { assertEquals } from 'jsr:@std/assert';
import { slugify } from './slugify.ts';

Deno.test('slugify', () => {
  assertEquals(slugify('MyCompany'), 'my-company');
  assertEquals(slugify('Hello_World'), 'hello-world');
  assertEquals(slugify('Open Source Project'), 'open-source-project');
});
