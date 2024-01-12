#!/usr/bin/env node

import { parse } from '@cli/commandSchema/parseSchema.js';
import { Log } from '@cli/logger.js';
import testCommand from '@commands/test-command.js';
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
  coolGradient(
    ' ___   __    ______   ______   ______         _________  ______       ______   __        ________    \n/__/\\ /__/\\ /_____/\\ /_____/\\ /_____/\\       /________/\\/_____/\\     /_____/\\ /_/\\      /_______/\\   \n\\::\\_\\\\  \\ \\\\:::_ \\ \\\\:::_ \\ \\\\::::_\\/_      \\__.::.__\\/\\::::_\\/_    \\:::__\\/ \\:\\ \\     \\__.::._\\/   \n \\:. `-\\  \\ \\\\:\\ \\ \\ \\\\:\\ \\ \\ \\\\:\\/___/\\   ___ /_\\::\\ \\  \\:\\/___/\\    \\:\\ \\  __\\:\\ \\       \\::\\ \\    \n  \\:. _    \\ \\\\:\\ \\ \\ \\\\:\\ \\ \\ \\\\::___\\/_ /__/\\\\:.\\::\\ \\  \\_::._\\:\\    \\:\\ \\/_/\\\\:\\ \\____  _\\::\\ \\__ \n   \\. \\`-\\  \\ \\\\:\\_\\ \\ \\\\:\\/.:| |\\:\\____/\\\\::\\ \\\\: \\  \\ \\   /____\\:\\    \\:\\_\\ \\ \\\\:\\/___/\\/__\\::\\__/\\\n    \\__\\/ \\__\\/ \\_____\\/ \\____/_/ \\_____\\/ \\:_\\/ \\_____\\/   \\_____\\/     \\_____\\/ \\_____\\/\\________\\/\n                                                                                                     \n',
  ),
);

async function app() {
  // add all commands schema here 👇
  const parsedArguments = parse(testCommand.schema, {
    cliName: 'node-cli', // The CLI name that starts your CLI, used for help command. defaults to package.json name
    description: 'A CLI for testing.', // For help command
    validateSchema: true, // Throw an error if the schema is invalid. recommended to set to false in production.
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

  // when parsing arguments fails
  if (!parsedArguments.success) {
    // ? See Zod docs for more info `https://zod.dev/?id=error-handling`
    const { issues } = parsedArguments.error;
    Log.error('\n', issues.map(i => `[ ${i.path} ] : ${i.message}`).join('\n'), '\n');
    parse.printHelp(); // 🖨️ print help message on error
    process.exit(1);
  }

  const { command } = parsedArguments.data;

  if (!command) {
    const { version } = parsedArguments.data;
    if (version) {
      Log.info('\n  version: 1.0.0\n');
      return;
    }

    parse.printHelp();
    return;
  }

  if (command === 'test') {
    const { age, name } = parsedArguments.data;
    testCommand(name, age);
  }
}

app(); // 🚀 Start the app.
