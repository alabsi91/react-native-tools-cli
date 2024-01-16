import { exec, spawn } from 'child_process';
import { realpathSync } from 'fs';
import path from 'path';
import { promisify } from 'util';

import type { ExecOptions, SpawnOptions } from 'child_process';

/**
 * - Spawns a shell then executes the command within that shell.
 *
 * @example
 *   const stdout = await $`node -v`;
 *   // you can pass options, just make sure to pass it at the last:
 *   const stdout = await $`node -v ${{ cwd: 'project' }}`;
 */
export async function $(strings: TemplateStringsArray, ...values: [] | string[] | [...string[], ExecOptions]): Promise<string> {
  const command = strings.reduce((acc, str, i) => acc + str + (typeof values[i] === 'string' ? values[i] : ''), '');
  const options = (typeof values[values.length - 1] === 'object' ? values.pop() : {}) as ExecOptions;
  return (await promisify(exec)(command, options)).stdout.trim();
}

export function executeCommand(command: string, args: readonly string[], options: SpawnOptions) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, options);
    const output = '';

    childProcess.on('close', code => {
      if (code === 0) {
        resolve(output);
        return;
      }

      reject(new Error(`Command exited with code ${code}`));
    });
  });
}

/**
 * - Execute a command in the shell, and pass the stdout to the parent process.
 *
 * @example
 *   await cmdPassThrough`node -v`;
 *   // you can pass options, just make sure to pass it at the last:
 *   await cmdPassThrough`node -v ${{ cwd: 'project' }}`;
 */
export function cmdPassThrough(strings: TemplateStringsArray, ...values: [] | string[] | [...string[], SpawnOptions]) {
  const strArr = strings
    .reduce((acc, str, i) => acc + str + (typeof values[i] === 'string' ? values[i] : ''), '')
    .split(' ')
    .filter(Boolean);
  const command = strArr[0];
  const args = strArr.slice(1);
  const options = (typeof values[values.length - 1] === 'object' ? values.pop() : {}) as SpawnOptions;
  return executeCommand(command, args, { stdio: 'inherit', shell: true, ...options });
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Removes ANSI escape codes for terminal colors from a given input string. */
export function cleanTerminalColors(inputString: string) {
  // eslint-disable-next-line no-control-regex
  const colorRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  const cleanedString = inputString.replace(colorRegex, '');
  return cleanedString;
}

/**
 * - To test your cli arguments when using hot reload in development mode.
 * - Make sure to remove the test argument before using it in production.
 *
 * @example
 *   testCliArgsInput('command --test-arg="test"');
 */
export function testCliArgsInput(input: string) {
  const regex = /\s(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const result = input
    .split(regex)
    .map(item => item.replace(/"/g, ''))
    .filter(Boolean);
  process.argv.push(...result);
}

export const CONSTANTS = {
  /** - Get the current platform */
  platform: process.platform,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  /** - Check if we are in development mode */
  isDev: process.env.NODE_ENV === 'development',
  /** - Get the project root directory full path */
  get projectRoot() {
    const scriptPath = realpathSync(process.argv[1]);
    const suffixesToRemove = ['.dev-server', 'dist'];
    const pattern = new RegExp(`(${suffixesToRemove.join('|')})$`);
    return path.dirname(scriptPath).replace(pattern, '');
  },
} as const;
