import { z } from 'zod';

import { Log } from '@cli/logger.js';
import { CONSTANTS } from '@cli/terminal.js';
import { schemaIntoZodUnion } from './commandSchema.js';
import { commandsSchemaToHelpSchema, printHelpFromSchema } from './helpSchema.js';
import { validateDevInput } from './validate.js';

import type { CommandSchema, ParseOptions, ParseReturnType, ZodArray } from './types.js';

export const NO_COMMAND = 'noCommandIsProvided';

function parseArguments(schema: CommandSchema[]) {
  const toBoolean = (str: string) => (/^--.+=\bfalse\b/.test(str) ? false : /^-\w$|^--[^=]+$/.test(str) ? true : null);
  const toNumber = (str: string) => (/--.+=[-+]?(\d*\.)?\d+$/.test(str) ? +str.replace(/^--.+=/, '') : null);
  const toString = (str: string) => (/^--.+=.+$/.test(str) ? str.replace(/^--.+=/, '') : null);
  const isCommand = (str: string) => schema.some(command => command.command === str);
  const isCommandAlias = (str: string) => schema.some(command => command.aliases && command.aliases.includes(str));
  const commandAliasToCommand = (alias: string) => schema.filter(s => s.aliases && s.aliases.includes(alias))[0].command;

  const isOptionAlias = (command: string, str: string) => {
    const cmd = schema.filter(c => c.command === command)[0];
    if (!cmd || !cmd.options) return false;
    return cmd.options.some(option => option.aliases && option.aliases.includes(str));
  };

  const optionAliasToOption = (command: string, alias: string) => {
    const cmd = schema.filter(c => c.command === command)[0];
    if (!cmd || !cmd.options) return undefined;

    const matchingOption = cmd.options.find(option => option.aliases && option.aliases.includes(alias));
    if (matchingOption) return matchingOption.name;

    return undefined;
  };

  const isNumber = (num: unknown): num is number => typeof num === 'number' && !Number.isNaN(num) && Number.isFinite(num);

  /** Get the key without the value E.g. `--output-text="text"` => `outputText` */
  const parseKey = (str: string) => {
    const match = str.toLowerCase().match(/^--?[a-z]+(?:-[a-z]+)*/);
    if (!match || !match[0]) return null;
    return match[0].replace(/^--?/, '').replace(/-\w/gi, t => t.substring(1).toUpperCase());
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
      if (results.command && isOptionAlias(results.command, key)) {
        const option = optionAliasToOption(results.command, key);
        if (option) results[option] = value;
        syntax.push('option');
        continue;
      }

      results[key] = value;
      syntax.push('option');

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

export let printHelp = () => {
  Log.warn('Help is not implemented yet');
};

export function parse<T extends CommandSchema[]>(...params: T): ParseReturnType<T>;
export function parse<T extends CommandSchema[], const O extends ParseOptions<A>, const A extends ZodArray>(
  ...params: [...T, O]
  // @ts-expect-error undefined in globalOptions
): ParseReturnType<[...T, { command: undefined; argsType: O['argsType']; options: O['globalOptions'] }]>;
export function parse<T extends CommandSchema[]>(...params: T): ParseReturnType<T> {
  const options = ('globalOptions' in params[params.length - 1] ? params.pop() : {}) as ParseOptions;
  const commands = params as T;

  if (options.globalOptions) {
    commands.unshift({
      command: NO_COMMAND,
      argsType: options.argsType,
      options: options.globalOptions,
    });
  }

  // validate schema and throw error if it fails
  if (options.validateSchema ?? CONSTANTS.isDev) {
    try {
      validateDevInput(commands);
    } catch (error) {
      Log.error(error as string);
      process.exit(1);
    }
  }

  const zodUnion = schemaIntoZodUnion(commands);
  const { results, syntax } = parseArguments(commands);

  const HelpSchema = commandsSchemaToHelpSchema(commands, options.cliName, options.description, options.usage);
  printHelp = () => printHelpFromSchema(HelpSchema);

  const refined = zodUnion.superRefine((_, ctx) => {
    // The first argument is not a command
    if (syntax.includes('command') && syntax[0] !== 'command') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Syntax Error: Command must be the first argument. Move the command before other arguments.',
        fatal: true,
      });
      return z.NEVER;
    }

    // Has more than one command
    if (syntax.filter(t => t === 'command').length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Syntax Error: Only one command is allowed. Remove extra commands.',
        fatal: true,
      });
      return z.NEVER;
    }
  });

  return refined.safeParse(results);
}

export function createParseOptions<const T extends ParseOptions<A>, A extends ZodArray>(options: T & ParseOptions<A>): T {
  return options;
}

export function formatError(error: z.ZodError) {
  const err = error.format();

  for (const key in err) {
    const el = err[key as keyof typeof err] as { _errors: string[] } | string[];
    if (!el) continue;

    if (Array.isArray(el) && el.length) {
      Log.error(el.join('\n'), '\n');
      continue;
    }

    if (key === 'args' && 'args' in err && typeof err.args === 'object') {
      for (const argKye in err.args) {
        const argEl = err.args[argKye as keyof typeof err.args] as { _errors: string[] };

        if (!argEl) continue;

        if (argKye === '_errors' && '_errors' in argEl && argEl._errors.length) {
          Log.error('args :', argEl._errors.join('\n'), '\n');
        }

        if ('_errors' in argEl && argEl._errors.length) Log.error(key, ':', argEl._errors.join('\n'), '\n');
      }
    }

    if ('_errors' in el && el._errors.length) Log.error(key, ':', el._errors.join('\n'), '\n');
  }
}
