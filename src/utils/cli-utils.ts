import chalk, { ColorName } from 'chalk';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

import type { ExecOptions, SpawnOptions } from 'child_process';
import type { SafeParseReturnType, ZodObject, ZodRawShape } from 'zod';

/**
 * - It takes the command line arguments, and returns an object with the arguments as key value pairs.
 *
 * @example
 *   ◽ Valid arguments syntax:
 *
 *   ◽ -h                        a boolean flag.            ➡️  { h: true }
 *   ◽ --help                    a boolean flag.            ➡️  { help: true }
 *   ◽ --output=false            a boolean flag.            ➡️  { output: false }
 *   ◽ --name=John               a key-value pair.          ➡️  { name: 'John' }
 *   ◽ --full-name="John Doe"    a key-value pair.          ➡️  { fullName: 'John Doe' }
 *   ◽ "C:\Program Files (x86)"  a string with quotes.      ➡️  { args: [ 'C:\\Program Files (x86)' ] }
 *   ◽ C:\Users\Public           a string without spaces.   ➡️  { args: [ 'C:\\Users\\Public' ] }
 *   ◽ start                     specified as a command.    ➡️  { commands: [ 'start' ] }
 */
export function parseArguments<T extends ZodObject<ZodRawShape>>(userArgs: T) {
  const results: { commands: string[]; args: string[]; [key: string]: unknown } = Object.assign({});

  const toBoolean = (str: string) => (/^--.+=\bfalse\b/.test(str) ? false : /^-\w$|^--[^=]+$/.test(str) ? true : null);
  const toNumber = (str: string) => (/--.+=[-+]?(\d*\.)?\d+$/.test(str) ? +str.replace(/^--.+=/, '') : null);
  const toString = (str: string) => (/^--.+=.+$/.test(str) ? str.replace(/^--.+=/, '') : null);
  const isCommand = (str: string) => !str.startsWith('-') && userArgs.shape.commands.safeParse([str]).success;
  const isNumber = (num: unknown): num is number => typeof num === 'number' && !Number.isNaN(num) && Number.isFinite(num);
  /** Get the key without the value E.g. `--output-text="text"` => `outputText` */
  const parseKey = (str: string) => {
    return str.startsWith('-')
      ? str
          .replace(/^-{1,2}/, '')
          .replace(/=.+/, '')
          .replace(/-\w/gi, t => t.substring(1).toUpperCase())
      : null;
  };

  for (const str of process.argv.slice(2)) {
    const key = parseKey(str),
      boolean = toBoolean(str),
      number = toNumber(str),
      string = isNumber(number) ? null : toString(str),
      command = isCommand(str) ? str : null,
      arg = !str.startsWith('-') ? str : null,
      value = number ?? boolean ?? string ?? command ?? arg;

    if (key === null && arg && !command) {
      // add to args array if exists
      if (Array.isArray(results.args)) {
        results.args.push(arg);
        continue;
      }
      // create args entry as array if it doesn't exist
      results.args = [arg];
      continue;
    }

    if (key === null && command) {
      // add to commands array if exists
      if (Array.isArray(results.commands)) {
        const commands = results.commands;
        commands.push(command);
        continue;
      }
      // create commands entry as array if it doesn't exist
      results.commands = [command];
      continue;
    }

    if (value !== null && key) results[key] = value;
  }

  return userArgs.safeParse(results) as SafeParseReturnType<T, z.infer<T>>;
}

// ? 💁 See `https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json` for more spinners.
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * ⚠️ if the terminal's window is resized while the spinner is running, weird behavior may occur.
 *
 * @example
 *   const loading = progress('Loading...'); // start the spinner
 *   loading.start('Downloading...'); // update the message without stopping the spinner
 *   loading.error('Error...'); // stop the spinner and print an styled message
 *   loading.success('Success!'); // stop the spinner and print an styled message
 *   loading.log('Log...'); // stop the spinner and print a message without styling
 *   loading.stop(); // stop the spinner
 */
