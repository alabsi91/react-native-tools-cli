#!/usr/bin/env node

import gradient from "gradient-string";
import { safeParse } from "zod-args-parser";

import { CONSTANTS } from "@cli/terminal.js";
import { addUserCmdScheme } from "@commands/addUserCmd.js";
import { helpCmdSchema } from "@commands/helpCmd.js";
import { cliSchema } from "@commands/cli.js";

// ? 👇 title text gradient colors. for more colors see: `https://cssgradient.io/gradient-backgrounds`
const coolGradient = gradient([
  { color: "#FA8BFF", pos: 0 },
  { color: "#2BD2FF", pos: 0.5 },
  { color: "#2BFF88", pos: 1 },
]);

// ? `https://www.kammerl.de/ascii/AsciiSignature.php`     👈 to convert your app's title to ASCII art.
// ? `https://codebeautify.org/javascript-escape-unescape` 👈 escape your title's string for JavaScript.
console.log(
  coolGradient(String.raw` 
 __   __     ______     _____     ______       __     ______        ______     __         __   
/\ "-.\ \   /\  __ \   /\  __-.  /\  ___\     /\ \   /\  ___\      /\  ___\   /\ \       /\ \  
\ \ \-.  \  \ \ \/\ \  \ \ \/\ \ \ \  __\    _\_\ \  \ \___  \     \ \ \____  \ \ \____  \ \ \ 
 \ \_\\"\_\  \ \_____\  \ \____-  \ \_____\ /\_____\  \/\_____\     \ \_____\  \ \_____\  \ \_\
  \/_/ \/_/   \/_____/   \/____/   \/_____/ \/_____/   \/_____/      \/_____/   \/_____/   \/_/
                                                                                               
`),
);

// ⚠️ For testing in development mode only
const testArgs = ["--help"];

const args = CONSTANTS.isDev ? testArgs : process.argv.slice(2);

function main() {
  const results = safeParse(args, cliSchema, addUserCmdScheme, helpCmdSchema);

  // ! Error
  if (!results.success) {
    console.error(results.error.message);
    process.exit(1);
  }
}

main(); // 🚀 Start the app.
