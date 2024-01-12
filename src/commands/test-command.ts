import { askForAge, askForName } from '@utils/utils.js';
import { createCommandSchema } from '@cli/commandSchema/commandSchema.js';
import { z } from 'zod';
import { spinner } from '@cli/spinner.js';
import { sleep } from '@cli/terminal.js';
import { Log } from '@cli/logger.js';

export default async function testCommand(name: string | undefined, age: number | undefined) {
  name = name || (await askForName());
  age = age || (await askForAge());

  const loading = spinner('Processing...');
  await sleep(2000);
  loading.success('Processing done!');

  Log.info(`Hello ${name}, you are ${age} years old.`);
}

testCommand.schema = createCommandSchema({
  command: 'test',
  description: 'Run a command for testing.', // For help command
  aliases: ['run-test', 'test-command'], // Those aliases will be mapped to the command
  options: [
    {
      name: 'age', // will be converted to '--age'
      type: z.number().optional().describe('Your age in years.'),
      aliases: [ 'yourAge'], // Will be mapped to -a , --your-age
    },
    {
      name: 'name',
      type: z.string().optional().describe('Your name.'),
      aliases: ['yourName'], // Note: You can't use a single character for non-boolean options
    },
  ],
});
