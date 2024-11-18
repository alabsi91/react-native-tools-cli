import chalk from "chalk";
import { spawn } from "child_process";
import path from "path";
import { z } from "zod";
import { createSubcommand } from "zod-args-parser";

import { Log } from "@/cli-tools/logger.js";
import { $ } from "@/cli-tools/terminal.js";
import { askToChooseDevice } from "@utils/utils.js";

const emulatorCommandPath = process.env.ANDROID_HOME
  ? path.join(process.env.ANDROID_HOME, "emulator", "emulator")
  : "emulator";

async function isEmulatorCommandExists() {
  try {
    const output = await $`${emulatorCommandPath} -help`;
    if (output) return true;
    return false;
  } catch (_error) {
    return false;
  }
}

async function getListOfEmulators() {
  const stdout = await $`${emulatorCommandPath} -list-avds`;
  const devices = stdout
    .split("\n")
    .filter(e => e.trim() && !e.startsWith("INFO"))
    .map(e => e.trim());
  return devices;
}

function runAnEmulator(emulatorName: string) {
  /* Spawning a new process. */
  spawn(emulatorCommandPath, ["-avd", emulatorName], {
    detached: false,
    stdio: "ignore",
    windowsHide: true,
    timeout: 10000,
  }).unref();
}

async function emulatorCommand(emulatorName?: string) {
  const isEmulator = await isEmulatorCommandExists();
  if (!isEmulator) {
    Log.error("\n[emulator] command is not found on your machine !!");
    process.exit(1);
  }

  const devices = await getListOfEmulators();

  // if emulatorName is provided
  if (typeof emulatorName === "string") {
    if (!devices.includes(emulatorName)) {
      Log.error("\n", chalk.yellow(emulatorName), "is not found !!\n");
      process.exit(1);
    }

    runAnEmulator(emulatorName);
    return;
  }

  let targetEmulator: string;

  if (devices.length === 0) {
    Log.error("\nNo emulator devices found !!\n");
    process.exit(1);
  }

  if (devices.length > 1) {
    Log.warn("\nFound more than 1 device\n");
    targetEmulator = await askToChooseDevice(devices);
  } else {
    targetEmulator = devices[0];
  }

  Log.info("\n🚀 Opening", chalk.yellow(targetEmulator), "emulator ...\n");

  runAnEmulator(targetEmulator);
}

export const emulatorCmdSchema = createSubcommand({
  name: "emulator",
  description: "Launch an emulator",
  options: [
    {
      name: "device",
      type: z.string().optional().describe("Specify a device to connect to before starting the server."),
    },
  ],
});

emulatorCmdSchema.setAction(async results => {
  await emulatorCommand(results.device);
});
