import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

import type { ExecOptions, SpawnOptions } from 'child_process';
import type { SafeParseReturnType, ZodType } from 'zod';

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
 */
export function parseArguments<T extends ZodType>(userArgs: T) {
  const results: z.infer<T> = Object.assign({});

  for (const arg of process.argv.slice(2)) {
    const key = arg.startsWith('-')
        ? arg
            .replace(/^-{1,2}/, '')
            .replace(/=.+/, '')
            .replace(/-\w/gi, t => t.substring(1).toUpperCase())
        : 'args', // get arg name
      boolean = /^--.+=\bfalse\b/.test(arg) ? false : /^-\w$|^--[^=]+$/.test(arg) ? true : null,
      number = /--.+=[-+]?(\d*\.)?\d+$/.test(arg) ? +arg.replace(/^--.+=/, '') : null,
      string = !number && /^--.+=.+$/.test(arg) ? arg.replace(/^--.+=/, '') : null,
      withoutFlag = !arg.startsWith('-') ? arg : null, // single string argument without a flag (e.g. 'C:\Program Files (x86)')
      value = number ?? boolean ?? string ?? withoutFlag;

    if (key === 'args' && withoutFlag) {
      // add to args array if exists
      if (Array.isArray(results[key])) {
        const args = results[key] as string[];
        args.push(withoutFlag);
        continue;
      }
      // create args entry as array if it doesn't exist
      results[key] = [withoutFlag];
      continue;
    }

    if (value !== null) results[key] = value;
  }

  const data: SafeParseReturnType<T, z.infer<T>> = userArgs.safeParse(results);

  return data;
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
      const successMessage = chalk.green(`✅ ${endMessage}`); // ✅ success message if isError is false
      process.stdout.write(`${successMessage}\n\n`); // 🖨️ print end message to the console.
    },
    /** ⛔ stop with an error styled message. */
    error: function (endMessage: string) {
      stop();
      const errorMessage = chalk.red(`⛔ ${endMessage}`); // ⛔ error message if isError is true
      process.stdout.write(`${errorMessage}\n\n`); // 🖨️ print end message to the console.
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
