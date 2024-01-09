import { cmdPassThrough } from '@utils/cli-utils.js';
import { askToEnterProjectRootPath, isReactNativeRootDir } from '@utils/utils.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';

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
  console.log('\n', chalk.yellow('Checking for ') + chalk.cyan('`typescript` ') + chalk.yellow('errors ...'), '\n');
  try {
    await cmdPassThrough`npx tsc --project ./ --noEmit${{ cwd }}`;
  } catch (error) {
    process.exit(1);
  }

  console.log('\n', chalk.yellow('Checking for ') + chalk.cyan('`eslint` ') + chalk.yellow('errors ...'), '\n');
  try {
    await cmdPassThrough`npx eslint src --max-warnings 0${{ cwd }}`;
  } catch (error) {
    process.exit(1);
  }

  console.log(chalk.green('\n✅ Typescript and Eslint checks passed.\n'));
}

export async function buildCommand(operationName?: (typeof CHOICES)[number]['name'], projectPath = '') {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    console.log(chalk.red('\n⛔ This script must be run in a react-native project !!\n'));
    projectPath = await askToEnterProjectRootPath();
  }

  const operation = operationName ? CHOICES.filter(e => e.name === operationName)[0] : await askForCommand();

  // eslint and typescript check
  if (operation.isRelease) {
    await testTsAndEslint(projectPath);
  }

  // build
  console.log(chalk.yellow('\n', operation.logMessage, '...\n'));
  try {
    await cmdPassThrough`${gradleCommandPath} ${operation.command} ${{ cwd: path.join(projectPath, 'android') }}`;
  } catch (error) {
    process.exit(1);
  }

  console.log(chalk.green('\n✅ Done!\n'));
}
