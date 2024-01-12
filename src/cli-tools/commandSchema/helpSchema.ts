import chalk from 'chalk';
import { NO_COMMAND } from './parseSchema.js';

import type { AllowedOptionTypes, CommandSchema } from './types.js';

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

  return {
    name: cliName ?? 'rn-tools',
    description: cliDescription,
    usage,
    globalOptions: schema
      .filter(c => c.command === NO_COMMAND)
      .map(
        c =>
          c.options?.map(o => ({
            syntax: getSyntax(o.name, o.type),
            isOptional: o.type.isOptional(),
            description: o.type.description,
            aliases: o.aliases && o.aliases.map(a => getCliName(a)),
          })),
      )
      .flat(),
    commands: schema
      .filter(c => c.command !== NO_COMMAND)
      .map(c => ({
        name: c.command,
        description: c.description,
        aliases: c.aliases,
        options:
          c.options &&
          c.options.map(o => ({
            syntax: getSyntax(o.name, o.type),
            isOptional: o.type.isOptional(),
            description: o.type.description,
            aliases: o.aliases && o.aliases.map(a => getCliName(a)),
          })),
      })),
  };
}

export function printHelp(schema: ReturnType<typeof commandsSchemaToHelpSchema>) {
  const c = {
    title: chalk.bold.blue.inverse,
    optionsTitle: chalk.bold.hex('#00fff4'),
    command: chalk.bold.yellow,
    options: chalk.cyan,
    args: chalk.green,
    alias: chalk.hex('#00BCD4'),
    description: chalk.white,
    value: chalk.magenta,
    optional: chalk.italic.dim,
    dim: chalk.white.dim,
  };

  const formatSyntax = (syntax: string) => {
    if (syntax.includes('=')) {
      const [part1, part2] = syntax.split('=');
      return c.options(part1) + chalk.reset('=') + c.value(part2.replace(/"/g, c.dim('"')));
    }
    return c.options(syntax);
  };

  /** New line */
  const nl = (count: number) => '\n'.repeat(count);
  const indent = (count: number) => ' '.repeat(count);

  const longestCommandName = Math.max(...schema.commands.map(c => (c.name ? c.name.length : 0)));

  if (schema.description) {
    console.log(c.title(' Description '), nl(1));
    console.log(indent(2), c.dim('-'), c.description(schema.description), nl(1));
  }

  const usage = schema.usage ?? schema.name + c.command(' <command>') + c.options(' [options]') + c.args(' [args]');
  console.log(c.title(' Usage '), nl(1));
  console.log(indent(2), c.dim('$'), usage, nl(1));

  if (schema.commands.length) {
    console.log(c.title(' Commands '));

    for (let i = 0; i < schema.commands.length; i++) {
      const { name, description, aliases, options } = schema.commands[i];
      if (!name) continue;

      console.log(
        nl(1),
        c.dim('#'),
        c.command(name),
        description ? indent(longestCommandName + 5 - name.length) + c.dim('- ') + description : '',
      );

      if (aliases) {
        console.log(indent(longestCommandName + 8), c.dim.bold('Aliases:'), c.alias(aliases.join(c.dim(', '))));
      }

      if (!options) continue;

      // console.log(nl(1), indent(1), c.optionsTitle('Options:'));
      const longestOptionName = 2 + Math.max(...options.map(o => (o.syntax ? o.syntax.length : 0)));

      for (let o = 0; o < options.length; o++) {
        const { syntax, isOptional, description, aliases } = options[o];
        console.log(
          nl(1),
          indent(2),
          formatSyntax(syntax),
          indent(longestOptionName + 4 - syntax.length),
          c.optional(isOptional ? '[optional]' : '[required]'),
          description ? c.dim('- ') + description : '',
        );

        if (aliases) {
          console.log(indent(longestOptionName + 9), c.dim.bold('Aliases:'), c.alias(aliases.join(c.dim(', '))));
        }
      }
    }
  }

  console.log('');

  if (schema.globalOptions) {
    const globalOptions = schema.globalOptions.filter(Boolean) as NonNullable<(typeof schema.globalOptions)[number]>[];

    if (globalOptions.length === 0) return;

    console.log(c.title(' Global Options '));

    const longestOptionName = 2 + Math.max(...globalOptions.map(o => (o && o.syntax ? o.syntax.length : 0)));

    for (let i = 0; i < globalOptions.length; i++) {
      const { syntax, isOptional, description, aliases } = globalOptions[i];

      console.log(
        nl(1),
        indent(2),
        formatSyntax(syntax),
        indent(longestOptionName + 4 - syntax.length),
        c.optional(isOptional ? '[optional]' : '[required]'),
        description ? c.dim('- ') + description : '',
      );

      if (aliases) {
        console.log(indent(longestOptionName + 9), c.dim.bold('Aliases:'), c.alias(aliases.join(c.dim(', '))));
      }
    }
  }

  console.log('');
}
