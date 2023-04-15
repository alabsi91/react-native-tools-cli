import inquirer from 'inquirer';

export default async function askForAge() {
  type answersT = { age: number };

  // ❔ Ask for user input.
  const { age } = await inquirer.prompt<answersT>([
    {
      type: 'input',
      name: 'age',
      message: 'Enter your age :',
    },
  ]);

  return age;
}
