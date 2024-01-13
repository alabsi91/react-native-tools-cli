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

export type AllowedOptionTypes = ZodString | ZodNumber | ZodBoolean | ZodLiteral;

export type CommandSchema = {
  /**
   * - The command name.
   * - A single lowercase word.
   * - All commands are optional by default.
   *
   * @example
   *   command: 'test',
   *   command: 'run-app',
   */
  command: string;
  /**
   * - The aliases of the command.
   * - Make sure to not duplicate aliases.
   */
  aliases?: string[];
  /** - The description of the command. */
  description?: string;

  options?: CommandOptions[];
};

type CommandOptions = {
  /**
   * - Specifies the name of the option.
   * - This name will be transformed into kebab-case and used as the option's identifier in the command.
   *
   * @example
   *   name: 'help'; // Transforms to `--help`
   *   name: 'rootPath'; // Transforms to `--root-path`
   */
  name: string;
  /**
   * - The type of the option.
   * - The will be used to validate the option's value.
   * - Z.describe() will be used to generate the help message.
   *
   * @example
   *   type: z.boolean().optional().describe('Describe the option'),
   *   type: z.string().describe('Describe the option'),
   */
  type: AllowedOptionTypes;
  /**
   * - The aliases of the option.
   * - Use only a single character if the option type is a `boolean`.
   * - Make sure to not duplicate aliases.
   */
  aliases?: string[];
};

type MakeZodStrictObject<T extends z.ZodRawShape> = z.ZodObject<T, 'strict'>;

type MakeZodLiteral<T extends string | undefined> = z.ZodLiteral<T>;

type ZodStringArray = z.ZodArray<z.ZodString, 'many'>;

export type SchemaToZodObjArr<T extends CommandSchema[]> = {
  [K in keyof T]: T[K]['options'] extends infer U
    ? U extends CommandOptions[]
      ? MakeZodStrictObject<{ command: MakeZodLiteral<T[K]['command']>; args: ZodStringArray } & SchemaOptionsToObj<U>>
      : MakeZodStrictObject<{ command: MakeZodLiteral<T[K]['command']>; args: ZodStringArray }>
    : never;
};

type SchemaOptionsToObj<T extends CommandOptions[]> = {
  [K in T[number]['name']]: Extract<T[number], { name: K }>['type'];
};

export type SchemaToZodUnion<T extends CommandSchema[]> = z.ZodDiscriminatedUnion<
  'command',
  [SchemaToZodObjArr<T>[number], SchemaToZodObjArr<T>[number], ...SchemaToZodObjArr<T>]
>;

export type ParseOptions = {
  /** - CLI global options, when no command is given, Example: `--version` */
  globalOptions?: CommandOptions[];
  /** - Validate the schema, it's recommended to set this to `false` in production */
  validateSchema?: boolean;
  /** - The CLI name that starts your CLI */
  cliName?: string;
  /** - CLI description */
  description?: string;
  /** - CLI usage syntax */
  usage?: string;
};

export type ParseReturnType<T extends CommandSchema[]> = z.SafeParseReturnType<
  z.input<[SchemaToZodObjArr<T>[number], SchemaToZodObjArr<T>[number], ...SchemaToZodObjArr<T>][number]>,
  z.output<[SchemaToZodObjArr<T>[number], SchemaToZodObjArr<T>[number], ...SchemaToZodObjArr<T>][number]>
>;
