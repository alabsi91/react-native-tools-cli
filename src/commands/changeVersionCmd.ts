import chalk from "chalk";
import { existsSync } from "fs";
import fs from "fs/promises";
import { input } from "@inquirer/prompts";
import path from "path";
import { z } from "zod";
import { createSubcommand } from "zod-args-parser";

import { Log } from "@cli/logger.js";
import { askToEnterProjectRootPath, isReactNativeRootDir } from "@utils/utils.js";

async function getPackageJson(projectPath = "") {
  const packageStr = await fs.readFile(path.join(projectPath, "package.json"), { encoding: "utf-8" });
  const packageJson = JSON.parse(packageStr);
  return packageJson;
}

async function askForVersion(defaultVersion: string) {
  // ask for the version input
  const version = await input({
    default: defaultVersion,
    message: "Enter the new app version: ",
  });

  return version;
}

async function changeAppVersionCommand(projectPath: string, version?: string) {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    Log.error("\nThis script must be run in a react-native project !!\n");
    projectPath = await askToEnterProjectRootPath();
  }

  const packageJson = await getPackageJson(projectPath);
  const currentVersion = packageJson.version;

  // print out the current version
  Log.info("\n", "The current version is :", chalk.yellow(currentVersion), "\n");

  // add one to the current version
  const numbers = currentVersion.split(".").map(Number);
  numbers[numbers.length - 1]++;
  const suggestedVersion = numbers.join(".");

  // ask for the version input if not provided
  version = version ?? (await askForVersion(suggestedVersion));

  // update package.json
  packageJson.version = version;
  const newPackageJson = JSON.stringify(packageJson, null, 2) + "\n";
  await fs.writeFile(path.join(projectPath, "package.json"), newPackageJson, { encoding: "utf-8" });

  // update build.gradle
  const buildGradlePath = path.join(projectPath, "android", "app", "build.gradle");
  if (!existsSync(buildGradlePath)) {
    Log.error("Error: the file:", chalk.yellow(`"${buildGradlePath}"`), "does not exists!");
    return;
  }

  const buildGradleStr = await fs.readFile(buildGradlePath, { encoding: "utf-8" });
  const newBuildGradleStr = buildGradleStr.replace(/(versionName\s+)(['|"]\d+\.\d+\.\d+['|"])/, `$1'${version}'`);
  await fs.writeFile(buildGradlePath, newBuildGradleStr, { encoding: "utf-8" });

  Log.success("\n", "The new version is:", chalk.yellow(version));
}

export const changeAppVersionCmdSchema = createSubcommand({
  name: "version",
  description: "Change the app version.",
  options: [
    {
      name: "path",
      type: z.string().default("").describe("Specify the React Native root project path."),
    },
    {
      name: "version",
      type: z.string().optional().describe("Specify the new app version."),
    },
  ],
});

changeAppVersionCmdSchema.setAction(async results => {
  const { path, version } = results;
  await changeAppVersionCommand(path, version);
});
