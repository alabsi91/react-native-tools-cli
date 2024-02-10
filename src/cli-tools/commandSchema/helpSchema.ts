import chalk from 'chalk';
import { NO_COMMAND } from './parseSchema.js';

import type { AllowedOptionTypes, CommandSchema, PrintHelpOptions } from './types.js';

export function commandsSchemaToHelpSchema(schema: CommandSchema[], cliName?: string, cliDescription?: string, usage?: string) {
  const getType = (item: AllowedOptionTypes) => {
    // literal
    if ('value' in item) return typeof item.value;
    // string
    if (item.safeParse('string').success) return 'string';
    // number
    if (item.safeParse(1).success) return 'number';
    // boolean
    if (item.safeParse(true).success) return 'boolean';

    return 'string';
  };

  const getCliName = (name: string) => {
    if (name.length === 1) return '-' + name;
    return '--' + name.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
  };

  const global = schema.filter(c => c.command === NO_COMMAND)[0];
  return {
    name: cliName ?? 'node-cli',
    description: cliDescription,
    usage,
    global: {
      argsDescription: global?.argsType?.description,
      options:
        global?.options?.map(o => ({
          type: getType(o.type),
          name: getCliName(o.name),
          isOptional: o.type.isOptional(),
          description: o.description ?? o.type.description,
          example: o.example,
          aliases: o.aliases && o.aliases.map(a => getCliName(a)),
        })) ?? [],
    },
    commands: schema
      .filter(c => c.command !== NO_COMMAND)
      .map(c => ({
        name: c.command,
        description: c.description,
        example: c.example,
        argsDescription: c.argsType && c.argsType.description,
        aliases: c.aliases,
        options:
          c.options &&
          c.options.map(o => ({
            type: getType(o.type),
            name: getCliName(o.name),
            isOptional: o.type.isOptional(),
            description: o.description ?? o.type.description,
            example: o.example,
            aliases: o.aliases && o.aliases.map(a => getCliName(a)),
          })),
      })),
  };
}

/** Print */
const print = (...messages: string[]) => process.stdout.write(messages.join(' '));

/** Print line */
const println = (...messages: string[]) => console.log(...messages);

/** New line */
const ln = (count: number) => '\n'.repeat(count);

/** Space */
const indent = (count: number) => ' '.repeat(count);

/** Add indent before each new line */
const addIndentLn = (message: string, indent: string = '') => message.replace(/\n/g, `\n${indent}`);

