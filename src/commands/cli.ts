import { z } from "zod";
import { createCli } from "zod-args-parser";

import { Log } from "@cli/logger.js";

export const cliSchema = createCli({
  cliName: "rn-tools",
  description: "React Native CLI Tools",
  options: [
    {
      name: "help",
      aliases: ["h"],
      type: z.boolean().optional().describe("Show this help message."),
    },
    {
      name: "version",
      aliases: ["v"],
      type: z.boolean().optional().describe("Show CLI version."),
    },
  ],
});

cliSchema.setAction(results => {
  if (results.help) {
    results.printCliHelp();
    return;
  }

  if (results.version) {
    Log.info("\nReact Native CLI Tools v1.0.0\n");
    return;
  }

  Log.error("\nNo command provided.\n");
});
