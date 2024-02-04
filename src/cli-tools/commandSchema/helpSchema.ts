import chalk from 'chalk';
import { NO_COMMAND } from './parseSchema.js';

import type { AllowedOptionTypes, CommandSchema, PrintHelpOptions } from './types.js';

export function commandsSchemaToHelpSchema(schema: CommandSchema[], cliName?: string, cliDescription?: string, usage?: string) {
  const getType = (item: AllowedOptionTypes) => {
    // literal
    if ('value' in item) return 'literal';
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

  const getSyntax = (name: string, item: AllowedOptionTypes) => {
    const type = getType(item);
    const cliName = getCliName(name);
    if (cliName.length === 2) return cliName; // on character E.g. -e
    if (type === 'boolean' || type === 'number') return `${cliName}=${type}`;
    if (type === 'string') return `${cliName}="${type}"`;
    if (type === 'literal' && 'value' in item) {
      if (typeof item.value === 'number') return `${cliName}=${item.value.toString()}`;
      return `${cliName}="${item.value}"`;
    }

    return cliName;
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
          syntax: getSyntax(o.name, o.type),
          isOptional: o.type.isOptional(),
          description: o.type.description,
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
            syntax: getSyntax(o.name, o.type),
            isOptional: o.type.isOptional(),
            description: o.type.description,
            example: o.example,
            aliases: o.aliases && o.aliases.map(a => getCliName(a)),
          })),
      })),
  };
}

export function printHelpFromSchema(
  schema: ReturnType<typeof commandsSchemaToHelpSchema>,
  {
    includeCommands,
    includeDescription = true,
    includeUsage = true,
    includeGlobalOptions = true,
    includeOptionAliases = true,
    includeOptionExample = true,
    includeCommandAliases = true,
    includeCommandExample = true,
    includeCommandArguments = true,
    includeGlobalArguments = true,
    showOptionalKeyword = true,
    showRequiredKeyword = true,
    includeOptionsType = true,
  }: PrintHelpOptions = {},
) {
  /** Colors */
  const c = {
    title: chalk.bold.blue.inverse,

    aliasesTitle: chalk.white.dim,
    aliases: chalk.hex('#00BCD4'),

    exampleTitle: chalk.white.dim,
    example: chalk.hex('#FF9800'),

    argumentsTitle: chalk.white.dim,
    arguments: chalk.white,

    command: chalk.bold.yellow,
    options: chalk.cyan,
    description: chalk.white,
    value: chalk.magenta,
    optional: chalk.italic.dim,
    dim: chalk.white.dim,
  };

  // Get longest indents
  const longestCommandName = Math.max(...schema.commands.map(command => command.name?.length ?? 0));
  const longestGlobalSyntax = Math.max(...schema.global.options.map(option => option?.syntax?.length ?? 0));
  const longestSyntax = Math.max(
    ...schema.commands.map(command =>
      command.options ? Math.max(...command.options.map(option => option.syntax?.length ?? 0), 0) : 0,
    ),
  );
  const longest = Math.max(longestCommandName, longestGlobalSyntax, longestSyntax);

  /** Add colors for the options syntax prop. E.g. --output="string" */
  const formatSyntax = (syntax: string) => {
    if (syntax.includes('=')) {
      const [part1, part2] = syntax.split('=');
      if (!includeOptionsType) return c.options(part1, indent(part2.length)); // don't show type
      return c.options(part1) + chalk.reset('=') + c.value(part2.replace(/"/g, c.dim('"')));
    }
    return c.options(syntax);
  };

  /** New line */
  const nl = (count: number) => '\n'.repeat(count);

  /** Space */
  const indent = (count: number) => ' '.repeat(count);

  /** Print a styled title */
  const printTitle = (title: string) => {
    console.log(c.title(` ${title} `));
  };

  /** Print CLI description */
  const printCliDescription = () => {
    if (schema.description) {
      printTitle('Description');
      console.log(nl(1), indent(2), c.dim('-'), c.description(schema.description), nl(1));
    }
  };

  /** Print CLI usage */
  const printCliUsage = () => {
    const usage = schema.usage ?? schema.name + c.command(' <command>') + c.options(' [options]') + c.argumentsTitle(' [args]');
    printTitle('Usage');
    console.log(nl(1), indent(2), c.dim('$'), usage, nl(1));
  };

  /** Print an option */
  const printOption = (option: {
    syntax: string;
    isOptional: boolean;
    description?: string;
    example?: string;
    aliases?: string[];
  }) => {
    const { syntax, isOptional, description, example, aliases } = option;
    console.log(nl(1), indent(2), formatSyntax(syntax), indent(longest + 4 - syntax.length), c.description(description ?? ''));

    if (isOptional && showOptionalKeyword) {
      process.stdout.write(indent(4) + c.optional('optional') + indent(longest - 2));
    } else if (!isOptional && showRequiredKeyword) {
      process.stdout.write(indent(4) + c.optional('required') + indent(longest - 2));
    } else {
      process.stdout.write(indent(longest + 10));
    }

    if (example && includeOptionExample) {
      process.stdout.write(c.exampleTitle('example:   ') + c.example(example) + nl(1) + indent(longest + 10));
    }

    if (aliases && aliases.length && includeOptionAliases) {
      process.stdout.write(c.aliasesTitle('aliases:   ') + c.aliases(aliases.join(c.dim(', '))) + nl(1));
    }

    if ((!example || !includeOptionExample) && (!aliases || !includeOptionAliases)) console.log('');
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

    // Command
    console.log(
      nl(1),
      c.dim('#'),
      c.command(name),
      c.description(description ? indent(longest + 6 - name.length) + description : ''),
    );

    if (example && includeCommandExample) {
      console.log(indent(longest + 9), c.exampleTitle('example:  '), c.example(example));
    }

    // Command Aliases
    if (aliases && aliases.length && includeCommandAliases) {
      console.log(indent(longest + 9), c.aliasesTitle('aliases:  '), c.aliases(aliases.join(c.dim(', '))));
    }

    // Command Arguments Description
    if (argsDescription && includeCommandArguments) {
      console.log(indent(longest + 9), c.argumentsTitle('arguments:'), c.arguments(argsDescription));
    }
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

  console.log('');

  if (!includeGlobalOptions) return;

  const CliGlobalOptions = schema.global.options;

  if (CliGlobalOptions.length === 0) return;

  // * Global
  printTitle('Global');

  // Global Arguments Description
  if (schema.global.argsDescription && includeGlobalArguments) {
    console.log(
      nl(1),
      indent(2),
      c.argumentsTitle.bold('Arguments:'),
      indent(longest - 6),
      c.arguments(schema.global.argsDescription),
    );
  }

  // Global Options
  for (let i = 0; i < CliGlobalOptions.length; i++) printOption(CliGlobalOptions[i]);

  console.log('');
}
