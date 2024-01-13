#!/usr/bin/env node

import { parse } from '@cli/commandSchema/parseSchema.js';
import { Log } from '@cli/logger.js';
import { CONSTANTS, testCliArgsInput } from '@cli/terminal.js';
import testCommand from '@commands/test-command.js';
import Schema from '@schema';
import gradient from 'gradient-string';
import { z } from 'zod';

// ? 👇 title text gradient colors. for more colors see: `https://cssgradient.io/gradient-backgrounds`
const coolGradient = gradient([
  { color: '#FA8BFF', pos: 0 },
  { color: '#2BD2FF', pos: 0.5 },
  { color: '#2BFF88', pos: 1 },
]);

// ? `https://www.kammerl.de/ascii/AsciiSignature.php` 👈 to convert your app's title to ASCII art.
// ? `https://codebeautify.org/javascript-escape-unescape` 👈 escape your title's string for JavaScript.
console.log(
  coolGradient(String.raw` 
 __   __     ______     _____     ______       __     ______        ______     __         __   
/\ "-.\ \   /\  __ \   /\  __-.  /\  ___\     /\ \   /\  ___\      /\  ___\   /\ \       /\ \  
\ \ \-.  \  \ \ \/\ \  \ \ \/\ \ \ \  __\    _\_\ \  \ \___  \     \ \ \____  \ \ \____  \ \ \ 
 \ \_\\"\_\  \ \_____\  \ \____-  \ \_____\ /\_____\  \/\_____\     \ \_____\  \ \_____\  \ \_\
  \/_/ \/_/   \/_____/   \/____/   \/_____/ \/_____/   \/_____/      \/_____/   \/_____/   \/_/
                                                                                               
`),
);

// ⚠️ For testing in development mode only
if (CONSTANTS.isDev) {
  // Here you can test your CLI arguments while using hot reload in development mode.
  testCliArgsInput('test --your-name="John Doe" --age=25 extraArg andAnotherArg');
}

async function app() {
  const options = Schema.createOptions({
    cliName: 'node-cli', // The CLI name that starts your CLI, used for help command.
    description: 'A CLI for testing.', // For help command
    validateSchema: CONSTANTS.isDev, // Throw an error if the schema is invalid. recommended to set to false in production.
    // global options are used when no command is specified, for example: `node-cli --help`
    globalOptions: [
      {
        name: 'help',
        type: z.boolean().optional().describe('Show this help message.'),
        aliases: ['h'],
      },
      {
        name: 'version',
        type: z.boolean().optional().describe('Show the version.'),
        aliases: ['v'],
      },
    ],
  });

  // Add all commands schemas here 👇
  const results = parse(testCommand.schema /** , You can add more */, options);

  // when parsing arguments fails
  if (!results.success) {
    // ? See Zod docs for more information: `https://zod.dev/?id=error-handling`
    const { issues } = results.error;
    Log.error('\n', issues.map(i => `[ ${i.path} ] : ${i.message}`).join('\n'), '\n');
    Schema.printHelp(); // 🖨️ print help message on error
    process.exit(1);
  }

  const { command } = results.data;

  if (!command) {
    const { version } = results.data;
    if (version) {
      Log.info('\n  version: 1.0.0\n');
      return;
    }

    Schema.printHelp();
    return;
  }

  if (command === 'test') {
    const { age, name, args } = results.data;
    await testCommand(name, age);
    if (args.length) Log.warn('\nYou Passed extra arguments: ', args.join(', '));
  }
}

app(); // 🚀 Start the app.
