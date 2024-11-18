import { z } from "zod";
import { createCli } from "zod-args-parser";

import { Log } from "@cli/logger.js";

// CLI when no subcommands are provided
export const cliSchema = createCli({
  cliName: "node-cli",
  description: "A CLI for testing.",
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
  if (results.version) {
    Log.info("\n  version: 1.0.0\n");
    return;
  }

  results.printCliHelp();
});
