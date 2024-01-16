import { Log } from '@cli/logger.js';
import { spinner } from '@cli/spinner.js';
import { sleep } from '@cli/terminal.js';
import Schema from '@schema';
import { askForAge, askForName } from '@utils/utils.js';
import { z } from 'zod';

export default async function testCommand(name: string | undefined, age: number | undefined) {
  name = name || (await askForName());
  age = age || (await askForAge());

  const loading = spinner('Processing...');
  await sleep(2000);
  loading.success('Processing done!');

  Log.info(`Hello ${name}, you are ${age} years old.`);
}

testCommand.schema = Schema.createCommand({
  /**
   * - **Required** `string`
   * - The command name, use kebab-case.
   * - Make sure to not duplicate commands and aliases.
   *
   * @example
   *   command: 'run-app',
   */
  command: 'test',
  /**
   * - **Optional** `string`
   * - The description of the command.
   * - Used for generating the help message.
   */
  description: 'Run a command for testing.',
  /**
   * - **Optional** `string[]`
   * - The aliases of the command.
   * - Any of the aliases will trigger the same command in the CLI.
   * - Make sure to not duplicate aliases and commands.
   */
  aliases: ['run-test', 'test-command'],
  /**
   * - **Optional** `z.ZodArray`
   * - **Default** `z.string().array()`
   * - The arguments of the command.
   * - Those arguments are specific to this command.
   * - Use `z.string().array().describe('Description')` to add a description for help message.
   *
   * @example
   *   argsType: z.string().array().nonempty(), // None-empty string array.
   *   argsType: z.coerce.number().array().max(1), // Converts string to number and accept one or no arguments.
   */
  argsType: z.string().array().describe('You can pass any arguments to this command.'),
  /**
   * - **Optional** `CommandOptions[]`
   * - The options of the command.
   * - Those options are specific to this command.
   */
  options: [
    {
      /**
       * - **Required** `string`
       * - The name of the option, use CamelCase.
       * - For example: the syntax for the option `rootPath` is `--root-path="path"`.
       * - For boolean options, the syntax is `--option` or `--option=true`.
       * - One character option names are limited to `boolean` types only E.g. `b` will be used for `-b`
       *
       * @example
       *   name: 'help'; // Transforms to `--help`
       *   name: 'rootPath'; // Transforms to `--root-path`
       */
      name: 'age',
      /**
       * - **Required** `ZodTypes` only string, number or boolean
       * - The type of the option.
       * - The will be used to validate the user input.
       * - `Z.describe()` will be used to generate the help message.
       *
       * @example
       *   type: z.boolean().optional().describe('Describe the option'),
       *   type: z.string().describe('Describe the option'),
       *
       * @see https://zod.dev/?id=types
       */
      type: z.number().optional().describe('Your age in years.'),
      /**
       * - **Optional** `string[]`
       * - The aliases of the option.
       * - Any of the aliases will trigger the same option in the CLI.
       * - One character option names are limited to `boolean` types
       * - Make sure to not duplicate aliases.
       */
      aliases: ['yourAge'],
    },
    {
      name: 'name',
      type: z
        .string({ invalid_type_error: 'must be a string E.g. --name="John"' }) // type string with a custom error
        .optional()
        .describe('Your name.'),
      aliases: ['yourName'],
    },
  ],
});
