#!/usr/bin/env node

import gradient from 'gradient-string';
import z from 'zod';

import { Log } from '@cli/logger.js';
import { generateAndroidFontsCommand } from '@commands/androidFonts.js';
import { buildCommand } from '@commands/build.js';
import { emulatorCommand } from '@commands/emulator.js';
import { generateAndroidKeyCommand } from '@commands/generateAndroidKey.js';
import { installApkCommand } from '@commands/installApk.js';
import { runAndroidAppCommand } from '@commands/launchAndroidApp.js';
import { startServerCommand } from '@commands/startServer.js';
import Schema from '@schema';
import { askForCommand } from '@utils/utils.js';
import { CONSTANTS, testCliArgsInput } from '@cli/terminal.js';
import { changeAppVersionCommand } from '@commands/version.js';

// ? 👇 title text gradient colors. for more colors see: `https://cssgradient.io/gradient-backgrounds`
const coolGradient = gradient([
  { color: '#FA8BFF', pos: 0 },
  { color: '#2BD2FF', pos: 0.5 },
  { color: '#2BFF88', pos: 1 },
]);

// ? `https://www.kammerl.de/ascii/AsciiSignature.php`     👈 to convert your app's title to ASCII art.
// ? `https://codebeautify.org/javascript-escape-unescape` 👈 escape your title's string for JavaScript.
console.log(
  coolGradient(
    String.raw`
 _____                 _     _   _       _   _             _______          _     
|  __ \               | |   | \ | |     | | (_)           |__   __|        | |    
| |__) |___  __ _  ___| |_  |  \| | __ _| |_ ___   _____     | | ___   ___ | |___ 
|  _  // _ \/ _  |/ __| __| | .   |/ _  | __| \ \ / / _ \    | |/ _ \ / _ \| / __|
| | \ \  __/ (_| | (__| |_  | |\  | (_| | |_| |\ V /  __/    | | (_) | (_) | \__ \
|_|  \_\___|\__,_|\___|\__| |_| \_|\__,_|\__|_| \_/ \___|    |_|\___/ \___/|_|___/
`,
  ),
);

// ⚠️ For testing in development mode only
if (CONSTANTS.isDev) {
  // Here you can test your CLI arguments while using hot reload in development mode.
  testCliArgsInput('');
}

async function app() {
  const helpSchema = Schema.createCommand({ command: 'help', description: 'Print this help message.' });

  const parseOptions = Schema.createOptions({
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
  });

  const results = Schema.parse(
    emulatorCommand.schema,
    startServerCommand.schema,
    installApkCommand.schema,
    runAndroidAppCommand.schema,
    buildCommand.schema,
    changeAppVersionCommand.schema,
    generateAndroidFontsCommand.schema,
    generateAndroidKeyCommand.schema,
    helpSchema,
    parseOptions,
  );

  // when parsing arguments fails
  if (!results.success) {
    // ? See Zod docs for more information about error formatting: `https://zod.dev/?id=error-handling`
    const err = results.error.format();

    for (const key in err) {
      const el = err[key as keyof typeof err];
      if (!el) continue;

      if (Array.isArray(el) && el.length) {
        Log.error(el.join('\n'), '\n');
        continue;
      }

      if ('_errors' in el) Log.error(key, ':', el._errors.join('\n'), '\n');
    }

    process.exit(1);
  }

  const data = results.data;

  if (!data.command) {
    const { help, version } = data;
    if (help) {
      Schema.printHelp();
      return;
    }

    if (version) {
      Log.info('\nReact Native CLI Tools v1.0.0\n');
      return;
    }

    data.command = (await askForCommand()) as keyof typeof data.command;
  }

  if (data.command === 'help') {
    Schema.printHelp();
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
    const { apkDebug, apkRelease, bundleDebug, bundleRelease, clean, stop, path, skip } = data;
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

    await buildCommand(operation, path, skip);
    return;
  }

  if (data.command === 'version') {
    const { path, version } = data;
    await changeAppVersionCommand(path, version);
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
  }
}

app(); // 🚀 Start the app.
