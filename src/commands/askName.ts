import inquirer from 'inquirer';

export default async function askForName() {
  type answersT = { name: string };

  // ❔ Ask for user input.
  const { name } = await inquirer.prompt<answersT>([
    {
      type: 'input',
      name: 'name',
      default: 'John Doe',
      message: 'Enter your name :',
    },
  ]);

  return name;
}
