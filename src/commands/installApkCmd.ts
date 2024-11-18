import chalk from "chalk";
import { existsSync } from "fs";
import { select } from "@inquirer/prompts";
import path from "path";
import { z } from "zod";
import { createSubcommand } from "zod-args-parser";

import { Log } from "@/cli-tools/logger.js";
import { spinner } from "@/cli-tools/spinner.js";
import {
  adbInstallApk,
  askToChooseDevice,
  askToEnterProjectRootPath,
  getAdbDevices,
  getDeviceArchitecture,
  isAdbCommandExists,
  isReactNativeRootDir,
} from "@utils/utils.js";

async function askToChooseVariant() {
  const variant = await select<"debug" | "release">({
    message: "Choose a variant :",
    choices: ["debug", "release"],
  });

  return variant;
}

async function installApkCommand(deviceName?: string, variant?: "debug" | "release", projectPath = "") {
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
  let targetDevice: string;

  if (devices.length === 0) {
    Log.error("\nNo connected devices found !!\n");
    process.exit(1);
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

  const variantName = variant ?? (await askToChooseVariant());

  const deviceArchitecture = await getDeviceArchitecture(targetDevice);

  let apkPath = path.join(
    projectPath,
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    variantName,
    `app-${deviceArchitecture}-${variantName}.apk`,
  );
  if (!existsSync(apkPath)) {
    apkPath = path.join(
      projectPath,
      "android",
      "app",
      "build",
      "outputs",
      "apk",
      variantName,
      `app-${variantName}.apk`,
    );
  }

  if (!existsSync(apkPath)) {
    console.log(chalk.red("\n⛔ APK not found !!\n"));
    process.exit(1);
  }

  const loading = spinner(
    chalk.yellow("⬇️ Installing the ") +
      chalk.cyan(variantName) +
      chalk.yellow(" variant on your device ") +
      chalk.cyan(`(${targetDevice})`) +
      chalk.yellow(" ..."),
  );

  try {
    await adbInstallApk(targetDevice, apkPath);
  } catch (error) {
    loading.error("Something went wrong !!");
    console.log(error);
    process.exit(1);
  }

  loading.success("APK installed successfully");
}

export const installApkCmdSchema = createSubcommand({
  name: "install-apk",
  description: "Install the built APK on the connected device.",
  options: [
    {
      name: "device",
      type: z.string().optional().describe("Specify a device to install the APK on."),
    },
    {
      name: "path",
      type: z.string().optional().describe("Specify the React Native root project path."),
    },
    {
      name: "debug",
      type: z.boolean().optional().describe("Install the debug variant."),
      aliases: ["d"],
    },
    {
      name: "release",
      type: z.boolean().optional().describe("Install the release variant."),
      aliases: ["r"],
    },
  ],
});

installApkCmdSchema.setAction(async results => {
  const { device, debug, release, path } = results;
  const variant = debug ? "debug" : release ? "release" : undefined;
  await installApkCommand(device, variant, path);
});
