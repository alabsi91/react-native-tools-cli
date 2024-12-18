import chalk from "chalk";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { input, number, password, select } from "@inquirer/prompts";
import path from "path";
import { z } from "zod";
import { createSubcommand } from "zod-args-parser";

import { Log } from "@/cli-tools/logger.js";
import { $ } from "@/cli-tools/terminal.js";
import { askToEnterProjectRootPath, isReactNativeRootDir } from "@utils/utils.js";

async function askForKeyParams() {
  const answers = {
    fileName: await input({
      default: "release",
      message: "Key file name (without extension) :",
    }),

    alias: await input({
      default: "business",
      message: "Alias: Identifier of the app a single entity inside the `.keystore` :",
    }),

    cn: await input({
      default: "Ahmed ALABSI",
      message: "cn: full name of the person or organization :",
    }),

    ou: await input({
      default: "JavaSoft",
      message: "ou: Organizational Unit that creates the project :",
    }),

    o: await input({
      default: "Sun",
      message: "o: Organization owner of the whole project :",
    }),

    c: await input({
      default: "US",
      message: "c: The country short code :",
    }),

    validity: await number({
      default: 2000,
      message: "validity: Amount of days the app will be valid with this `.keystore` :",
    }),

    keypass: await password({
      message: "keypass: Password for protecting that specific alias :",
    }),

    storepass: await password({
      message: "storepass: Password for protecting the whole `.keystore` content :",
    }),

    usedFor: await select<"both" | "debug" | "release">({
      default: "both",
      message: "Use this key for :",
      choices: ["both", "debug", "release"],
    }),
  };

  return answers;
}

async function generateAndroidKeyCommand(projectPath: string) {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    Log.error("\nThis script must be run in a react-native project !!\n");
    projectPath = await askToEnterProjectRootPath();
  }
  const { alias, c, cn, fileName, keypass, o, ou, storepass, validity, usedFor } = await askForKeyParams();

  // check if the key if already exits
  if (existsSync(path.join(projectPath, "android", "app", `${fileName}.keystore`))) {
    Log.error("\nkey with the same name is already exits !!\n");
    process.exit(1);
  }

  // generate the key and save it in android/app
  try {
    await $`keytool -genkeypair -dname "cn=${cn}, ou=${ou}, o=${o}, c=${c}" -alias ${alias} -keypass ${keypass} -keystore ${path.join(
      projectPath,
      "android",
      "app",
      `${fileName}.keystore`,
    )} -storepass ${storepass} -validity ${(validity ?? 2000).toString()}`;
  } catch (error) {
    Log.error("\nError while generating the key !!\n");
    console.log(error);
    process.exit(1);
  }

  // edit build.gradle
  const buildGradlePath = path.join(projectPath, "android", "app", "build.gradle");
  try {
    let str = await readFile(buildGradlePath, { encoding: "utf8" });
    const hasRelease = /signingConfigs[\s\S]*?{[\s\S]*?release[\s\S]*?store/.test(str);
    if (usedFor === "both") {
      str = str.replace(
        /debug[\s\S]*?}/,
        `debug {
            storeFile file('${fileName}.keystore')
            storePassword '${storepass}'
            keyAlias '${alias}'
            keyPassword '${keypass}'
          }`,
      );

      if (hasRelease) {
        str = str.replace(
          /release[\s\S]*?}/,
          `release {
            storeFile file('${fileName}.keystore')
            storePassword '${storepass}'
            keyAlias '${alias}'
            keyPassword '${keypass}'
          }`,
        );
      }
    }

    if (usedFor === "debug") {
      if (hasRelease) {
        str = str.replace(
          /debug[\s\S]*?}/,
          `debug {
              storeFile file('${fileName}.keystore')
              storePassword '${storepass}'
              keyAlias '${alias}'
              keyPassword '${keypass}'
          }`,
        );
      } else {
        // use current debug key as a release key;
        const currentDebugStr = str.match(/debug[\s\S]+?}/)?.[0].replace("debug", "release");
        str = str.replace(
          /debug[\s\S]*?}/,
          currentDebugStr +
            `
          debug {
              storeFile file('${fileName}.keystore')
              storePassword '${storepass}'
              keyAlias '${alias}'
              keyPassword '${keypass}'
          }`,
        );

        console.log(
          chalk.yellow(
            "The current debug key will be used as a release key, and the new one as the debug key; you can change that later.",
          ),
        );

        // use release key in release
        str = str.replace(/(buildTypes[\s\S]*?release[\s\S]*?signingConfig.+?)(debug)/, "$1release");
      }
    }

    if (usedFor === "release") {
      if (hasRelease) {
        str = str.replace(
          /release[\s\S]*?}/,
          `release {
              storeFile file('${fileName}.keystore')
              storePassword '${storepass}'
              keyAlias '${alias}'
              keyPassword '${keypass}'
          }`,
        );
      } else {
        str = str.replace(
          /(signingConfigs[\s\S]*?{[\s\S]*?)(debug)/,
          `$1release {
                storeFile file('${fileName}.keystore')
                storePassword '${storepass}'
                keyAlias '${alias}'
                keyPassword '${keypass}'
          }
  
          $2`,
        );

        // use release key in release
        str = str.replace(/(buildTypes[\s\S]*?release[\s\S]*?signingConfig.+?)(debug)/, "$1release");
      }
    }

    await writeFile(buildGradlePath, str, { encoding: "utf8" });
  } catch (error) {
    console.log(error);
  }
}

export const androidKeyCmdSchema = createSubcommand({
  name: "generate-key",
  description: "Generate android signing key and add it to build.gradle.",
  options: [
    {
      name: "path",
      type: z.string().default("").describe(" Specify the React Native root project path."),
    },
  ],
});

androidKeyCmdSchema.setAction(async results => {
  await generateAndroidKeyCommand(results.path);
});
