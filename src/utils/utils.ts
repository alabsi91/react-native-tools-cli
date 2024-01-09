import { $, Log } from '@utils/cli-utils.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import { z } from 'zod';

export const COMMANDS = [
  'emulator',
  'start-server',
  'install-apk',
  'launch-app',
  'build',
  'generate-fonts',
  'generate-key',
  'help',
] as const;

export type Commands = (typeof COMMANDS)[number];

export const adbCommandPath = process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb') : 'adb';

// check if the script is running in a react-native project
export async function isReactNativeRootDir(rootPath = '') {
  const packageJsonPath = path.join(rootPath, 'package.json');
  const isPackageJsonExist = existsSync(packageJsonPath);
  if (!isPackageJsonExist) return false;

  const { dependencies } = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  if (!dependencies['react-native']) return false;

  return true;
}

export async function isAdbCommandExists() {
  try {
    const output = await $`"${adbCommandPath}" version`;
    if (output) return true;
    return false;
  } catch (error) {
    return false;
  }
}

export async function getAdbDevices() {
  const stdout = await $`${adbCommandPath} devices`;
  return stdout
    .split('\n')
    .filter(e => e.trim() && !e.startsWith('List'))
    .map(e => e.replace(/\s+.+/, '').trim());
}

export async function reverseTCP(deviceName: string) {
  await $`"${adbCommandPath}" -s ${deviceName} reverse tcp:8081 tcp:8081`;
}

export async function adbInstallApk(deviceName: string, apkPath: string) {
  await $`"${adbCommandPath}" -s ${deviceName} install -r ${apkPath}`;
}

export async function getDeviceArchitecture(deviceName: string) {
  const stdout = await $`"${adbCommandPath}" -s ${deviceName} shell getprop ro.product.cpu.abi devices`;
  return stdout.trim();
}

export async function askToChooseDevice(devices: string[]) {
  const { deviceName } = await inquirer.prompt<{ deviceName: string }>([
    {
      type: 'list',
      name: 'deviceName',
      message: 'Choose a device :',
      choices: devices,
    },
  ]);

  return deviceName;
}

export async function askToEnterProjectRootPath() {
  const { projectPath } = await inquirer.prompt<{ projectPath: string }>([
    {
      type: 'input',
      name: 'projectPath',
      message: 'Please enter React Native root project path :',
    },
  ]);

  const isReactNative = await isReactNativeRootDir(projectPath);

  if (!isReactNative) {
    Log.error('\nThis script must be run in a react-native project !!\n');
    return await askToEnterProjectRootPath();
  }

  return projectPath;
}

type Answers = { command: Commands };

export async function askForCommand() {
  const { command } = await inquirer.prompt<Answers>([
    {
      type: 'list',
      name: 'command',
      message: 'Choose a command :',
      choices: COMMANDS,
      pageSize: COMMANDS.length,
    },
  ]);

  return command;
}

export function unionOfLiterals<T extends Commands>(constants: readonly T[]) {
  const literals = constants.map(x => z.literal(x)) as unknown as readonly [
    z.ZodLiteral<T>,
    z.ZodLiteral<T>,
    ...z.ZodLiteral<T>[],
  ];
  return z.union(literals);
}