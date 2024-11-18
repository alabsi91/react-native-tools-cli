#!/usr/bin/env node

import gradient from "gradient-string";
import { safeParse } from "zod-args-parser";

import { CONSTANTS } from "@cli/terminal.js";
import { androidFontsCmdSchema } from "@commands/androidFontsCmd.js";
import { androidKeyCmdSchema } from "@commands/androidKeyCmd.js";
import { buildCommandCmdSchema } from "@commands/buildCmd.js";
import { changeAppVersionCmdSchema } from "@commands/changeVersionCmd.js";
import { cliSchema } from "@commands/cli.js";
import { emulatorCmdSchema } from "@commands/emulatorCmd.js";
import { helpCmdSchema } from "@commands/helpCmd.js";
import { installApkCmdSchema } from "@commands/installApkCmd.js";
import { runAndroidAppCmdSchema } from "@commands/launchAndroidAppCmd.js";
import { startServerCmdSchema } from "@commands/startServerCmd.js";

// ? 👇 title text gradient colors. for more colors see: `https://cssgradient.io/gradient-backgrounds`
const coolGradient = gradient([
  { color: "#FA8BFF", pos: 0 },
  { color: "#2BD2FF", pos: 0.5 },
  { color: "#2BFF88", pos: 1 },
]);

// ? `https://www.kammerl.de/ascii/AsciiSignature.php`     👈 to convert your app's title to ASCII art.
// ? `https://codebeautify.org/javascript-escape-unescape` 👈 escape your title's string for JavaScript.
console.log(
  coolGradient(
    String.raw`
 _____                 _     _   _       _   _             _______          _     
|  __ \               | |   | \ | |     | | (_)           |__   __|        | |    
| |__) |___  __ _  ___| |_  |  \| | __ _| |_ ___   _____     | | ___   ___ | |___ 
|  _  // _ \/ _  |/ __| __| | .   |/ _  | __| \ \ / / _ \    | |/ _ \ / _ \| / __|
| | \ \  __/ (_| | (__| |_  | |\  | (_| | |_| |\ V /  __/    | | (_) | (_) | \__ \
|_|  \_\___|\__,_|\___|\__| |_| \_|\__,_|\__|_| \_/ \___|    |_|\___/ \___/|_|___/
`,
  ),
);

// ⚠️ For testing in development mode only
const testArgs = ["help", "version"];

const args = CONSTANTS.isDev ? testArgs : process.argv.slice(2);

async function app() {
  const results = safeParse(
    args,
    cliSchema,
    emulatorCmdSchema,
    startServerCmdSchema,
    installApkCmdSchema,
    runAndroidAppCmdSchema,
    buildCommandCmdSchema,
    changeAppVersionCmdSchema,
    androidFontsCmdSchema,
    androidKeyCmdSchema,
    helpCmdSchema,
  );

  // ! Error
  if (!results.success) {
    console.error(results.error.message);
    process.exit(1);
  }
}

app(); // 🚀 Start the app.
