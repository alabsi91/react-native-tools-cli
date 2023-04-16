import { printHelpMessage } from '@cli';

export default function printHelp() {
  printHelpMessage({
    scriptName: 'node-cli',
    description: 'a template to create an awesome cli with nodejs',
    optionsList: [
      {
        flags: '-h, --help',
        description: 'Output usage information',
      },
      {
        flags: '--full-name=string',
        description: 'To enter your name',
      },
      {
        flags: '--age=number',
        description: 'To enter your age',
      },
    ],
    examples: ['node-cli --full-name="John Doe" --age=100', 'node-cli -h'],
    positionalArguments: [
      {
        name: 'input',
        description: 'The input file',
      },
      {
        name: 'output',
        description: 'The output file',
      },
    ],
  });
}
