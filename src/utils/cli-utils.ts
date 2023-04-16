import chalk from 'chalk';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ZodType, SafeParseReturnType } from 'zod';

/**
 * - It takes the command line arguments, and returns an object with the arguments as key value pairs.
 * @example
 * ◽ Valid arguments syntax:
 *
 * ◽ -h                        a boolean flag.            ➡️  { h: true }
 * ◽ --help                    a boolean flag.            ➡️  { help: true }
 * ◽ --output=false            a boolean flag.            ➡️  { output: false }
 * ◽ --name=John               a key-value pair.          ➡️  { name: 'John' }
 * ◽ --full-name="John Doe"    a key-value pair.          ➡️  { fullName: 'John Doe' }
 * ◽ "C:\Program Files (x86)"  a string with quotes.      ➡️  { args: [ 'C:\\Program Files (x86)' ] }
 * ◽ C:\Users\Public           a string without spaces.   ➡️  { args: [ 'C:\\Users\\Public' ] }
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

/** ⚠️ if the terminal's window is resized while the spinner is running, weird behavior may occur. */
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
    /** stop with a none styled message. */
    log: function (logMessage: string) {
      stop();
      process.stdout.write(logMessage); // 🖨️ print end message to the console.
    },
  };
}

/** Spawns a shell then executes the command within that shell. */
export async function $(strings: TemplateStringsArray, ...values: string[]): Promise<string> {
  const command = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
  return (await promisify(exec)(command)).stdout.trim();
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface Option {
  flags: string;
  description: string;
}
interface PositionalArgument {
  name: string;
  description: string;
}
interface Options {
  scriptName: string;
  description: string;
  optionsList: Option[];
  examples?: string[];
  positionalArguments?: PositionalArgument[];
}

export function printHelpMessage(options: Options): void {
  console.log(chalk.bold('\ndescription:'));
  console.log('  ', options.description);
  console.log(chalk.bold('\nUsage:'));
  console.log(
    `  ${options.scriptName} [options]${
      options.positionalArguments ? `, ${options.positionalArguments.map(arg => `<${arg.name}>`).join(', ')}` : ''
    }\n`
  );
  console.log(chalk.bold('Options:'));

  for (const option of options.optionsList) {
    console.log(`  ${chalk.yellow(option.flags)},`);
    console.log(`    ${option.description}\n`);
  }

  if (options.positionalArguments) {
    console.log(chalk.bold('Positional Arguments:'));

    for (const arg of options.positionalArguments) {
      console.log(`  ${chalk.yellow(arg.name)},`);
      console.log(`    ${arg.description}\n`);
    }
  }

  if (options.examples) {
    console.log(chalk.bold('Examples:\n'));

    for (const example of options.examples) {
      console.log(`  ${chalk.gray(example)},`);
    }
  }
}
