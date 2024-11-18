import input from "@inquirer/input";
import { z } from "zod";

import { Log } from "@cli/logger.js";
import { spinner } from "@cli/spinner.js";
import { sleep } from "@cli/terminal.js";
import { createSubcommand } from "zod-args-parser";

import type { InferOptionsType } from "zod-args-parser";

const parseArr = (val: unknown) => {
  if (typeof val === "string") {
    return val.split(",").filter(Boolean);
  }
  return val;
};

async function addUserCmd({ name, age, friends }: InferOptionsType<typeof addUserCmdScheme>) {
  name = name || (await input({ message: "Enter user name :", default: "John Doe" }));
  age = age || +(await input({ message: "Enter user age :" }));

  const loading = spinner("Processing...");
  await sleep(2000);
  loading.success("Processing done!");

  Log.info(
    `The user with name ${name} and age ${age} was added successfully!`,
    friends?.length ? `has friends: ${friends.join(", ")}` : "",
  );
}

export const addUserCmdScheme = createSubcommand({
  name: "add-user",
  aliases: ["add"],
  description: "Run a command for testing.",
  example: 'add-user --name "John Doe" --age 20',
  options: [
    {
      name: "age",
      aliases: ["a"],
      description: "User age",
      example: "--age=20 or --age 20 or -a 20",
      type: z.coerce.number().optional(),
    },
    {
      name: "name",
      aliases: ["n"],
      description: "User name",
      example: '--name="John Doe" or --name "John Doe" or -n "John Doe"',
      type: z.string({ invalid_type_error: 'must be a string E.g. --name "John Doe"' }).optional(),
    },
    {
      name: "friends",
      aliases: ["f"],
      description: "User friends",
      example: '--friends "John Doe,Jane Doe""',
      type: z.preprocess(parseArr, z.array(z.string())).optional(),
    },
  ],
});

addUserCmdScheme.setAction(addUserCmd);
