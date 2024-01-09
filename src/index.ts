#!/usr/bin/env node

import gradient from 'gradient-string';
import z from 'zod';

import { Log, parseArguments } from '@cli';
import { generateAndroidFontsCommand } from '@commands/androidFonts.js';
import { buildCommand } from '@commands/build.js';
import { emulatorCommand } from '@commands/emulator.js';
import { generateAndroidKeyCommand } from '@commands/generateAndroidKey.js';
import { helpCommand } from '@commands/help.js';
import { installApkCommand } from '@commands/installApk.js';
import { runAndroidAppCommand } from '@commands/launchAndroidApp.js';
import { startServerCommand } from '@commands/startServer.js';
import { COMMANDS, askForCommand, unionOfLiterals } from '@utils/utils.js';

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
    ' _____                 _   _   _       _   _           _______          _     \n|  __ \\               | | | \\ | |     | | (_)         |__   __|        | |    \n| |__) |___  __ _  ___| |_|  \\| | __ _| |_ ___   _____   | | ___   ___ | |___ \n|  _  // _ \\/ _` |/ __| __| . ` |/ _` | __| \\ \\ / / _ \\  | |/ _ \\ / _ \\| / __|\n| | \\ |  __| (_| | (__| |_| |\\  | (_| | |_| |\\ V |  __/  | | (_) | (_) | \\__ \\\n|_|  \\_\\___|\\__,_|\\___|\\__|_| \\_|\\__,_|\\__|_| \\_/ \\___|  |_|\\___/ \\___/|_|___/\n',
  ),
);

// 👇 your expected arguments, used for autocomplete and validation.
const arguments_shape = z
  .object({
    // --help or -h
    help: z.boolean().optional(),
    h: z.boolean().optional(),

    // --device="string string"
    device: z.string().optional(),
    // --path="path/to/dir" react native root project path
    path: z.string().optional(),

    // clear cache
    clear: z.boolean().optional(),
    c: z.boolean().optional(),

    // debug
    debug: z.boolean().optional(),
    d: z.boolean().optional(),

    // release
    release: z.boolean().optional(),
    r: z.boolean().optional(),

    apkDebug: z.boolean().optional(),
    apkRelease: z.boolean().optional(),
    bundleDebug: z.boolean().optional(),
    bundleRelease: z.boolean().optional(),
    clean: z.boolean().optional(),
    stop: z.boolean().optional(),

    // accept one command at a time
    commands: z.tuple([unionOfLiterals(COMMANDS)]).optional(),

    args: z.never().optional(), // positional arguments E.g "C:\Program Files (x86)"
  })
  .strict(); // throw an error on extra keys

async function app() {
  const parsedArguments = parseArguments(arguments_shape);

  // when parsing arguments fails
  if (!parsedArguments.success) {
    const { issues } = parsedArguments.error;
    Log.error('\n', issues.map(i => `[ ${i.path} ] : ${i.message}`).join('\n'), '\n');
    // helpCommand();
    process.exit(1);
  }

  const { help, h, commands } = parsedArguments.data;

  // print help if passed as an option
  if (help || h) {
    helpCommand();
    return;
  }

  const isCommandPassed = commands && commands.length > 0;
  const command = isCommandPassed ? commands[0] : await askForCommand();

  // print help if passed as a command
  if (command === 'help') {
    helpCommand();
    return;
  }

  if (command === 'emulator') {
    const { device } = parsedArguments.data;
    await emulatorCommand(device);
    return;
  }

  if (command === 'start-server') {
    const { device, clear, c, path } = parsedArguments.data;
    await startServerCommand(device, clear || c, path);
    return;
  }

  if (command === 'install-apk') {
    const { device, debug, d, release, r, path } = parsedArguments.data;
    const variant = debug || d ? 'debug' : release || r ? 'release' : undefined;
    await installApkCommand(device, variant, path);
    return;
  }

  if (command === 'launch-app') {
    const { device, path } = parsedArguments.data;
    await runAndroidAppCommand(device, path);
    return;
  }

  if (command === 'build') {
    const { apkDebug, apkRelease, bundleDebug, bundleRelease, clean, stop, path } = parsedArguments.data;
    const operation = apkRelease
      ? 'apkRelease'
      : apkDebug
        ? 'apkDebug'
        : bundleRelease
          ? 'bundleRelease'
          : bundleDebug
            ? 'bundleDebug'
            : clean
              ? 'clean'
              : stop
                ? 'stop'
                : undefined;

    await buildCommand(operation, path);
    return;
  }

  if (command === 'generate-fonts') {
    const { path } = parsedArguments.data;
    await generateAndroidFontsCommand(path);
    return;
  }
  if (command === 'generate-key') {
    const { path } = parsedArguments.data;
    await generateAndroidKeyCommand(path);
    return;
  }
}

app(); // 🚀 Start the app.
