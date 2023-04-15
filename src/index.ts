#!/usr/bin/env node

import chalk from 'chalk';
import z from 'zod';
import gradient from 'gradient-string';

import { argsParser as parseArguments, progress, sleep } from '@utils/cli-utils.js';
import printHelp from '@commands/help.js';
import askForName from '@commands/askName.js';
import askForAge from '@commands/askAge.js';

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
    ' ___   __    ______   ______   ______         _________  ______       ______   __        ________    \n/__/\\ /__/\\ /_____/\\ /_____/\\ /_____/\\       /________/\\/_____/\\     /_____/\\ /_/\\      /_______/\\   \n\\::\\_\\\\  \\ \\\\:::_ \\ \\\\:::_ \\ \\\\::::_\\/_      \\__.::.__\\/\\::::_\\/_    \\:::__\\/ \\:\\ \\     \\__.::._\\/   \n \\:. `-\\  \\ \\\\:\\ \\ \\ \\\\:\\ \\ \\ \\\\:\\/___/\\   ___ /_\\::\\ \\  \\:\\/___/\\    \\:\\ \\  __\\:\\ \\       \\::\\ \\    \n  \\:. _    \\ \\\\:\\ \\ \\ \\\\:\\ \\ \\ \\\\::___\\/_ /__/\\\\:.\\::\\ \\  \\_::._\\:\\    \\:\\ \\/_/\\\\:\\ \\____  _\\::\\ \\__ \n   \\. \\`-\\  \\ \\\\:\\_\\ \\ \\\\:\\/.:| |\\:\\____/\\\\::\\ \\\\: \\  \\ \\   /____\\:\\    \\:\\_\\ \\ \\\\:\\/___/\\/__\\::\\__/\\\n    \\__\\/ \\__\\/ \\_____\\/ \\____/_/ \\_____\\/ \\:_\\/ \\_____\\/   \\_____\\/     \\_____\\/ \\_____\\/\\________\\/\n                                                                                                     \n'
  )
);

// 👇 your expected arguments, used for autocomplete and validation.
const arguments_shape = z
  .object({
    fullName: z.string().optional(), // --full-name="string string"
    age: z.number().optional(), // --age=number
    help: z.boolean().optional().default(false), // --help=boolean or just --help
    h: z.boolean().optional().default(false), // -h
    args: z.array(z.string()).optional(), // positional arguments E.g "C:\Program Files (x86)"
  })
  // throw an error on extra keys
  .strict();

async function app() {
  const parsedArguments = parseArguments(arguments_shape);

  // when parsing arguments fails
  if (!parsedArguments.success) {
    const { issues } = parsedArguments.error;
    console.log(chalk.red('\n' + issues.map(i => `⛔ [ ${i.path} ] : ${i.message}`).join('\n') + '\n'));

    printHelp();

    process.exit(1);
  }

  const { h, help, age, fullName } = parsedArguments.data;

  // print help
  if (h || help) {
    printHelp();
    process.exit(1);
  }

  const userName = fullName ?? (await askForName());
  const userAge = age ?? (await askForAge());

  // 👇 Example for creating a spinner.
  const loading = progress('Processing...');
  await sleep(5000); // 🕐
  // stop with a success message.
  loading.log(`Your name is "${userName}" and your age is "${userAge}"`);
}

app(); // 🚀 Start the app.
