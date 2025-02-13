import { logger, task } from "@trigger.dev/sdk/v3";
import { simpleGit } from "simple-git";

export const helloWorldTask = task({
  id: "hello-world",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: any, { ctx }) => {
    logger.log("Hello, world!", { payload, ctx });

    const git = simpleGit();

    await git.clone("https://github.com/triggerdotdev/trigger.dev.git");

    return {
      message: "Hello, world!",
    }
  },
});

export type HelloWorldTask = typeof helloWorldTask;