export function progress(message: string, autoStopTimer = 0) {
  let rowNumber: number, // row number
    id: NodeJS.Timeout | null; // to save the interval id

  async function start(startMessage = message, timer = autoStopTimer) {
    if (id) clearInterval(id);
    process.stdin.setEncoding('utf8'); // set encoding to utf8
    process.stdin.setRawMode(true); // disable buffering

    process.stdin.once('readable', () => {
      const buf = process.stdin.read(), // read the buffer
        str = JSON.stringify(buf), // "\u001b[9;1R
        xy = /\[(.*)/g.exec(str)?.[0].replace(/\[|R"/g, '').split(';'), // get x and y coordinates
        pos = { rows: +(xy?.[0] || '0'), cols: +(xy?.[1] || '0') }; // get cursor position

      process.stdin.setRawMode(false); // disable raw mode

      rowNumber = pos.rows - (id ? 1 : 0); // set row number
      id = null;
      // animate the spinner with a message.
      let i = 0;
      id = setInterval(() => {
        process.stdout.cursorTo(0, rowNumber); // ⤴️ move cursor to the start of the line.
        process.stdout.clearLine(0); // 🧹 clear first progress line.
        const spinner = chalk.cyan(frames[i++ % frames.length]); // get next frame
        const loadingMessage = chalk.yellow(startMessage); // ✉️ user message.
        process.stdout.write(`${spinner}  ${loadingMessage}`); // 🖨️ print spinner to the console.
      }, 80);
    });

    process.stdin.resume();
    process.stdout.write('\u001b[6n'); // will report the cursor position to the application

    // 🕐 wait for a certain amount of time before stopping the spinner.
    if (timer) {
      await sleep(timer);
      stop();
    }
  }

  function stop() {
    if (!id) return;
    clearInterval(id); // 🛑 stop the animation.
    id = null;
    process.stdout.cursorTo(0, rowNumber); // ⤴️ move cursor to the start of the line.
    process.stdout.clearLine(0); // 🧹 clear the progress line.
  }

  start(); // 🚀 start the spinner.

  // ↪️ return a function to stop the spinner with a message.
  return {
    /** 🚀 start the spinner. this will stop the previous one. */
    start,
    /** 🛑 stop the animation and clear it. */
    stop,
    /** ✅ stop with a success styled message. */
    success: function (endMessage: string) {
      stop();
      Log.success(endMessage, '\n\n'); // 🖨️ print end message to the console.
    },
    /** ⛔ stop with an error styled message. */
    error: function (endMessage: string) {
      stop();
      Log.error(endMessage, '\n\n'); // 🖨️ print end message to the console.
    },
    /** Stop with a none styled message. */
    log: function (logMessage: string) {
      stop();
      process.stdout.write(logMessage); // 🖨️ print end message to the console.
    },
  };
}

/**
 * - Spawns a shell then executes the command within that shell.
 *
 * @example
 *   const stdout = await $`node -v`;
 *   // you can pass options, just make sure to pass it at the last:
 *   const stdout = await $`node -v ${{ cwd: 'project' }}`;
 */
export async function $(strings: TemplateStringsArray, ...values: [] | string[] | [...string[], ExecOptions]): Promise<string> {
  const command = strings.reduce((acc, str, i) => acc + str + (typeof values[i] === 'string' ? values[i] : ''), '');
  const options = (typeof values[values.length - 1] === 'object' ? values.pop() : {}) as ExecOptions;
  return (await promisify(exec)(command, options)).stdout.trim();
}

export function executeCommand(command: string, args: readonly string[], options: SpawnOptions) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, options);
    const output = '';

    childProcess.on('close', code => {
      if (code === 0) {
        resolve(output);
        return;
      }

      reject(new Error(`Command exited with code ${code}`));
    });
  });
}

/**
 * - Execute a command in the shell, and pass the stdout to the parent process.
 *
 * @example
 *   await cmdPassThrough`node -v`;
 *   // you can pass options, just make sure to pass it at the last:
 *   await cmdPassThrough`node -v ${{ cwd: 'project' }}`;
 */
export function cmdPassThrough(strings: TemplateStringsArray, ...values: [] | string[] | [...string[], SpawnOptions]) {
  const strArr = strings
    .reduce((acc, str, i) => acc + str + (typeof values[i] === 'string' ? values[i] : ''), '')
    .split(' ')
    .filter(Boolean);
  const command = strArr[0];
  const args = strArr.slice(1);
  const options = (typeof values[values.length - 1] === 'object' ? values.pop() : {}) as SpawnOptions;
  return executeCommand(command, args, { stdio: 'inherit', shell: true, ...options });
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Removes ANSI escape codes for terminal colors from a given input string. */
export function cleanTerminalColors(inputString: string) {
  // eslint-disable-next-line no-control-regex
  const colorRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  const cleanedString = inputString.replace(colorRegex, '');
  return cleanedString;
}

const formatLogTitle = (title: string, color: ColorName) => {
  title = ' '.repeat(3) + title.padEnd(10);
  return chalk[color]('|') + chalk[color].bold.inverse(title) + chalk[color]('|');
};
function getNewlines(messages: string[]) {
  const message = messages.join('');
  const newlineRegex = /^(\s*[\n\r]+)/;
  const match = message.match(newlineRegex);

  if (match) {
    const newlines = match[0];
    const afterNewline = message.substring(match[0].length);
    return { newlines, afterNewline };
  }

  return { newlines: '', afterNewline: message };
}

/**
 * - Prints a styled message to the console.
 *
 * @example
 *   Log('Hello World!'); // Prints: | LOG | Hello World! |
 *   Log.info('Hello World!'); // Prints: | INFO | Hello World! |
 *   Log.error('Hello World!'); // Prints: | ERROR | Hello World! |
 *   Log.warn('Hello World!'); // Prints: | WARNING | Hello World! |
 */
export function Log(...messages: unknown[]) {
  console.log(formatLogTitle('LOG', 'white'), ...messages);
}
Log.warn = (...messages: string[]) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines, formatLogTitle('WARNING', 'yellow'), chalk.bold.yellow(afterNewline));
};
Log.success = (...messages: string[]) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines, formatLogTitle('SUCCESS', 'green'), chalk.bold.green(afterNewline));
};
Log.error = (...messages: string[]) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines, formatLogTitle('ERROR', 'red'), chalk.bold.red(afterNewline));
};
Log.info = (...messages: string[]) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines, formatLogTitle('INFO', 'blue'), chalk.bold.blue(afterNewline));
};
