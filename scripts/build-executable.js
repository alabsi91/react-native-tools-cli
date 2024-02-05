import chalk from 'chalk';
import { exec } from 'child_process';
import * as esbuild from 'esbuild';
import { existsSync } from 'fs';
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const cmd = promisify(exec);

// * Check if node version is higher than 20
const nodeVersion = parseInt(process.version.slice(1), 10);
if (nodeVersion < 20) {
  console.log(chalk.red('⛔ Node.js version 20 or higher is required.'));
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';
const isAndroid = process.platform === 'android';

if (isAndroid) {
  console.log(chalk.red('⛔ Android is not supported yet.'));
  process.exit(1);
}

const outFolder = 'executable';
const entryFile = 'src/index.ts';
const includeAssets = []; // Files or folders to be copied to the outFolder.

const seaConfig = {
  main: path.join(outFolder, 'index.cjs'),
  output: path.join(outFolder, 'sea-blob.blob'),
  disableExperimentalSEAWarning: true, // Default: false
  useSnapshot: false, // Default: false
  useCodeCache: true, // Default: false
};

// * read package.json
let loading = spinner('Reading package.json ...');
const { name } = JSON.parse(await readFile('package.json'));
loading('- Package.json read successfully!');

// path to the generated executable
const executablePath = `${outFolder}/${name}${isWindows ? '.exe' : ''}`;

// * create outFolder if it doesn't exist
if (!existsSync(outFolder)) await mkdir(outFolder);

// * clean up the outFolder
const files = await readdir(outFolder);
for (const file of files) await rm(path.join(outFolder, file), { recursive: true });

// * bundle outJsFile
try {
  loading = spinner('Bundling JavaScript files ...');
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
  loading('- JavaScript files Bundled successfully!');
} catch (error) {
  loading('- Error while bundling JavaScript files !!', true);
  process.exit(1);
}

// * Create a configuration file building a blob that can be injected into the single executable application
try {
  loading = spinner('Creating sea-config.json ...');
  await writeFile(path.join(outFolder, 'sea-config.json'), JSON.stringify(seaConfig, null, 2), 'utf-8');
  loading('- sea-config.json created successfully!');
} catch (error) {
  loading('- Error while creating sea-config.json !!', true);
  process.exit(1);
}

// * Generate the blob to be injected:
try {
  loading = spinner('Creating blob file ...');
  await cmd(`node --experimental-sea-config ${path.join(outFolder, 'sea-config.json')}`);
  loading('- Blob file created successfully!');
} catch (error) {
  loading('- Error while creating blob file !!', true);
  process.exit(1);
}

// * Create a copy of the node executable
if (isWindows) {
  try {
    loading = spinner('Copying node.exe ...');
    await cmd(`node -e "require('fs').copyFileSync(process.execPath, '${executablePath}')"`);
    loading('- node.exe copied successfully!');
  } catch (error) {
    console.log('error :', error);
    loading('- Error while copying node.exe !!', true);
    process.exit(1);
  }
} else {
  try {
    loading = spinner('Copying node ...');
    await cmd(`cp $(command -v node) "${executablePath}"`);
    loading('- node copied successfully!');
  } catch (error) {
    loading('- Error while copying node !!', true);
    process.exit(1);
  }
}

// * Remove the signature of the binary (macOS and Windows only):
if (isWindows) {
  try {
    loading = spinner('Removing signature from executable ...');
    await cmd(`signtool remove /s "${executablePath}"`);
    loading('- Signature removed successfully!');
  } catch (error) {
    loading(chalk.yellow('- Warning: Failed to remove signature. Continuing...'), true);
  }
}

if (isMac) {
  try {
    loading = spinner('Removing signature from executable ...');
    await cmd(`codesign --remove-signature "${executablePath}"`);
    loading('- Signature removed successfully!');
  } catch (error) {
    loading(chalk.yellow('- Warning: Failed to remove signature. Continuing...'), true);
  }
}

// * Inject the blob into the copied binary
if (isWindows || isLinux) {
  try {
    loading = spinner('Injecting blob into the executable ...');
    await cmd(
      `npx -y postject "${executablePath}" NODE_SEA_BLOB "${outFolder}/sea-blob.blob" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    );
    loading('- Blob injected successfully!');
  } catch (error) {
    loading('- Error while injecting blob into the executable !!', true);
    process.exit(1);
  }
}

if (isMac) {
  try {
    loading = spinner('Injecting blob into the executable ...');
    await cmd(
      `npx -y postject "${executablePath}" NODE_SEA_BLOB "${outFolder}/sea-blob.blob" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`,
    );
    loading('- Blob injected successfully!');
  } catch (error) {
    loading('- Error while injecting blob into the executable !!', true);
    process.exit(1);
  }
}

// * Sign the binary (macOS and Windows only)
if (isWindows) {
  try {
    loading = spinner('Signing executable ...');
    await cmd(`signtool sign /fd SHA256 "${executablePath}"`);
    loading('- Executable signed successfully!');
  } catch (error) {
    loading(chalk.yellow('- Warning: Failed to sign executable, continuing...'), true);
  }
}

if (isMac) {
  try {
    loading = spinner('Signing executable ...');
    await cmd(`codesign --sign - "${executablePath}"`);
    loading('- Executable signed successfully!');
  } catch (error) {
    loading(chalk.yellow('- Warning: Failed to sign executable, continuing...'), true);
  }
}

// * Remove temporary files
try {
  loading = spinner('Removing temporary files ...');
  const files = await readdir(outFolder);
  for (const file of files) {
    if (file === `${name}${isWindows ? '.exe' : ''}`) continue;
    await rm(path.join(outFolder, file), { recursive: true });
  }
  loading('- Temporary files removed successfully!');
} catch (error) {
  loading('- Error while removing temporary files !!', true);
  process.exit(1);
}

// * copy included assets
if (includeAssets.length) {
  try {
    loading = spinner(`- Copying included assets to "${outFolder}" folder ...`);
    for (const asset of includeAssets) {
      if (!existsSync(asset)) {
        console.log(chalk.red(`Error: path "${asset}" not found!`));
        continue;
      }

      await recursiveCopy(path.normalize(asset), path.join(outFolder, path.basename(asset)));
    }
    loading('- Included assets copied successfully!');
  } catch (error) {
    loading('- Error: copying include files failed!', true);
    process.exit(1);
  }
}

console.log(chalk.bgGreen.black.bold('\n 🥳 Done!\n'));
console.log(chalk.green.bold('Executable created successfully at'), chalk.yellow(executablePath), '\n');

// spinner animation
function spinner(message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

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
  const sourceStats = await stat(source);

  if (sourceStats.isDirectory()) {
    await mkdir(target, { recursive: true });
    const files = await readdir(source);

    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      await recursiveCopy(sourcePath, targetPath, false);
    }
  } else if (sourceStats.isFile()) {
    await copyFile(source, target);
  }
}
