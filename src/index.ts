#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import z from 'zod';
import gradient from 'gradient-string';
import { argsParser, progress, sleep } from './helpers.js';

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
const myArgs = z.object({
  name: z.string().optional(), // --name=<name>
  fullName: z.string().optional(), // --full-name="<full-name>"
  age: z.number().optional(), // --age=<age>
  h: z.boolean().optional(), // -h
  args: z.array(z.string()).optional(), // E.g "C:\Program Files (x86)"
});

try {
  const args = argsParser(myArgs);
  console.log('args :', args);
} catch (err) {
  console.log(chalk.red(err));
}

async function app() {
  type answersT = { name: string };

  // ❔ Ask for user input.
  const { name } = await inquirer.prompt<answersT>([
    {
      type: 'input',
      name: 'name',
      default: 'John Doe',
      message: 'Enter your name :',
    },
  ]);

  // 👇 Example for creating a spinner.
  const loading = progress('Processing...');
  await sleep(5000); // 🕐
  loading.log(`Hello ${name}! 👋`); // stop with a success message.
}

app(); // 🚀 Start the app.
