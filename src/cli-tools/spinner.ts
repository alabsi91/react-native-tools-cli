import { Log } from '@cli/logger.js';
import { sleep } from '@cli/terminal.js';
import chalk from 'chalk';

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
export function spinner(message: string, autoStopTimer = 0) {
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
    success(endMessage: string) {
      stop();
      Log.success(endMessage, '\n'); // 🖨️ print end message to the console.
    },
    /** ⛔ stop with an error styled message. */
    error(endMessage: string) {
      stop();
      Log.error(endMessage, '\n'); // 🖨️ print end message to the console.
    },
    /** Stop with a none styled message. */
    log(logMessage: string) {
      stop();
      process.stdout.write(logMessage); // 🖨️ print end message to the console.
    },
  };
}
