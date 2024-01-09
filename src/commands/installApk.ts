import { progress } from '@utils/cli-utils.js';
import {
  adbInstallApk,
  askToChooseDevice,
  askToEnterProjectRootPath,
  getAdbDevices,
  getDeviceArchitecture,
  isAdbCommandExists,
  isReactNativeRootDir,
} from '@utils/utils.js';
import chalk from 'chalk';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import path from 'path';

async function askToChooseVariant() {
  const { variant } = await inquirer.prompt<{ variant: 'debug' | 'release' }>([
    {
      type: 'list',
      name: 'variant',
      message: 'Choose a device :',
      choices: ['debug', 'release'],
    },
  ]);

  return variant;
}

export async function installApkCommand(deviceName?: string, variant?: 'debug' | 'release', projectPath = '') {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    console.log(chalk.red('\n⛔ This script must be run in a react-native project !!\n'));
    projectPath = await askToEnterProjectRootPath();
  }

  const isAdb = await isAdbCommandExists();
  if (!isAdb) {
    console.log(chalk.red('\n⛔ [adb] is not found on your machine !!\n'));
    process.exit(1);
  }

  const devices = await getAdbDevices();
  let targetDevice: string;

  if (devices.length === 0) {
    console.log(chalk.red('\n⛔ No connected devices found !!\n'));
    process.exit(1);
  }

  if (typeof deviceName === 'string') {
    if (!devices.includes(deviceName)) {
      console.log('\n⛔', chalk.yellow(deviceName), chalk.red('is not found !!\n'));
      process.exit(1);
    }

    targetDevice = deviceName;
  } else {
    if (devices.length > 1) {
      console.log(chalk.yellow('Found more than 1 device'));
      targetDevice = await askToChooseDevice(devices);
    } else {
      targetDevice = devices[0];
    }
  }

  const variantName = variant ?? (await askToChooseVariant());

  const deviceArchitecture = await getDeviceArchitecture(targetDevice);

  let apkPath = path.join(
    projectPath,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    variantName,
    `app-${deviceArchitecture}-${variantName}.apk`,
  );
  if (!existsSync(apkPath)) {
    apkPath = path.join(projectPath, 'android', 'app', 'build', 'outputs', 'apk', variantName, `app-${variantName}.apk`);
  }

  if (!existsSync(apkPath)) {
    console.log(chalk.red('\n⛔ APK not found !!\n'));
    process.exit(1);
  }

  const loading = progress(
    chalk.yellow('⬇️ Installing the ') +
      chalk.cyan(variantName) +
      chalk.yellow(' variant on your device ') +
      chalk.cyan(`(${targetDevice})`) +
      chalk.yellow(' ...'),
  );

  try {
    await adbInstallApk(targetDevice, apkPath);
  } catch (error) {
    loading.error('⛔ Something went wrong !!');
    console.log('⛔', chalk.red(error));
    process.exit(1);
  }

  loading.success('APK installed successfully');
}