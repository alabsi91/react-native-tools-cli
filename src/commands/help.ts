import chalk from 'chalk';

import type { HelpSchema } from '@types';
import { cleanTerminalColors } from '@utils/cli-utils.js';

const schema: HelpSchema = {
  name: 'React Native Tools CLI',
  description: 'CLI for React Native tools',
  usage: 'rn-tools ' + chalk.yellow('<command> ') + chalk.cyan('[options]'),
  commands: [
    {
      command: 'help',
      options: [{ description: 'Show this help message.' }],
    },
    {
      command: 'emulator',
      options: [
        { description: 'Launch an emulator:' },
        {
          syntaxes: ['--device="EMULATOR_NAME"'],
          isRequired: false,
          description: 'Specify an emulator to launch.',
        },
      ],
    },
    {
      command: 'start-server',
      options: [
        { description: 'Configure TCP and start JavaScript server:' },
        {
          syntaxes: ['--device="DEVICE_NAME"'],
          isRequired: false,
          description: 'Specify a device to connect to before starting the server.',
        },
        {
          syntaxes: ['--path="path/to/project"'],
          isRequired: false,
          description: 'Specify the React Native root project path.',
        },
        {
          syntaxes: ['--clear', '-c'],
          isRequired: false,
          description: 'Specify whether to clear the cache first.',
        },
      ],
    },
    {
      command: 'install-apk',
      options: [
        { description: 'Install the built APK on the connected device:' },
        {
          syntaxes: ['--device="DEVICE_NAME"'],
          isRequired: false,
          description: 'Specify a device to install the APK on.',
        },
        {
          syntaxes: ['--path="path/to/project"'],
          isRequired: false,
          description: 'Specify the React Native root project path.',
        },
        {
          syntaxes: ['--debug', '-d'],
          isRequired: false,
          description: 'Select the debug APK variant.',
        },
        {
          syntaxes: ['--release', '-r'],
          isRequired: false,
          description: 'Select the release APK variant.',
        },
      ],
    },
    {
      command: 'launch-app',
      options: [
        { description: 'Launch the app on the connected device:' },
        {
          syntaxes: ['--device="DEVICE_NAME"'],
          isRequired: false,
          description: 'Specify a device to install the APK on.',
        },
        {
          syntaxes: ['--path="path/to/project"'],
          isRequired: false,
          description: 'Specify the React Native root project path.',
        },
      ],
    },
    {
      command: 'build',
      options: [
        { description: 'Build the React Native Android project:' },
        {
          syntaxes: ['--path="path/to/project"'],
          isRequired: false,
          description: 'Specify the React Native root project path.',
        },
        {
          syntaxes: ['--apk-debug'],
          isRequired: false,
          description: 'Build the debug APK variant.',
        },
        {
          syntaxes: ['--apk-release'],
          isRequired: false,
          description: 'Build the release APK variant.',
        },
        {
          syntaxes: ['--bundle-debug'],
          isRequired: false,
          description: 'Build the debug BUNDLE variant.',
        },
        {
          syntaxes: ['--bundle-release'],
          isRequired: false,
          description: 'Build the release BUNDLE variant.',
        },
        {
          syntaxes: ['--clean'],
          isRequired: false,
          description: 'Clean the build cache.',
        },
        {
          syntaxes: ['--stop'],
          isRequired: false,
          description: 'Stop the Gradle daemon.',
        },
      ],
    },
    {
      command: 'generate-fonts',
      options: [
        { description: 'Setup fonts on Android using ' + chalk.underline('./src/assets/fonts/') + ' :' },
        {
          syntaxes: ['--path="path/to/project"'],
          isRequired: false,
          description: 'Specify the React Native root project path.',
        },
      ],
    },
    {
      command: 'generate-key',
      options: [
        { description: 'Setup a storekey on Android:' },
        {
          syntaxes: ['--path="path/to/project"'],
          isRequired: false,
          description: 'Specify the React Native root project path.',
        },
      ],
    },
  ],
};

// the the actual length of the string without ANSI codes
const len = (str: string) => cleanTerminalColors(str).length;
const newLine = (count: number) => '\n'.repeat(count);
const indent = (count: number) => ' '.repeat(count);

export function helpCommand() {
  const commandPadding = 20;

  console.log(chalk.bold(schema.name)); // title
  console.log(newLine(1), chalk.bold.blue.inverse(' Usage ')); // usage title
  console.log(newLine(1), indent(2), chalk.dim('$'), schema.usage); // usage example
  console.log(newLine(1), chalk.bold.blue.inverse(' Commands '), newLine(1)); // commands title

  for (let i = 0; i < schema.commands.length; i++) {
    const { command, options } = schema.commands[i];

    const longestSyntax = Math.max(...options.map(({ syntaxes }) => (syntaxes ? syntaxes.join(' OR ').length : 0)));

    const formattedOptions = [];

    // loop over command options
    for (let o = 0; o < options.length; o++) {
      const { syntaxes, isRequired, description } = options[o];
      const syntaxesArray = syntaxes ?? [];

      const desc = chalk.dim('- ') + chalk.reset(description);
      const required = chalk.italic.dim(typeof isRequired === 'boolean' ? (isRequired ? ' [Required] ' : ' [Optional] ') : '');

      // loop over syntaxes
      const formattedSyntaxes = syntaxesArray
        .map(syntax => {
          if (syntax.includes('=')) {
            const [part1, part2] = syntax.split('=');
            return chalk.cyan(part1) + chalk.reset('=') + chalk.italic.magenta(part2);
          }
          return chalk.cyan(syntax);
        })
        .join(chalk.dim.italic(' OR '));

      if (formattedSyntaxes && required) {
        formattedOptions.push(formattedSyntaxes + ' '.repeat(longestSyntax - len(formattedSyntaxes)) + required + desc);
        continue;
      }
      formattedOptions.push(desc);
    }

    console.log(
      indent(3),
      chalk.bold.yellow(command),
      indent(commandPadding - len(command)),
      formattedOptions.join(newLine(1) + indent(commandPadding + 6)),
      newLine(2),
    );
  }
}