export function printHelpFromSchema(
  schema: ReturnType<typeof commandsSchemaToHelpSchema>,
  {
    includeCommands,
    includeDescription = true,
    includeUsage = true,

    includeOptionsType = true,
    includeOptionDescription = true,
    includeOptionExample = true,
    includeOptionAliases = true,

    showOptionalKeyword = true,
    showRequiredKeyword = true,

    includeCommandDescription = true,
    includeCommandExample = true,
    includeCommandArguments = true,
    includeCommandAliases = true,

    includeGlobalOptions = true,
    includeGlobalArguments = true,
  }: PrintHelpOptions = {},
) {
  /** Colors */
  const c = {
    title: chalk.bold.blue.inverse,
    description: chalk.white,

    command: chalk.bold.yellow,

    option: chalk.cyan,
    type: chalk.magenta,

    aliasesTitle: chalk.white.dim,
    aliases: chalk.hex('#FF9800'),

    exampleTitle: chalk.white.dim,
    example: chalk.cyan,

    argumentsTitle: chalk.white.dim,
    arguments: chalk.white,

    optional: chalk.italic.dim,
    required: chalk.italic.dim,

    punctuation: chalk.white.dim,
  };

  /** Add colors for the options syntax prop. E.g. --output="string" */
  const formatSyntax = (name: string, type: string) => {
    if (!includeOptionsType) return { syntax: c.option(name), len: name.length };
    return { syntax: c.option(name) + chalk.white('=') + c.type(type), len: name.length + 1 + type.length };
  };

  // Get longest indents
  const longestCommandName = Math.max(...schema.commands.map(command => command.name?.length ?? 0));
  const longestGlobalSyntax = Math.max(...schema.global.options.map(option => formatSyntax(option.name, option.type).len), 0);
  const longestSyntax = Math.max(
    ...schema.commands.map(command =>
      command.options ? Math.max(...command.options.map(option => formatSyntax(option.name, option.type).len), 0) : 0,
    ),
  );
  const longest = Math.max(longestCommandName, longestGlobalSyntax, longestSyntax);

  /** Print a styled title */
  const printTitle = (title: string) => {
    println(c.title(` ${title} `));
  };

  /** Print CLI description */
  const printCliDescription = () => {
    if (!schema.description) return;
    printTitle('Description');
    println(ln(1), indent(2), c.punctuation('-'), c.description(schema.description), ln(1));
  };

  /** Print CLI usage */
  const printCliUsage = () => {
    const usage = schema.usage ?? schema.name + c.command(' <command>') + c.option(' [options]') + c.argumentsTitle(' [args]');
    printTitle('Usage');
    println(ln(1), indent(2), c.punctuation('$'), usage, ln(1));
  };

  /** Print an option */
  const printOption = (option: {
    name: string;
    type: string;
    isOptional: boolean;
    description?: string;
    example?: string;
    aliases?: string[];
  }) => {
    const { name, type, isOptional, description, example, aliases } = option;
    const { syntax, len: syntaxLen } = formatSyntax(name, type);

    let isOptionalRequiredPrinted = false;
    let isOptionalRequiredPrintedLast = true;
    const printOptionalRequired = () => {
      if (isOptionalRequiredPrinted) {
        print(ln(1), indent(longest + 9));
        isOptionalRequiredPrintedLast = false;
        return;
      }

      isOptionalRequiredPrinted = true;

      if (isOptional && showOptionalKeyword) {
        print(ln(1), indent(2), c.optional('optional'), indent(longest - 3));
        return;
      }

      if (!isOptional && showRequiredKeyword) {
        print(ln(1), indent(2), c.required('required'), indent(longest - 3));
        return;
      }

      print(ln(1), indent(longest + 9));
    };

    // Option syntax
    print(ln(1), indent(3));
    print(syntax);

    // space after syntax
    print(indent(longest + 6 - syntaxLen));

    // Option description
    if (description && includeOptionDescription) {
      print(c.description(addIndentLn(description, indent(longest + 10))));
      printOptionalRequired();
    }

    // print example
    if (example && includeOptionExample) {
      print(c.exampleTitle('example:'));
      print(indent(2), c.example(addIndentLn(example, indent(longest + 21))));
      printOptionalRequired();
    }

    // print aliases
    if (aliases && aliases.length && includeOptionAliases) {
      print(c.aliasesTitle('aliases:'));
      print(indent(2), c.aliases(aliases.join(c.punctuation(', '))));
      printOptionalRequired();
    }

    if (!isOptionalRequiredPrinted) printOptionalRequired();
    if (isOptionalRequiredPrintedLast) println();
  };

  const printCommand = (command: {
    name?: string;
    description?: string;
    example?: string;
    aliases?: string[];
    argsDescription?: string;
  }) => {
    const { name, description, example, aliases, argsDescription } = command;
    if (!name) return;

    let hasInformation = false; // to check if we print something after the command

    // Command
    print(ln(1), c.punctuation('#'), c.command(name));

    // space after the command
    print(indent(longest + 7 - name.length));

    // Command Description
    if (description && includeCommandDescription) {
      print(addIndentLn(description, indent(longest + 10)));
      print(ln(1), indent(longest + 9));
      hasInformation = true;
    }

    // Command Example
    if (example && includeCommandExample) {
      print(c.exampleTitle('example:'));
      print(indent(2), c.example(addIndentLn(example, indent(longest + 21))));
      print(ln(1), indent(longest + 9));
      hasInformation = true;
    }

    // Command Aliases
    if (aliases && aliases.length && includeCommandAliases) {
      print(c.aliasesTitle('aliases:'));
      print(indent(2), c.aliases(aliases.join(c.punctuation(', '))));
      print(ln(1), indent(longest + 9));
      hasInformation = true;
    }

    // Command Arguments Description
    if (argsDescription && includeCommandArguments) {
      print(c.argumentsTitle('arguments:'));
      print(indent(0), c.arguments(addIndentLn(argsDescription, indent(longest + 21))));
      println();
      hasInformation = true;
    }

    if (!hasInformation) println();
  };

  // * CLI Description
  if (includeDescription) printCliDescription();

  // * CLI Usage
  if (includeUsage) printCliUsage();

  // * Commands
  if ((schema.commands.length && !Array.isArray(includeCommands)) || (Array.isArray(includeCommands) && includeCommands.length)) {
    printTitle('Commands');

    for (let i = 0; i < schema.commands.length; i++) {
      const { name, description, example, aliases, argsDescription, options } = schema.commands[i];

      // Print only the specified command
      if (Array.isArray(includeCommands) && !includeCommands.includes(name)) continue;

      // Command
      printCommand({ name, description, example, aliases, argsDescription });

      // Command Options
      if (!options) continue;
      for (let o = 0; o < options.length; o++) printOption(options[o]);
    }
  }

  println();

  if (!includeGlobalOptions) return;

  const cliGlobalOptions = schema.global.options;

  if (cliGlobalOptions.length === 0) return;

  // * Global
  printTitle('Global');

  // Global Arguments Description
  if (schema.global.argsDescription && includeGlobalArguments) {
    print(ln(1), indent(3));
    print(c.argumentsTitle.bold('Arguments:'));
    print(indent(longest - 5), c.arguments(addIndentLn(schema.global.argsDescription, indent(longest + 10))));
    println();
  }

  // Global Options
  for (let i = 0; i < cliGlobalOptions.length; i++) printOption(cliGlobalOptions[i]);

  println();
}
