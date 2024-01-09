import { $, progress, sleep } from '@utils/cli-utils.js';
import {
  askToChooseDevice,
  askToEnterProjectRootPath,
  getAdbDevices,
  isAdbCommandExists,
  isReactNativeRootDir,
  reverseTCP,
} from '@utils/utils.js';
import chalk from 'chalk';

const newTerminal = process.platform.startsWith('win') ? 'start ' : '';

async function start(resetCache: boolean, cwd: string) {
  $`${newTerminal} npx react-native start ${resetCache ? '--reset-cache' : ''}${{ cwd }}`;
}

export async function startServerCommand(deviceName?: string, resetCache = false, projectPath = '') {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    console.log(chalk.red('\n⛔ This script must be run in a react-native project !!\n'));
    projectPath =await askToEnterProjectRootPath();
  }

  const isAdb = await isAdbCommandExists();
  if (!isAdb) {
    console.log(chalk.red('\n⛔ [adb] is not found on your machine !!\n'));
    process.exit(1);
  }

  const devices = await getAdbDevices();
  let targetDevice: string | null;

  if (devices.length === 0) {
    console.log(chalk.yellow('\n⚠️ No connected devices found !!\n'));
    targetDevice = null;
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

  if (targetDevice) {
    await reverseTCP(targetDevice);
  }

  const loading = progress('Starting server...');
  await start(resetCache, projectPath);
  await sleep(2000);

  loading.success('Server started');
  process.exit(0);
}
