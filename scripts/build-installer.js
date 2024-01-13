import chalk from 'chalk';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { promisify } from 'util';
import * as esbuild from 'esbuild';

import { cmd_script, ps1_script, sh_script } from './launch-scripts.js';

const cmd = promisify(exec);

// ? ⚠️ install NSIS via powershell `winget install NSIS.NSIS`

const outFolder = 'installer',
  outJsFile = 'index.cjs',
  entryFile = 'src/index.ts',
  nodeVersion = 'latest-v18.x',
  nodeDownloadLink = `https://nodejs.org/dist/${nodeVersion}/win-x64/node.exe`,
  makeNsis = path.normalize('C:/Program Files (x86)/NSIS/makensis.exe'), // NSIS cli path.
  includeNodejs = false, // include nodejs in the installer. makes the installer larger in size.
  cleanAfterBuild = false; // 🗑️ remove all files after build except `installer.exe`

(async function () {
  let progress;

  // * 👓 read package.json
  const { name, version, description } = JSON.parse(await fs.readFile('package.json'));

  // * 📝 create outFolder if it doesn't exist
  if (!existsSync(outFolder)) fs.mkdir(outFolder);

  // * ⬇️ download node.exe
  if (!existsSync(path.join(outFolder, 'node.exe')) && includeNodejs) {
    try {
      progress = loading(`- Downloading "node.exe ${nodeVersion}" ...`);
      const res = await fetch(nodeDownloadLink),
        nodeArrayBuffer = await res.arrayBuffer(),
        nodeFile = Buffer.from(nodeArrayBuffer);
      await fs.writeFile(path.join(outFolder, 'node.exe'), nodeFile);
      progress(`- node.exe v${nodeVersion} downloaded!`);
    } catch (error) {
      progress(`Error: downloading node.exe ${nodeVersion} failed!`, true);
      return;
    }
  }

  // * 🧹 clean up the outFolder
  progress = loading(`- Cleaning up "${outFolder}" folder ...`);
  const files = await fs.readdir(outFolder);
  for (const file of files) if (file !== 'node.exe') await fs.rm(path.resolve(outFolder, file), { recursive: true });
  progress(`- "${outFolder}" folder Cleaned up!`);

  // * 📋 copy files from scripts folder
  try {
    progress = loading(`- Copying assets files to "${outFolder}" folder ...`);
    for (const file of await fs.readdir(path.normalize('scripts/installer-assets')))
      await fs.copyFile(path.normalize(`scripts/installer-assets/${file}`), path.normalize(`${outFolder}/${file}`));
    progress('- Assets files copied successfully!');
  } catch (error) {
    progress('Error: copying assets files failed!', true);
    return;
  }

  // * 📦 bundle outJsFile
  try {
    progress = loading('- Bundling JavaScript files ...');
    await esbuild.build({
      entryPoints: [entryFile],
      outdir: outFolder,
      platform: 'node',
      target: ['node16'],
      outExtension: { '.js': '.cjs' },
      bundle: true,
      minify: true,
      treeShaking: true,
    });
    progress('- JavaScript files Bundled successfully!');
  } catch (error) {
    progress('- Error while bundling JavaScript files !!', true);
    return;
  }

  // * 📝 create .cmd file
  try {
    progress = loading(`- Creating "${name}.cmd" file ...`);
    await fs.writeFile(`${outFolder}/${name}.cmd`, cmd_script(outJsFile));
    progress(`- "${name}.cmd" file created successfully!`);
  } catch (error) {
    progress('- Error while creating .cmd file!', true);
    return;
  }

  // * 📝 create .ps1 file
  try {
    progress = loading(`- Creating "${name}.ps1" file ...`);
    await fs.writeFile(`${outFolder}/${name}.ps1`, ps1_script(outJsFile));
    progress(`- "${name}.ps1" file created successfully!`);
  } catch (error) {
    progress('- Error while creating .ps1 file!', true);
    return;
  }

  // * 📝 create sh file
  try {
    progress = loading(`- Creating "${name}" file ...`);
    await fs.writeFile(`${outFolder}/${name}`, sh_script(outJsFile));
    progress(`- "${name}" sh file created successfully!`);
  } catch (error) {
    progress('- Error while creating sh file!', true);
    return;
  }

  // * ✏️ modify the installer.nsi file
  try {
    progress = loading('- Modifying "installer.nsi" file ...');
    const installerNsi = await fs.readFile(path.normalize(`${outFolder}/installer.nsi`), 'utf8');
    let newInstallerNsi = installerNsi
      .replace('!define AppName ""', `!define AppName "${name}"`) // inject AppName
      .replace('!define AppVersion ""', `!define AppVersion "v${version}"`) // inject AppVersion
      .replace('!define AppDescription ""', `!define AppDescription "${description}"`) // inject AppDescription
      .replace('!define JsFile ""', `!define JsFile "${outJsFile}"`) // inject JsFile name
      .replace('Section "Node.js"', `Section "node.js v${nodeVersion}"`); // inject Node.js version
    // remove Node.js component if not included in the installer.
    if (!includeNodejs) {
      newInstallerNsi = newInstallerNsi
        .replace(/Section "Node\.js[\S\s]+?SectionEnd/i, '')
        .replace('!insertmacro MUI_DESCRIPTION_TEXT ${SecNode} $(DESC_SecNode)', '');
    }
    await fs.writeFile(path.normalize(`${outFolder}/installer.nsi`), newInstallerNsi, 'utf8'); // write new installer.nsi
    progress('- "installer.nsi" file modified!');
  } catch (error) {
    progress('- Error while modifying "installer.nsi" file!', true);
    return;
  }

  // * 💿 create the installer
  try {
    progress = loading('- Creating NSIS installer ...');
    await cmd(`"${makeNsis}" "${path.resolve(path.normalize(`${outFolder}/installer.nsi`))}"`);
    progress('- NSIS installer created successfully!');
  } catch (e) {
    progress('- Error creating NSIS installer ...', true);
    console.log(chalk.red('❗ - If NSIS is not installed, please install it via powershell : `winget install NSIS.NSIS`\n'));
    return;
  }

  // * 🧹 clean up the outFolder
  if (cleanAfterBuild) {
    progress = loading(`- Cleaning up ${outFolder} folder ...`);
    const Files = await fs.readdir(outFolder);
    for (const file of Files) if (file !== 'installer.exe') await fs.rm(path.resolve(outFolder, file), { recursive: true });
    progress(`- Cleaned up ${outFolder} folder successfully!`);
  }

  console.log(chalk.bgGreen.black.bold('\n 🥳 Done!\n'));
})();

// * progress animation
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
function loading(message) {
  let i = 0;
  process.stdout.write('\n');
  const id = setInterval(() => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${chalk.cyan(frames[i++ % frames.length])} ${chalk.yellow(message)}`);
  }, 125);
  return (endMessage, isError = false) => {
    clearInterval(id);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${isError ? chalk.red('⛔ ' + endMessage) : chalk.green('✅ ' + endMessage)}\n`);
  };
}
