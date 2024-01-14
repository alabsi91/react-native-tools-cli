import chalk, { type ColorName } from 'chalk';

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
  console.log(newlines + formatLogTitle('WARNING', 'yellow'), chalk.yellow(afterNewline));
};

Log.success = (...messages: string[]) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines + formatLogTitle('SUCCESS', 'green'), chalk.green(afterNewline));
};

Log.error = (...messages: string[]) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines + formatLogTitle('ERROR', 'red'), chalk.red(afterNewline));
};

Log.info = (...messages: string[]) => {
  const { newlines, afterNewline } = getNewlines(messages);
  console.log(newlines + formatLogTitle('INFO', 'blue'), chalk.blue(afterNewline));
};

function formatLogTitle(title: string, color: ColorName) {
  title = ' '.repeat(3) + title.padEnd(10);
  return chalk[color]('|') + chalk[color].bold.inverse(title) + chalk[color]('|');
}

function getNewlines(messages: string[]) {
  const message = messages.join(' ');
  const newlineRegex = /^(\s*[\n\r]+)/;
  const match = message.match(newlineRegex);

  if (match) {
    const newlines = match[0];
    const afterNewline = message.substring(match[0].length);
    return { newlines, afterNewline };
  }

  return { newlines: '', afterNewline: message };
}
