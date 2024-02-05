import { z } from 'zod';

import { Log } from '@cli/logger.js';
import { spinner } from '@cli/spinner.js';
import { sleep } from '@cli/terminal.js';
import Schema from '@schema';
import { askForStringInput } from '@utils/utils.js';

export default async function testCommand(name: string | undefined, age: number | undefined) {
  name = name || (await askForStringInput('Enter your name :', 'John Doe'));
  age = age || +(await askForStringInput('Enter your age :'));

  const loading = spinner('Processing...');
  await sleep(2000);
  loading.success('Processing done!');

  Log.info(`Hello ${name}, you are ${age} years old.`);
}

testCommand.schema = Schema.createCommand({
  command: 'test',
  description: 'Run a command for testing.',
  example: 'test --name="John Doe" --age=20',
  aliases: ['run-test', 'test-command'],
  argsType: z.string().array().describe('You can pass any arguments to this command.'),
  options: [
    {
      name: 'age',
      type: z.number().optional().describe('Your age in years.'),
      aliases: ['yourAge', 'yourage'],
      example: '--age=20 or --your-age=20 or --yourage=20',
    },
    {
      name: 'name',
      type: z
        .string({ invalid_type_error: 'must be a string E.g. --name="John"' }) // type string with a custom error
        .optional(),
      description: 'Your name in string format.', // same as z.describe("")
      aliases: ['yourName', 'yourname'],
    },
    {
      name: 'help',
      type: z.boolean().optional().describe('Prints a help message for this command.'),
      aliases: ['h'],
    },
  ],
});
