import type { z } from 'zod';
import type { CommandSchema } from './types.js';

function checkForDuplicates(arr: (string | undefined)[]) {
  const uniqueSet = new Set<string>();

  for (const item of arr) {
    if (!item) continue;
    if (uniqueSet.has(item)) return item;
    uniqueSet.add(item);
  }

  return null;
}

/**
 * - Validate the command schema and throw an error if any of the checks fail.
 * - This function is used to validate the command schema before it is used in the CLI.
 */
export function validateDevInput(schema: CommandSchema[]) {
  const testCommandRe = /^[a-z]+-?[a-z]+$/i;
  const testCommandStr = (arr: (string | undefined)[]) => arr.findIndex(c => c && !testCommandRe.test(c));

  const testOptionRe = /^(?:[a-z]+(?:[A-Z][a-z]*)*|[a-z])$/;
  const testOptionStr = (arr: string[]) => arr.findIndex(c => !testOptionRe.test(c));

  const isTypeBoolean = (t: z.ZodTypeAny) => t.safeParse(true).success;

  // Check for duplicate commands
  const commands = schema.map(s => s.command);
  const duplicatedCommand = checkForDuplicates(commands);
  if (duplicatedCommand) throw new Error(`Duplicate command: ${duplicatedCommand}`);

  // Validate command string format
  const failedCommandIndex = testCommandStr(commands);
  if (failedCommandIndex !== -1) {
    throw new Error(`Invalid command string format: "${commands[failedCommandIndex]}"`);
  }

  // Check for duplicate command aliases
  const commandAliases = schema.filter(s => s.aliases).flatMap(s => s.aliases!);
  const duplicatedCommandAlias = checkForDuplicates(commandAliases);
  if (duplicatedCommandAlias) throw new Error(`Duplicate command alias: ${duplicatedCommandAlias}`);

  // Validate command alias string format
  const failedCommandAliasIndex = testCommandStr(commandAliases);
  if (failedCommandAliasIndex !== -1) {
    throw new Error(`Invalid command alias string format: "${commandAliases[failedCommandAliasIndex]}"`);
  }

  // Check for duplicate command and aliases
  const duplicatedCommandAndAlias = checkForDuplicates([...commands, ...commandAliases]);
  if (duplicatedCommandAndAlias) throw new Error(`Duplicate command and alias: "${duplicatedCommandAndAlias}"`);

  for (let i = 0; i < schema.length; i++) {
    const { options } = schema[i];
    if (!options) continue;

    // Check for duplicate option names in the same command
    const optionsNames = options.map(o => o.name);
    const duplicatedOption = checkForDuplicates(optionsNames);
    if (duplicatedOption) throw new Error(`Duplicate option: "${duplicatedOption}"`);

    // Validate option string format
    const failedOptionIndex = testOptionStr(optionsNames);
    if (failedOptionIndex !== -1) throw new Error(`Invalid option string format: "${optionsNames[failedOptionIndex]}"`);

    // Check for duplicate option aliases in the same command
    const optionAliases = options.filter(o => o.aliases).flatMap(o => o.aliases!);
    const duplicatedOptionAlias = checkForDuplicates(optionAliases);
    if (duplicatedOptionAlias) {
      throw new Error(`Duplicate option alias: "${duplicatedOptionAlias}"`);
    }

    // Validate option alias string format
    const failedOptionAliasIndex = testOptionStr(optionAliases);
    if (failedOptionAliasIndex !== -1) {
      throw new Error(`Invalid option alias string format: "${optionAliases[failedOptionAliasIndex]}"`);
    }

    // Ensure option name and alias lengths are longer than 1 character for non-boolean types
    for (let o = 0; o < options.length; o++) {
      const { name, type, aliases } = options[o];
      const isBoolean = isTypeBoolean(type);

      if (name.length === 1 && !isBoolean) {
        throw new Error(`Option name must be longer than 1 character for a non-boolean type: "${name}"`);
      }

      if (!aliases) continue;

      aliases.forEach(a => {
        if (a.length === 1 && !isBoolean) {
          throw new Error(`Option alias must be longer than 1 character for a non-boolean type: "${name}"`);
        }
      });
    }
  }
}
