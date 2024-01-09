import chalk from 'chalk';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

const { fileName, alias, cn, ou, o, c, validity, keypass, storepass, usedFor } = await inquirer.prompt([
  {
    type: 'input',
    name: 'fileName',
    default: 'release',
    message: 'Key file name (without extension) :',
  },
  {
    type: 'input',
    name: 'alias',
    default: 'business',
    message: 'Alias: Identifier of the app a single entity inside the `.keystore` :',
  },
  {
    type: 'input',
    name: 'cn',
    default: 'Ahmed ALABSI',
    message: 'cn: full name of the person or organization :',
  },
  {
    type: 'input',
    name: 'ou',
    default: 'JavaSoft',
    message: 'ou: Organizational Unit that creates the project :',
  },
  {
    type: 'input',
    name: 'o',
    default: 'Sun',
    message: 'o: Organization owner of the whole project :',
  },
  {
    type: 'input',
    name: 'c',
    default: 'US',
    message: 'c: The country short code :',
  },
  {
    type: 'number',
    name: 'validity',
    default: 2000,
    message: 'validity: Amount of days the app will be valid with this `.keystore` :',
  },
  {
    type: 'password',
    name: 'keypass',
    message: 'keypass: Password for protecting that specific alias :',
  },
  {
    type: 'password',
    name: 'storepass',
    message: 'storepass: Password for protecting the whole `.keystore` content :',
  },
  {
    type: 'list',
    name: 'usedFor',
    default: 'both',
    message: 'Use this key for :',
    choices: ['both', 'debug', 'release'],
  },
]);

// check if the key if already exits
if (existsSync(path.join('android', 'app', `${fileName}.keystore`))) {
  console.log(chalk.red('\n⛔ key with the same name is already exits !!\n'));
  process.exit(1);
}

// generate the key and save it in android/app
try {
  await execPromise(
    `keytool -genkeypair -dname "cn=${cn}, ou=${ou}, o=${o}, c=${c}" -alias ${alias} -keypass ${keypass} -keystore ${path.join(
      'android',
      'app',
      `${fileName}.keystore`
    )} -storepass ${storepass} -validity ${validity}`
  );
} catch (error) {
  console.log(chalk.red('\n⛔ Error while generating the key !!\n'));
  console.log('⛔', chalk.red(error.stderr));
  process.exit(1);
}

// edit build.gradle
const buildGradlePath = path.join('android', 'app', 'build.gradle');
try {
  let str = await readFile(buildGradlePath, { encoding: 'utf8' });
  const hasRelease = /signingConfigs[\s\S]*?{[\s\S]*?release[\s\S]*?store/.test(str);
  if (usedFor === 'both') {
    str = str.replace(
      /debug[\s\S]*?}/,
      `debug {
          storeFile file('${fileName}.keystore')
          storePassword '${storepass}'
          keyAlias '${alias}'
          keyPassword '${keypass}'
        }`
    );

    if (hasRelease) {
      str = str.replace(
        /release[\s\S]*?}/,
        `release {
          storeFile file('${fileName}.keystore')
          storePassword '${storepass}'
          keyAlias '${alias}'
          keyPassword '${keypass}'
        }`
      );
    }
  }

  if (usedFor === 'debug') {
    if (hasRelease) {
      str = str.replace(
        /debug[\s\S]*?}/,
        `debug {
            storeFile file('${fileName}.keystore')
            storePassword '${storepass}'
            keyAlias '${alias}'
            keyPassword '${keypass}'
        }`
      );
    } else {
      // use current debug key as a release key;
      const currentDebugStr = str.match(/debug[\s\S]+?}/)[0].replace('debug', 'release');
      str = str.replace(
        /debug[\s\S]*?}/,
        currentDebugStr +
          `
        debug {
            storeFile file('${fileName}.keystore')
            storePassword '${storepass}'
            keyAlias '${alias}'
            keyPassword '${keypass}'
        }`
      );

      console.log(
        chalk.yellow(
          'The current debug key will be used as a release key, and the new one as the debug key; you can change that later.'
        )
      );

      // use release key in release
      str = str.replace(/(buildTypes[\s\S]*?release[\s\S]*?signingConfig.+?)(debug)/, '$1release');
    }
  }

  if (usedFor === 'release') {
    if (hasRelease) {
      str = str.replace(
        /release[\s\S]*?}/,
        `release {
            storeFile file('${fileName}.keystore')
            storePassword '${storepass}'
            keyAlias '${alias}'
            keyPassword '${keypass}'
        }`
      );
    } else {
      str = str.replace(
        /(signingConfigs[\s\S]*?{[\s\S]*?)(debug)/,
        `$1release {
              storeFile file('${fileName}.keystore')
              storePassword '${storepass}'
              keyAlias '${alias}'
              keyPassword '${keypass}'
        }

        $2`
      );

      // use release key in release
      str = str.replace(/(buildTypes[\s\S]*?release[\s\S]*?signingConfig.+?)(debug)/, '$1release');
    }
  }

  await writeFile(buildGradlePath, str, { encoding: 'utf8' });
} catch (error) {
  console.log('⛔', chalk.red(error));
}
