import { $, Log } from '@utils/cli-utils.js';
import {
  adbCommandPath,
  askToChooseDevice,
  askToEnterProjectRootPath,
  getAdbDevices,
  isAdbCommandExists,
  isReactNativeRootDir,
} from '@utils/utils.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

async function getPackageName(cwd: string) {
  const buildGradlePath = path.join(cwd, 'android', 'app', 'build.gradle');
  const file = fs.readFileSync(buildGradlePath, { encoding: 'utf-8' });
  const packageName = /applicationId (?<package>.*)/.exec(file)?.groups?.package;

  if (!packageName) {
    Log.error("\nCouldn't find the", chalk.cyan('package name'), '!!\n');
    process.exit(1);
  }

  return packageName.replaceAll("'", '');
}

async function runApplication(deviceName: string, packageName: string, cwd: string) {
  await $`"${adbCommandPath}" -s ${deviceName} shell am start -n "${packageName}/.MainActivity"${{ cwd }}`;
}

export async function runAndroidAppCommand(deviceName?: string, projectPath = '') {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    Log.error('\nThis script must be run in a react-native project !!\n');
    projectPath = await askToEnterProjectRootPath();
  }

  const isAdb = await isAdbCommandExists();
  if (!isAdb) {
    Log.error('\n[adb] is not found on your machine !!\n');
    process.exit(1);
  }

  const devices = await getAdbDevices();
  let targetDevice: string | null;

  if (devices.length === 0) {
    Log.warn('\nNo connected devices found !!\n');
    process.exit(1);
  }

  if (typeof deviceName === 'string') {
    if (!devices.includes(deviceName)) {
      Log.error('\n⛔', chalk.yellow(deviceName), 'is not found !!\n');
      process.exit(1);
    }

    targetDevice = deviceName;
  } else {
    if (devices.length > 1) {
      Log.warn('\nFound more than 1 device\n');
      targetDevice = await askToChooseDevice(devices);
    } else {
      targetDevice = devices[0];
    }
  }

  const packageName = await getPackageName(projectPath);

  try {
    console.log(
      chalk.yellow('\n🚀 Starting'),
      chalk.cyan(packageName),
      chalk.yellow('in your device'),
      chalk.cyan(`(${targetDevice})`),
      chalk.yellow('...\n'),
    );
    await runApplication(targetDevice, packageName, projectPath);
  } catch (error) {
    Log.error('\nSomething went wrong !!\n');
    console.log(error);
    process.exit(1);
  }

  Log.success('\nDone!\n');
}
