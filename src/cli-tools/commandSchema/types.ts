import type { z } from 'zod';

type ZodString =
  | z.ZodString
  | z.ZodOptional<z.ZodString>
  | z.ZodDefault<z.ZodString>
  | z.ZodOptional<z.ZodDefault<z.ZodString>>
  | z.ZodDefault<z.ZodOptional<z.ZodString>>;

type ZodNumber =
  | z.ZodNumber
  | z.ZodOptional<z.ZodNumber>
  | z.ZodDefault<z.ZodNumber>
  | z.ZodOptional<z.ZodDefault<z.ZodNumber>>
  | z.ZodDefault<z.ZodOptional<z.ZodNumber>>;

type ZodBoolean =
  | z.ZodBoolean
  | z.ZodOptional<z.ZodBoolean>
  | z.ZodDefault<z.ZodBoolean>
  | z.ZodOptional<z.ZodDefault<z.ZodBoolean>>
  | z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;

type ZodLiteral =
  | z.ZodLiteral<string | number>
  | z.ZodOptional<z.ZodLiteral<string | number>>
  | z.ZodDefault<z.ZodLiteral<string | number>>
  | z.ZodOptional<z.ZodDefault<z.ZodLiteral<string | number>>>
  | z.ZodDefault<z.ZodOptional<z.ZodLiteral<string | number>>>;

type ZodStringArray = z.ZodArray<z.ZodString, 'many'>;

export type ZodArray =
  | z.ZodArray<z.ZodString, 'many' | 'atleastone'>
  | z.ZodArray<z.ZodNumber, 'many' | 'atleastone'>
  | z.ZodArray<z.ZodLiteral<string | number>, 'many' | 'atleastone'>;

export type AllowedOptionTypes = ZodString | ZodNumber | ZodBoolean | ZodLiteral;

export type CommandSchema<A = ZodArray> = {
  /**
   * - **Required** `string`
   * - The command name, use kebab-case.
   * - Make sure to not duplicate commands and aliases.
   *
   * @example
   *   command: 'test',
   *   command: 'run-app',
   */
  command: string;
  /**
   * - **Optional** `string`
   * - The description of the command.
   * - Used for generating the help message.
   */
  description?: string;
  /**
   * - **Optional** `z.ZodArray`
   * - **Default** `z.string().array()`
   * - The arguments of the command.
   * - Those arguments are specific to this command.
   * - Use `z.string().array().describe('Description')` to add a description for help message.
   *
   * @example
   *   // None-empty string array.
   *   argsType: z.string().array().nonempty(),
   *   // Converts string to number and accept one or no arguments.
   *   argsType: z.coerce.number().array().max(1),
   */
  argsType?: A;
  /**
   * - **Optional** `string[]`
   * - The aliases of the command.
   * - Any of the aliases will trigger the same command in the CLI.
   * - Make sure to not duplicate aliases and commands.
   */
  aliases?: string[];

  /**
   * - **Optional** `CommandOptions[]`
   * - The options of the command.
   * - Those options are specific to this command.
   */
  options?: [CommandOptions, ...CommandOptions[]];
};

type CommandOptions = {
  /**
   * - **Required** `string`
   * - The name of the option, use CamelCase..
   * - For example: the syntax for the option `rootPath` is `--root-path="path"`.
   * - For boolean options, the syntax is `--option` or `--option=true`.
   * - One character option names are limited to `boolean` types only E.g. `b` will be used for `-b`
   *
   * @example
   *   name: 'help'; // Transforms to `--help`
   *   name: 'rootPath'; // Transforms to `--root-path`
   */
  name: string;
  /**
   * - **Required** `ZodTypes` only string, number or boolean
   * - The type of the option.
   * - The will be used to validate the user input.
   * - `Z.describe()` will be used to generate the help message.
   *
   * @example
   *   type: z.boolean().optional().describe('Describe the option'),
   *   type: z.string().describe('Describe the option'),
   *
   * @see https://zod.dev/?id=types
   */
  type: AllowedOptionTypes;
  /**
   * - **Optional** `string[]`
   * - The aliases of the option, use CamelCase..
   * - Any of the aliases will trigger the same option in the CLI.
   * - One character option names are limited to `boolean` types
   * - Make sure to not duplicate aliases.
   */
  aliases?: [string, ...string[]];
};

type MakeZodStrictObject<T extends z.ZodRawShape> = z.ZodObject<T, 'strict'>;

type MakeZodLiteral<T extends string | undefined> = z.ZodLiteral<T>;

type GetArgsType<T extends ZodArray | undefined> = T extends ZodArray ? T : ZodStringArray;

export type SchemaToZodObjArr<T extends CommandSchema[]> = {
  [K in keyof T]: T[K]['options'] extends infer U
    ? U extends CommandOptions[]
      ? MakeZodStrictObject<
          {
            command: MakeZodLiteral<T[K]['command']>;
            args: GetArgsType<T[K]['argsType']>;
          } & SchemaOptionsToObj<U>
        >
      : MakeZodStrictObject<{
          command: MakeZodLiteral<T[K]['command']>;
          args: GetArgsType<T[K]['argsType']>;
        }>
    : never;
};

type SchemaOptionsToObj<T extends CommandOptions[]> = {
  [K in T[number]['name']]: Extract<T[number], { name: K }>['type'];
};

export type SchemaToZodUnion<T extends CommandSchema[]> = z.ZodDiscriminatedUnion<
  'command',
  [SchemaToZodObjArr<T>[number], SchemaToZodObjArr<T>[number], ...SchemaToZodObjArr<T>]
>;

export type ParseOptions<A = ZodStringArray> = {
  /**
   * **Optional** `CommandOptions[]`
   *
   * - CLI global options, when no command is given, Example: `--version`
   */
  globalOptions?: [CommandOptions, ...CommandOptions[]];
  /**
   * - **Optional** `z.ZodArray`
   * - **Default** `z.string().array()`
   * - The arguments type when no command is given.
   * - Use `z.string().array().describe('Description')` to add a description for help message.
   *
   * @example
   *   // None-empty string array.
   *   argsType: z.string().array().nonempty(),
   *   // Converts string to number and accept one or no arguments.
   *   argsType: z.coerce.number().array().max(1),
   */
  argsType?: A;
  /**
   * - **Optional** `boolean`
   * - **Default**: `true` when in development mode.
   * - Throw an error if the schema is invalid.
   * - Validate the schema, it's recommended to set this to `false` in production.
   */
  validateSchema?: boolean;
  /**
   * **Optional** `string`
   *
   * - The CLI name that starts your CLI, used for help command.
   */
  cliName?: string;
  /**
   * **Optional** `string`
   *
   * - CLI description, used for help command.
   */
  description?: string;
  /**
   * **Optional** `string`
   *
   * - CLI usage syntax, used for help command.
   */
  usage?: string;
};

export type ParseReturnType<T extends CommandSchema[]> = z.SafeParseReturnType<
  z.input<[SchemaToZodObjArr<T>[number], SchemaToZodObjArr<T>[number], ...SchemaToZodObjArr<T>][number]>,
  z.output<[SchemaToZodObjArr<T>[number], SchemaToZodObjArr<T>[number], ...SchemaToZodObjArr<T>][number]>
>;
