import { z } from 'zod';
import { NO_COMMAND } from './parseSchema.js';

import type { AllowedOptionTypes, CommandSchema, SchemaToZodUnion } from './types.js';

export function createCommandSchema<const T extends CommandSchema>(command: T) {
  return command;
}

export function schemaIntoZodUnion<T extends CommandSchema[]>(schema: T) {
  type Results = z.ZodObject<
    { command: z.ZodLiteral<string> | z.ZodOptional<z.ZodUndefined>; args: z.ZodArray<z.ZodString, 'many'> } & {
      [k: string]: z.ZodTypeAny;
    },
    'strict'
  >;
  type ResultsTuple = [Results, Results, ...Results[]];

  const results: Results[] = [];

  for (let i = 0; i < schema.length; i++) {
    const cmd = schema[i];
    const options: Record<string, AllowedOptionTypes> = {};

    if (!cmd.options) continue;

    for (let j = 0; j < cmd.options.length; j++) {
      const option = cmd.options[j];
      options[option.name] = option.type;
    }

    // add global options
    if (cmd.command === NO_COMMAND) {
      results.push(z.object({ command: z.literal(undefined!), args: z.string().array(), ...options }).strict());
    }

    const zObject = z.object({ command: z.literal(cmd.command!), args: z.string().array(), ...options }).strict();
    results.push(zObject);
  }

  const resultsTuple = results as unknown as ResultsTuple;

  return z.discriminatedUnion('command', resultsTuple) as SchemaToZodUnion<T>;
}
