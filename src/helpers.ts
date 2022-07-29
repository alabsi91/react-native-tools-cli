import chalk from 'chalk';

/**
 * - It takes the command line arguments, and returns an object with the arguments as key value pairs.
 *
 * - Valid arguments syntax:
 * ◽ -h                        a boolean flag.            ➡️ `{ h: true }`.
 * ◽ --help                    a boolean flag.            ➡️ `{ help: true }`.
 * ◽ --output=false            a boolean flag.            ➡️ `{ output: false }`.
 * ◽ --name=John               a key-value pair.          ➡️ `{ name: 'John' }`.
 * ◽ --full-name="John Doe"    a key-value pair.          ➡️ `{ fullName: 'John Doe' }`.
 * ◽ "C:\Program Files (x86)"  a string with quates.      ➡️ `{ args: [ 'C:\Program Files (x86)' ] }`.
 * ◽ C:\Users\Public           a string without spaces.   ➡️ `{ args: [ 'C:\Users\Public' ] }`.
 */
export default function parseArgs<T>() {
  const results: T extends { [key: string]: unknown } ? T : { [key: string]: unknown } = Object.assign({});

  for (const arg of process.argv.slice(2)) {
    const key = arg.startsWith('-')
        ? arg
            .replace(/^-{1,2}/, '')
            .replace(/=.+/, '')
            .replace(/-\w/gi, t => t.substring(1).toUpperCase())
        : 'args', // get arg name
      boolean = /^--.+=\bfalse\b/.test(arg) ? false : /^-\w$|^--[^=]+$/.test(arg) ? true : null,
      number = /^--.+=\d+$/.test(arg) ? +arg.replace(/^--.+=/, '') : null,
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
  return results;
}

// you can get more frames from `cli-spinners` npm package
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/** ⚠️ if the terminal window is resized while the spinner is running, weird behavior may occur. */
export function progress(message: string, autoStopTimer = 0) {
  let rowNumber: number, // row number
    id: NodeJS.Timeout | undefined; // to save the interval id

  async function start(startMessage = message, timer = autoStopTimer) {
    stop(); // stop the previous spinner
    process.stdout.write('\n'); // start with a new line
    process.stdin.setEncoding('utf8'); // set encoding to utf8
    process.stdin.setRawMode(true); // disable buffering

    process.stdin.once('readable', () => {
      const buf = process.stdin.read(), // read the buffer
        str = JSON.stringify(buf), // "\u001b[9;1R
        xy = /\[(.*)/g.exec(str)?.[0].replace(/\[|R"/g, '').split(';'), // get x and y coordinates
        pos = { rows: +(xy?.[0] || '0'), cols: +(xy?.[1] || '0') }; // get cursor position

      process.stdin.setRawMode(false); // disable raw mode

      rowNumber = pos.rows; // set row number

      // animate the spinner with a message.
      let i = 0;
      id = setInterval(() => {
        process.stdout.cursorTo(0, rowNumber); // ⤴️ move cursor to the start of the line.
        process.stdout.clearLine(0); // 🧹 clear first progress line.
        const spinner = chalk.cyan(frames[i++ % frames.length]); // spinner text.
        const loadingMessage = chalk.yellow(startMessage); // 📧 user message.
        process.stdout.write(`${spinner} ${loadingMessage}`); // 🖨️ print spinner to the console.
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
    process.stdout.cursorTo(0, rowNumber); // ⤴️ move cursor to the start of the line.
    process.stdout.clearLine(0); // 🧹 clear the progress line.
  }

  start(); // 🚀 start the spinner.

  // ↪️ return a function to stop the spinner with a message.
  return {
    /** 🚀 start the spinner. this will stop the previous one */
    start,
    /** 🛑 stop the animation and clear it.  */
    stop,
    /** ✅ stop with a success styled message.  */
    success: function (endMessage: string) {
      stop();
      const successMessage = chalk.green(`✅ ${endMessage}`); // ✅ success message if isError is false
      process.stdout.write(`${successMessage}\n`); // 🖨️ print end message to the console.
    },
    /** 🛑 stop with an error styled message.  */
    error: function (endMessage: string) {
      stop();
      const errorMessage = chalk.red(`⛔ ${endMessage}`); // ⛔ error message if isError is true
      process.stdout.write(`${errorMessage}\n`); // 🖨️ print end message to the console.
    },
    /** 🛑 stop with a none styled message.  */
    log: function (logMessage: string) {
      stop();
      process.stdout.write(logMessage); // 🖨️ print end message to the console.
    },
  };
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
