import { Log } from '@/cli-tools/logger.js';
import { cmdPassThrough } from '@/cli-tools/terminal.js';
import Schema from '@schema';
import { askToEnterProjectRootPath, isReactNativeRootDir } from '@utils/utils.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { z } from 'zod';

const gradleCommandPath = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';

const CHOICES = [
  {
    name: 'apkRelease',
    command: 'assembleRelease',
    isRelease: true,
    description: 'Build APK Release',
    logMessage: '📦 Building Release',
  },
  {
    name: 'apkDebug',
    command: 'assembleDebug',
    isRelease: false,
    description: 'Build APK Debug',
    logMessage: '📦 Building Debug',
  },
  {
    name: 'bundleRelease',
    command: 'bundleRelease',
    isRelease: true,
    description: 'Build Bundle Release (AAB)',
    logMessage: '📦 Bundling Release',
  },
  {
    name: 'bundleDebug',
    command: 'bundleDebug',
    isRelease: false,
    description: 'Build Bundle Debug (AAB)',
    logMessage: '📦 Bundling Debug',
  },
  {
    name: 'clean',
    command: 'clean',
    isRelease: false,
    description: 'Clean Build Cache',
    logMessage: '🧹 Cleaning The Build Cache',
  },
  {
    name: 'stop',
    command: '--stop',
    isRelease: false,
    description: 'Stop Gradle',
    logMessage: '🛑 Stopping Gradle daemons',
  },
] as const;

async function askForCommand() {
  const { operationName } = await inquirer.prompt<{ operationName: (typeof CHOICES)[number]['description'] }>([
    {
      type: 'list',
      name: 'operationName',
      message: 'Choose an operation :',
      choices: CHOICES.map(e => e.description),
    },
  ]);

  return CHOICES.filter(e => e.description === operationName)[0];
}

async function testTsAndEslint(cwd: string) {
  Log.info('\nChecking for', chalk.yellow('`typescript`'), 'errors ...\n');
  try {
    await cmdPassThrough`npx tsc --project ./ --noEmit${{ cwd }}`;
  } catch (error) {
    process.exit(1);
  }

  Log.info('\nChecking for', chalk.yellow('`eslint`'), 'errors ...\n');
  try {
    await cmdPassThrough`npx eslint src --max-warnings 0${{ cwd }}`;
  } catch (error) {
    process.exit(1);
  }

  Log.success('\nTypescript and Eslint checks passed.\n');
}

export async function buildCommand(operationName?: (typeof CHOICES)[number]['name'], projectPath = '', skipChecks = false) {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    Log.error('\nThis script must be run in a react-native project !!\n');
    projectPath = await askToEnterProjectRootPath();
  }

  const operation = operationName ? CHOICES.filter(e => e.name === operationName)[0] : await askForCommand();

  // test if android directory exists
  if (!path.join(projectPath, 'android')) {
    Log.error('\nCannot find', chalk.yellow('`android`'), 'directory in', chalk.yellow(projectPath), '\n');
    process.exit(1);
  }

  // eslint and typescript check
  if (operation.isRelease && !skipChecks) {
    await testTsAndEslint(projectPath);
  }

  // build
  Log.info('\n', operation.logMessage, '...\n');
  try {
    await cmdPassThrough`${gradleCommandPath} ${operation.command} ${{ cwd: path.join(projectPath, 'android') }}`;
  } catch (error) {
    process.exit(1);
  }

  Log.success('\nDone!\n');
}

buildCommand.schema = Schema.createCommand({
  command: 'build',
  description: 'Build the React Native Android project.',
  options: [
    {
      name: 'path',
      type: z.string().optional().describe('Specify the React Native root project path.'),
    },
    {
      name: 'apkDebug',
      type: z.boolean().optional().describe('Build the debug APK variant.'),
    },
    {
      name: 'apkRelease',
      type: z.boolean().optional().describe('Build the release APK variant.'),
    },
    {
      name: 'bundleDebug',
      type: z.boolean().optional().describe('Build the debug AAB variant.'),
    },
    {
      name: 'bundleRelease',
      type: z.boolean().optional().describe('Build the release AAB variant.'),
    },
    {
      name: 'clean',
      type: z.boolean().optional().describe('Clean the build cache.'),
    },
    {
      name: 'stop',
      type: z.boolean().optional().describe('Stop the Gradle daemons.'),
    },
    {
      name: 'skip',
      type: z.boolean().optional().describe('Skip Typescript and Eslint checks.'),
    },
  ],
});
