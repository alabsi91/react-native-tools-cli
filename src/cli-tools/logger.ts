import chalk, { type ChalkInstance } from "chalk";

const logConfig = {
  titleWidth: 15,
  spacer: " -",
  style: {
    success: chalk.green,
    error: chalk.red,
    fatal: chalk.red,
    warning: chalk.yellow,
    info: chalk.cyan,
    log: chalk.white,
    spacer: chalk.dim,
  },
};

/**
 * - Prints a styled message to the console.
 *
 * @example
 *   Log("Hello World!"); // Prints: | LOG | Hello World! |
 *   Log.info("Hello World!"); // Prints: | INFO | Hello World! |
 *   Log.error("Hello World!"); // Prints: | ERROR | Hello World! |
 *   Log.fatal("Hello World!"); // Prints: | FATAL | Hello World! |
 *   Log.warn("Hello World!"); // Prints: | WARNING | Hello World! |
 */
export function Log(...messages: unknown[]) {
  console.log(formatLogTitle("LOG", logConfig.style.log), ...messages);
}

Log.warn = (...messages: string[]) => {
  logFormatter("WARNING", logConfig.style.warning, ...messages);
};

Log.success = (...messages: string[]) => {
  logFormatter("SUCCESS", logConfig.style.success, ...messages);
};

Log.error = (...messages: string[]) => {
  logFormatter("ERROR", logConfig.style.error, ...messages);
};

/** - Prints a styled error message to the console and exits the process. */
Log.fatal = (...messages: string[]) => {
  logFormatter("FATAL", logConfig.style.fatal, ...messages);
  process.exit(1);
};

Log.info = (...messages: string[]) => {
  logFormatter("INFO", logConfig.style.info, ...messages);
};

function formatLogTitle(title: string, style: ChalkInstance) {
  const width = logConfig.titleWidth - 2; // because we are adding 2 characters
  const paddingLength = title.length >= width ? 0 : (width - title.length) / 2;
  const paddingStart = " ".repeat(paddingLength);
  const paddingEnd = " ".repeat(paddingLength);

  title = paddingStart + title + paddingEnd;

  // Ensure that the final string has width length
  title = title.padEnd(width, " ");

  // apply style
  title = style("|") + style.bold.inverse(title) + style("|");

  return title;
}

function logFormatter(title: string, style: ChalkInstance, ...messages: string[]) {
  const { prefixNewlines, content, suffixNewlines } = splitOnNewline(messages);
  const formattedTitle = formatLogTitle(title, style);

  const splitByNewLines = content.split("\n");

  let message = "";
  for (let i = 0; i < splitByNewLines.length; i++) {
    if (i > 0) {
      const width = logConfig.titleWidth / logConfig.spacer.length;
      const spacer = logConfig.spacer.repeat(width).padEnd(logConfig.titleWidth);
      message += "\n" + logConfig.style.spacer(spacer) + " ";
    }

    message += style(splitByNewLines[i]);
  }

  console.log(prefixNewlines + formattedTitle, message, suffixNewlines);
}

function splitOnNewline(input: string[]) {
  const message = input.join(" ");

  // Check for leading newlines
  let newlineStart = 0;
  while (newlineStart < message.length && message[newlineStart] == "\n") {
    newlineStart++;
  }

  // Check for trailing newlines
  let newlineEnd = message.length;
  while (newlineEnd > newlineStart && message[newlineEnd - 1] == "\n") {
    newlineEnd--;
  }

  const results = {
    prefixNewlines: message.substring(0, newlineStart),
    content: message.substring(newlineStart, newlineEnd),
    suffixNewlines: message.substring(newlineEnd),
  };

  return results;
}
