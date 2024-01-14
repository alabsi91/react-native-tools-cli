import { createCommandSchema } from './commandSchema.js';
import { createParseOptions, parse, printHelp, formatError } from './parseSchema.js';

const Schema = {
  /**
   * - Create a command schema, that can be used in the parse function
   * - `Schema.parse(schema, ...schema, options)`
   *
   * @example
   *   const schema = Schema.createCommand({
   *     command: 'example', // required
   *     description: 'Example command', // Optional - for generating the help message
   *     aliases: ['example-alias'], // Optional - will trigger the same command in the CLI
   *     // Optional - for validating user input and type safety
   *     options: [
   *       {
   *         // Note: one character option names are limited to `boolean` types only
   *         // Required - should be used like this in the CLI `--option-name="value"`
   *         name: 'OptionName',
   *         // Required - Zod types, add description for generating the help message
   *         type: z.string().optional().describe('Option description'),
   *         aliases: ['optionAlias'], // Optional - will trigger the same option in the CLI
   *       },
   *     ],
   *   });
   */
  createCommand: createCommandSchema,
  /**
   * - Create options schema, that can be used in the parse function
   * - `Schema.parse(schema, ...schema, options)`
   * - You can also inline the options, if you want to
   *
   * @example
   *   const options = Schema.createOptions({
   *     // Optional - The CLI name that starts your CLI (package.json.name), for generating the help message
   *     cliName: 'node-cli',
   *     // Optional - The CLI description, for generating the help message
   *     description: 'A CLI for testing.',
   *     // Optional - Throw an error if the schema is invalid.
   *     // This is recommended to set to false in production.
   *     // **Default**: true if in development mode
   *     validateSchema: true,
   *     // Optional - Global options are used when no command is specified,
   *     // For example: `node-cli --help`
   *     globalOptions: [
   *       {
   *         name: 'help',
   *         type: z.boolean().optional().describe('Show this help message.'),
   *         aliases: ['h'],
   *       },
   *       {
   *         name: 'version',
   *         type: z.boolean().optional().describe('Show the version.'),
   *         aliases: ['v'],
   *       },
   *     ],
   *   });
   */
  createOptions: createParseOptions,
  /**
   * - Parse the arguments and return the results
   * - `Schema.parse(schema, ...schema, options)`
   *
   * @example
   *   const results = Schema.parse(schema, ...schema, options);
   *   if(results.success) {
   *   const { command } = results.data;
   *   // check which command was called
   *   if(command === 'example') {
   *   const { OptionName } = results.data; // get the options related to the command
   *   // do something
   *   }
   */
  parse,
  /**
   * - Print the help message that was generated when calling `Schema.parse(schema, ...schema, options)`
   * - If the help message is not generated, it will print a warning.
   */
  printHelp: () => printHelp(),

  /** - Takes a Zod error object and prints a formatted error message. */
  formatError,
};

export default Schema;
