import { tasks } from "@trigger.dev/sdk/v3";
import type { HelloWorldTask } from "@docio/trigger";

export default {
  async fetch(req) {
    await tasks.trigger<HelloWorldTask>("hello-world", {
      payload: {
        message: "Hello, world!",
      },
    });

    return new Response("Not found", { status: 404 });
  },
} satisfies Deno.ServeDefaultExport;
