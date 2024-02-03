import inquirer from 'inquirer';

export async function askForStringInput(message: string, defaultValue?: string) {
  const { answer } = await inquirer.prompt<{ answer: string }>([
    {
      type: 'input',
      name: 'answer',
      default: defaultValue,
      message,
    },
  ]);

  return answer;
}

export async function askToConfirm(message: string, defaultValue?: boolean) {
  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      default: defaultValue,
      message,
    },
  ]);

  return confirm;
}
