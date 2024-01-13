import { Log } from '@/cli-tools/logger.js';
import { spinner } from '@/cli-tools/spinner.js';
import { $, sleep } from '@/cli-tools/terminal.js';
import Schema from '@schema';
import {
  askToChooseDevice,
  askToEnterProjectRootPath,
  getAdbDevices,
  isAdbCommandExists,
  isReactNativeRootDir,
  reverseTCP,
} from '@utils/utils.js';
import chalk from 'chalk';
import { z } from 'zod';

const newTerminal = process.platform.startsWith('win') ? 'start ' : '';

function start(resetCache: boolean, cwd: string) {
  $`${newTerminal} npx react-native start ${resetCache ? '--reset-cache' : ''}${{ cwd }}`;
}

export async function startServerCommand(deviceName?: string, resetCache = false, projectPath = '') {
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
    targetDevice = null;
  }

  if (typeof deviceName === 'string') {
    if (!devices.includes(deviceName)) {
      Log.error('\n', chalk.yellow(deviceName), 'is not found !!\n');
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

  if (targetDevice) {
    await reverseTCP(targetDevice);
  }

  const loading = spinner('Starting server...');
  await start(resetCache, projectPath);
  await sleep(2000);

  loading.success('Server started');
  process.exit(0);
}

startServerCommand.schema = Schema.createCommand({
  command: 'start-server',
  description: 'Configure TCP and start JavaScript server.',
  options: [
    {
      name: 'device',
      type: z.string().optional().describe('Specify a device to connect to before starting the server.'),
    },
    {
      name: 'path',
      type: z.string().optional().describe('Specify the React Native root project path.'),
    },
    {
      name: 'clear',
      type: z.boolean().optional().describe('Clear the cache before starting the server.'),
      aliases: ['reset-cache', 'c'],
    },
  ],
});
