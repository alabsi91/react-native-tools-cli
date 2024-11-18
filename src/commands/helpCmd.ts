import { z } from "zod";
import { createSubcommand } from "zod-args-parser";

export const helpCmdSchema = createSubcommand({
  name: "help",
  placeholder: "<command>",
  description: "Print help message for command",
  arguments: [
    {
      name: "command",
      description: "Command to print help for",
      type: z.enum(["add-user", "help"]).optional(),
    },
  ],
});

helpCmdSchema.setAction(results => {
  const [command] = results.arguments;
  if (command) results.printSubcommandHelp(command);
  else results.printCliHelp();
});
