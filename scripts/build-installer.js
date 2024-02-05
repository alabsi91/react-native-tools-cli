import chalk from 'chalk';
import { exec } from 'child_process';
import * as esbuild from 'esbuild';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { promisify } from 'util';

import config from '../nsis.config.js';
import { cmd_script, ps1_script, sh_script } from './launch-scripts.js';

const cmd = promisify(exec);

const isWindows = process.platform === 'win32';
if (!isWindows) {
  console.log(chalk.red('⛔ Only Windows platform is supported.'));
  process.exit(1);
}

// ? ⚠️ install NSIS via powershell `winget install NSIS.NSIS`

const {
  outFolder,
  outJsFile,
  entryFile,
  nodeVersion,
  nodeDownloadLink,
  useCurrentNodeExe,
  nsisCliPath,
  includeAssets,
  includeNodejs,
  cleanAfterBuild,
} = config;

(async function () {
  let progress;
  let includeAssetsNsisString = '';

  // * 👓 read package.json
  const { name, version, description } = JSON.parse(await fs.readFile('package.json'));

  // * 📝 create outFolder if it doesn't exist
  if (!existsSync(outFolder)) fs.mkdir(outFolder);

  // * ⬇️ download node.exe or copy it from the current machine
  const nodeTargetPath = path.join(outFolder, 'node.exe');
  if (!existsSync(nodeTargetPath) && includeNodejs) {
    if (useCurrentNodeExe) {
      try {
        progress = loading(`- Copying current node.exe from "${process.execPath}" ...`);
        const { stdout: nodePath } = await cmd(`node -e "console.log(process.execPath)"`);
        await fs.copyFile(nodePath.trim(), nodeTargetPath);
        progress(`- Current node.exe copied!`);
      } catch (error) {
        progress(`Error: copying current node.exe failed!`, true);
        return;
      }
    } else {
      try {
        progress = loading(`- Downloading "node.exe ${nodeVersion}" ...`);
        const res = await fetch(nodeDownloadLink(nodeVersion));
        const nodeArrayBuffer = await res.arrayBuffer();
        const nodeFile = Buffer.from(nodeArrayBuffer);
        await fs.writeFile(nodeTargetPath, nodeFile);
        progress(`- node.exe v${nodeVersion} downloaded!`);
      } catch (error) {
        progress(`Error: downloading node.exe ${nodeVersion} failed!`, true);
        return;
      }
    }
  }

  // * 🧹 clean up the outFolder
  progress = loading(`- Cleaning up "${outFolder}" folder ...`);
  const files = await fs.readdir(outFolder);
  for (const file of files) if (file !== 'node.exe') await fs.rm(path.join(outFolder, file), { recursive: true });
  progress(`- "${outFolder}" folder Cleaned up!`);

  // * 📋 copy files from scripts folder
  try {
    progress = loading(`- Copying installer scripts files to "${outFolder}" folder ...`);
    await recursiveCopy(path.join('scripts', 'installer-assets'), path.normalize(outFolder));
    progress('- Files copied successfully!');
  } catch (error) {
    progress('Error: copying scripts files failed!', true);
    return;
  }

  // * 📋 copy included assets
  try {
    progress = loading(`- Copying included assets to "${outFolder}" folder ...`);
    for (const asset of includeAssets) {
      if (!existsSync(asset)) {
        console.log(chalk.red(`Error: path "${asset}" not found!`));
        continue;
      }

      await recursiveCopy(path.normalize(asset), path.join(outFolder, path.basename(asset)));

      const isDirectory = (await fs.stat(asset)).isDirectory();
      if (isDirectory) {
        includeAssetsNsisString += `\n  File /r "${path.basename(asset)}"`;
        continue;
      }

      includeAssetsNsisString += `\n  File "${path.basename(asset)}"`;
    }

    progress('- Included assets copied successfully!');
  } catch (error) {
    progress('- Error: copying include files failed!', true);
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
      format: 'cjs',
      outExtension: { '.js': '.cjs' },
      bundle: true,
      minify: true,
      define: { 'import.meta.url': 'import_meta_url' },
      banner: { js: "var import_meta_url = require('url').pathToFileURL(__filename);" },
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
    await fs.writeFile(path.join(outFolder, `${name}.cmd`), cmd_script(outJsFile));
    progress(`- "${name}.cmd" file created successfully!`);
  } catch (error) {
    progress('- Error while creating .cmd file!', true);
    return;
  }

  // * 📝 create .ps1 file
  try {
    progress = loading(`- Creating "${name}.ps1" file ...`);
    await fs.writeFile(path.join(outFolder, `${name}.ps1`), ps1_script(outJsFile));
    progress(`- "${name}.ps1" file created successfully!`);
  } catch (error) {
    progress('- Error while creating .ps1 file!', true);
    return;
  }

  // * 📝 create sh file
  try {
    progress = loading(`- Creating "${name}" file ...`);
    await fs.writeFile(path.join(outFolder, `${name}`), sh_script(outJsFile));
    progress(`- "${name}" sh file created successfully!`);
  } catch (error) {
    progress('- Error while creating sh file!', true);
    return;
  }

  // * ✏️ modify the installer.nsi file
  try {
    progress = loading('- Modifying "installer.nsi" file ...');
    const installerNsi = await fs.readFile(path.join(outFolder, 'installer.nsi'), 'utf8');
    let newInstallerNsi = installerNsi
      .replace('!define AppName ""', `!define AppName "${name}"`) // inject AppName
      .replace('!define AppVersion ""', `!define AppVersion "v${version}"`) // inject AppVersion
      .replace('!define AppDescription ""', `!define AppDescription "${description}"`) // inject AppDescription
      .replace('!define JsFile ""', `!define JsFile "${outJsFile}"`) // inject JsFile name
      .replace('Section "Node.js"', `Section "node.js v${nodeVersion}"`) // inject Node.js version
      .replace(/\s*;\s*{assetsFiles}.*/, includeAssetsNsisString); // inject included assets
    // remove Node.js component if not included in the installer.
    if (!includeNodejs) {
      newInstallerNsi = newInstallerNsi
        .replace(/Section "Node\.js[\S\s]+?SectionEnd/i, '')
        .replace('!insertmacro MUI_DESCRIPTION_TEXT ${SecNode} $(DESC_SecNode)', '');
    }
    await fs.writeFile(path.join(outFolder, `installer.nsi`), newInstallerNsi, 'utf8'); // write new installer.nsi
    progress('- "installer.nsi" file modified!');
  } catch (error) {
    progress('- Error while modifying "installer.nsi" file!', true);
    return;
  }

  // * 💿 create the installer
  try {
    progress = loading('- Creating NSIS installer ...');
    const nsiPath = path.join(outFolder, 'installer.nsi');
    await cmd(`"${path.normalize(nsisCliPath)}" "${path.resolve(nsiPath)}"`);
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
    for (const file of Files) if (file !== 'installer.exe') await fs.rm(path.join(outFolder, file), { recursive: true });
    progress(`- Cleaned up ${outFolder} folder successfully!`);
  }

  console.log(chalk.bgGreen.black.bold('\n 🥳 Done!\n'));
  console.log(chalk.green.bold('Installer created successfully at'), chalk.yellow(path.join(outFolder, 'installer.exe')), '\n');
})();

// * progress animation
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
function loading(message) {
  let i = 0;
  process.stdout.write('\n');
  const id = setInterval(() => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${chalk.cyan(frames[i++ % frames.length])} ${chalk.white.bold(message)}`);
  }, 125);
  return (endMessage, isError = false) => {
    clearInterval(id);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${isError ? chalk.red('⛔ ' + endMessage) : chalk.green('✅ ' + endMessage)}\n`);
  };
}

async function recursiveCopy(source, target) {
  const sourceStats = await fs.stat(source);

  if (sourceStats.isDirectory()) {
    await fs.mkdir(target, { recursive: true });
    const files = await fs.readdir(source);

    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      await recursiveCopy(sourcePath, targetPath, false);
    }
  } else if (sourceStats.isFile()) {
    await fs.copyFile(source, target);
  }
}
