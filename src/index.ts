#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';
import parseArgs, { progress, sleep } from './helpers.js';

// 👇 title text gradient colors. for more colors see: `https://cssgradient.io/gradient-backgrounds`
const coolGradient = gradient([
  { color: '#FA8BFF', pos: 0 },
  { color: '#2BD2FF', pos: 0.5 },
  { color: '#2BFF88', pos: 1 },
]);

// `https://www.kammerl.de/ascii/AsciiSignature.php` 👈 to convert your app's title to ASCII art.
// `https://codebeautify.org/javascript-escape-unescape` 👈 escape your title for JavaScript.
console.log(
  coolGradient(
    ' ___   __    ______   ______   ______         _________  ______       ______   __        ________    \n/__/\\ /__/\\ /_____/\\ /_____/\\ /_____/\\       /________/\\/_____/\\     /_____/\\ /_/\\      /_______/\\   \n\\::\\_\\\\  \\ \\\\:::_ \\ \\\\:::_ \\ \\\\::::_\\/_      \\__.::.__\\/\\::::_\\/_    \\:::__\\/ \\:\\ \\     \\__.::._\\/   \n \\:. `-\\  \\ \\\\:\\ \\ \\ \\\\:\\ \\ \\ \\\\:\\/___/\\   ___ /_\\::\\ \\  \\:\\/___/\\    \\:\\ \\  __\\:\\ \\       \\::\\ \\    \n  \\:. _    \\ \\\\:\\ \\ \\ \\\\:\\ \\ \\ \\\\::___\\/_ /__/\\\\:.\\::\\ \\  \\_::._\\:\\    \\:\\ \\/_/\\\\:\\ \\____  _\\::\\ \\__ \n   \\. \\`-\\  \\ \\\\:\\_\\ \\ \\\\:\\/.:| |\\:\\____/\\\\::\\ \\\\: \\  \\ \\   /____\\:\\    \\:\\_\\ \\ \\\\:\\/___/\\/__\\::\\__/\\\n    \\__\\/ \\__\\/ \\_____\\/ \\____/_/ \\_____\\/ \\:_\\/ \\_____\\/   \\_____\\/     \\_____\\/ \\_____\\/\\________\\/\n                                                                                                     \n'
  )
);

// ⚠️ type checking will not work in runtime, user can pass any type of argument. implement your own type checking using javascript's typeof operator.
// 👇 your expected arguments.
type myArgs = {
  name?: string; // --name=<name>
  fullName?: string; // --full-name="<full-name>"
  age?: number; // --age=<age>
  h?: boolean; // -h
};
const args = parseArgs<myArgs>();
const fullName = args.fullName && typeof args.fullName === 'string' ? args.fullName : null; // check for an argument.
if (fullName) console.log(chalk.green(`\n- Your full name is ${fullName}! 👋`));

async function app() {
  // ❔ Ask for user input.
  const { name }: { name: string } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      default: 'John Doe',
      message: 'Enter your name :',
    },
  ]);

  // 👇 Example for creating a spinner.
  const loading = progress('Processing...');
  await sleep(5000);
  loading.success(`Hello ${name}! 👋`); // stop with a success message.
}

app(); // 🚀 Start the app.
