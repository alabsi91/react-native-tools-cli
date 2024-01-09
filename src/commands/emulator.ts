import { $ } from '@utils/cli-utils.js';
import { askToChooseDevice } from '@utils/utils.js';
import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';

const emulatorCommandPath = process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'emulator', 'emulator') : 'emulator';

async function isEmulatorCommandExists() {
  try {
    const output = await $`${emulatorCommandPath} -help`;
    if (output) return true;
    return false;
  } catch (error) {
    return false;
  }
}

async function getListOfEmulators() {
  const stdout = await $`${emulatorCommandPath} -list-avds`;
  const devices = stdout
    .split('\n')
    .filter(e => e.trim() && !e.startsWith('INFO'))
    .map(e => e.trim());
  return devices;
}

function runAnEmulator(emulatorName: string) {
  /* Spawning a new process. */
  spawn(emulatorCommandPath, ['-avd', emulatorName], { detached: false, stdio: 'ignore', windowsHide: true, timeout: 10000 }).unref();
}

export async function emulatorCommand(emulatorName?: string) {
  const isEmulator = await isEmulatorCommandExists();
  if (!isEmulator) {
    console.log(chalk.red('\n⛔ [emulator] is not found on your machine !!\n'));
    process.exit(1);
  }

  const devices = await getListOfEmulators();

  // if emulatorName is provided
  if (typeof emulatorName === 'string') {
    if (!devices.includes(emulatorName)) {
      console.log('\n⛔', chalk.yellow(emulatorName), chalk.red('is not found !!\n'));
      process.exit(1);
    }

    runAnEmulator(emulatorName);
    return;
  }

  let targetEmulator: string;

  if (devices.length === 0) {
    console.log(chalk.red('\n⛔ No emulators devices found !!\n'));
    process.exit(1);
  }

  if (devices.length > 1) {
    console.log(chalk.yellow('Found more than 1 device'));
    targetEmulator = await askToChooseDevice(devices);
  }

  targetEmulator = devices[0];

  console.log(chalk.yellow('\n🚀 Opening'), chalk.cyan(targetEmulator), chalk.yellow('emulator ...\n'));

  runAnEmulator(targetEmulator);
}
