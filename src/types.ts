export type Commands = 'emulator' | 'start-server' | 'install-apk' | 'launch-app' | 'build' | 'generate-fonts' | 'help';
export type CommandsTuple = ['emulator', 'start-server', 'install-apk', 'launch-app', 'build', 'generate-fonts', 'help'];

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
