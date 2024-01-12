import { schemaIntoZodUnion } from './commandSchema.js';
import { commandsSchemaToHelpSchema, printHelp } from './helpSchema.js';
import { validateDevInput } from './validate.js';

import type { AllowedOptionTypes, CommandOptions, CommandSchema, ParseOptions, ParseReturnType } from './types.js';

export const NO_COMMAND = 'noCommandIsProvided';

function parseArguments(schema: CommandSchema[]) {
  const toBoolean = (str: string) => (/^--.+=\bfalse\b/.test(str) ? false : /^-\w$|^--[^=]+$/.test(str) ? true : null);
  const toNumber = (str: string) => (/--.+=[-+]?(\d*\.)?\d+$/.test(str) ? +str.replace(/^--.+=/, '') : null);
  const toString = (str: string) => (/^--.+=.+$/.test(str) ? str.replace(/^--.+=/, '') : null);
  const isCommand = (str: string) => schema.some(command => command.command === str);
  const isCommandAlias = (str: string) => schema.some(command => command.aliases && command.aliases.includes(str));
  const commandAliasToCommand = (alias: string) => schema.filter(s => s.aliases && s.aliases.includes(alias))[0].command;

  const isOptions = (str: string) =>
    schema.some(command => command.options && command.options.some(option => option.name === str));

  const isOptionAlias = (str: string) =>
    schema.some(command => command.options && command.options.some(option => option.aliases && option.aliases.includes(str)));

  const optionAliasToOption = (alias: string) => {
    for (const command of schema) {
      if (!command.options) continue;
      const matchingOption = command.options.find(option => option.aliases && option.aliases.includes(alias));
      if (matchingOption) return matchingOption.name;
    }
    return undefined;
  };

  const isNumber = (num: unknown): num is number => typeof num === 'number' && !Number.isNaN(num) && Number.isFinite(num);

  /** Get the key without the value E.g. `--output-text="text"` => `outputText` */
  const parseKey = (str: string) => {
    if (!str.startsWith('-')) return null;
    return str
      .replace(/^-{1,2}/, '')
      .replace(/=.+/, '')
      .replace(/-\w/gi, t => t.substring(1).toUpperCase());
  };

  const results: { command?: string; args: string[]; [key: string]: unknown } = { args: [] };
  const syntax: ('command' | 'option' | 'arg')[] = [];

  for (const str of process.argv.slice(2)) {
    const key = parseKey(str),
      boolean = toBoolean(str),
      number = toNumber(str),
      string = isNumber(number) ? null : toString(str),
      command = isCommand(str) ? str : null,
      commandAlias = isCommandAlias(str) ? str : null,
      arg = !str.startsWith('-') ? str : null,
      value = number ?? boolean ?? string ?? command ?? arg;

    // * options
    if (key !== null) {
      if (value === null) continue;

      if (isOptions(key)) {
        results[key] = value;
        syntax.push('option');
        continue;
      }

      if (isOptionAlias(key)) {
        const option = optionAliasToOption(key);
        if (option) results[option] = value;
        syntax.push('option');
        continue;
      }

      continue;
    }

    // * args
    if (arg && !command && !commandAlias) {
      results.args.push(arg);
      syntax.push('arg');
      continue;
    }

    // * command
    if (command || commandAlias) {
      const parsedCommand = command || commandAliasToCommand(commandAlias!);
      results.command = parsedCommand;
      syntax.push('command');
      continue;
    }
  }

  return { results, syntax };
}

export function parse<T extends CommandSchema[]>(...params: T): ParseReturnType<T>;
export function parse<
  T extends CommandSchema[],
  NAME extends string,
  TYPE extends AllowedOptionTypes,
  OPTIONS_ARRAY extends CommandOptions<NAME, TYPE>,
>(...params: [...T, ParseOptions<OPTIONS_ARRAY>]): ParseReturnType<[...T, { command: undefined; options: OPTIONS_ARRAY[] }]>;

export function parse<T extends CommandSchema[]>(...params: T): ParseReturnType<T> {
  const options = ('globalOptions' in params[params.length - 1] ? params.pop() : {}) as ParseOptions;
  const commands = params as T;

  if (options.globalOptions) {
    commands.unshift({
      command: NO_COMMAND,
      options: options.globalOptions,
    });
  }

  // validate schema and throw error if it fails
  if (options.validateSchema !== false) validateDevInput(commands);

  const zodUnion = schemaIntoZodUnion(commands);
  const { results } = parseArguments(commands);

  const HelpSchema = commandsSchemaToHelpSchema(commands, options.cliName, options.description, options.usage);
  parse.printHelp = () => printHelp(HelpSchema);

  // todo: check if the syntax is valid
  return zodUnion.safeParse(results);
}

parse.printHelp = () => {};
