import type { Commands } from '@utils/utils.js';

export type HelpSchema = {
  name: string;
  description: string;
  usage: string;
  commands: {
    command: Commands;
    options: (
      | {
          syntaxes: string[];
          isRequired: boolean;
          description: string;
        }
      | {
          syntaxes?: never;
          isRequired?: never;
          description: string;
        }
    )[];
  }[];
};
