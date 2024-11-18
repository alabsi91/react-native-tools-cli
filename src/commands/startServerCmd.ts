import chalk from "chalk";
import { z } from "zod";
import { createSubcommand } from "zod-args-parser";

import { Log } from "@/cli-tools/logger.js";
import { spinner } from "@/cli-tools/spinner.js";
import { $, sleep } from "@/cli-tools/terminal.js";
import {
  askToChooseDevice,
  askToEnterProjectRootPath,
  getAdbDevices,
  isAdbCommandExists,
  isReactNativeRootDir,
  reverseTCP,
} from "@utils/utils.js";

const newTerminal = process.platform.startsWith("win") ? "start " : "";

function start(resetCache: boolean, cwd: string) {
  return $`${newTerminal} npx react-native start ${resetCache ? "--reset-cache" : ""}${{ cwd }}`;
}

async function startServerCommand(projectPath: string, deviceName?: string, resetCache = false) {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    Log.error("\nThis script must be run in a react-native project !!\n");
    projectPath = await askToEnterProjectRootPath();
  }

  const isAdb = await isAdbCommandExists();
  if (!isAdb) {
    Log.error("\n[adb] is not found on your machine !!\n");
    process.exit(1);
  }

  const devices = await getAdbDevices();
  let targetDevice: string | null;

  if (devices.length === 0) {
    Log.warn("\nNo connected devices found !!\n");
    targetDevice = null;
  }

  if (typeof deviceName === "string") {
    if (!devices.includes(deviceName)) {
      Log.error("\n", chalk.yellow(deviceName), "is not found !!\n");
      process.exit(1);
    }

    targetDevice = deviceName;
  } else {
    if (devices.length > 1) {
      Log.warn("\nFound more than 1 device\n");
      targetDevice = await askToChooseDevice(devices);
    } else {
      targetDevice = devices[0];
    }
  }

  if (targetDevice) {
    await reverseTCP(targetDevice);
    Log.info("\nReverse TCP on the device:", chalk.yellow(targetDevice), "\n");
  }

  const loading = spinner("Starting server...");
  start(resetCache, projectPath);
  await sleep(2000);

  loading.success("Server started");
  process.exit(0);
}

export const startServerCmdSchema = createSubcommand({
  name: "start-server",
  description: "Configure TCP and start JavaScript server.",
  options: [
    {
      name: "device",
      type: z.string().optional().describe("Specify a device to connect to before starting the server."),
    },
    {
      name: "path",
      type: z.string().default("").describe("Specify the React Native root project path."),
    },
    {
      name: "clear",
      type: z.boolean().optional().describe("Clear the cache before starting the server."),
      aliases: ["resetCache", "c"],
    },
  ],
});

startServerCmdSchema.setAction(async results => {
  const { device, clear, path } = results;
  await startServerCommand(path, device, clear);
});
