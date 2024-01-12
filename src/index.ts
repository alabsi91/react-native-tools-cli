#!/usr/bin/env node

import gradient from 'gradient-string';
import z from 'zod';

import { createCommandSchema } from '@cli/commandSchema/commandSchema.js';
import { parse } from '@cli/commandSchema/parseSchema.js';
import { Log } from '@cli/logger.js';
import { generateAndroidFontsCommand } from '@commands/androidFonts.js';
import { buildCommand } from '@commands/build.js';
import { emulatorCommand } from '@commands/emulator.js';
import { generateAndroidKeyCommand } from '@commands/generateAndroidKey.js';
import { installApkCommand } from '@commands/installApk.js';
import { runAndroidAppCommand } from '@commands/launchAndroidApp.js';
import { startServerCommand } from '@commands/startServer.js';
import { askForCommand } from './utils/utils.js';

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

async function app() {
  const helpSchema = createCommandSchema({ command: 'help', description: 'Print this help message.' });

  const parsedArguments = parse(
    emulatorCommand.schema,
    startServerCommand.schema,
    installApkCommand.schema,
    runAndroidAppCommand.schema,
    buildCommand.schema,
    generateAndroidFontsCommand.schema,
    generateAndroidKeyCommand.schema,
    helpSchema,
    {
      description: 'React Native CLI Tools',
      globalOptions: [
        {
          name: 'help',
          type: z.boolean().optional().describe('Print this help message.'),
          aliases: ['h'],
        },
        {
          name: 'version',
          type: z.boolean().optional().describe('Print the CLI version.'),
          aliases: ['v'],
        },
      ],
    },
  );

  // when parsing arguments fails
  if (!parsedArguments.success) {
    const { issues } = parsedArguments.error;
    Log.error('\n', issues.map(i => `[ ${i.path} ] : ${i.message}`).join('\n'), '\n');
    process.exit(1);
  }

  const data = parsedArguments.data;

  if (!data.command) {
    const { help, version } = data;
    if (help) {
      parse.printHelp();
      return;
    }

    if(version) {
      Log.info("\nReact Native CLI Tools v1.0.0\n");
      return;
    }

    data.command = (await askForCommand()) as keyof typeof data.command;
  }

  if (data.command === 'help') {
    parse.printHelp();
  }

  if (data.command === 'emulator') {
    const { device } = data;
    await emulatorCommand(device);
    return;
  }

  if (data.command === 'start-server') {
    const { device, clear, path } = data;
    await startServerCommand(device, clear, path);
    return;
  }

  if (data.command === 'install-apk') {
    const { device, debug, release, path } = data;
    const variant = debug ? 'debug' : release ? 'release' : undefined;
    await installApkCommand(device, variant, path);
    return;
  }

  if (data.command === 'launch-app') {
    const { device, path } = data;
    await runAndroidAppCommand(device, path);
    return;
  }

  if (data.command === 'build') {
    const { apkDebug, apkRelease, bundleDebug, bundleRelease, clean, stop, path } = data;
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

  if (data.command === 'generate-fonts') {
    const { path } = data;
    await generateAndroidFontsCommand(path);
    return;
  }

  if (data.command === 'generate-key') {
    const { path } = data;
    await generateAndroidKeyCommand(path);
    return;
  }
}

app(); // 🚀 Start the app.
