import * as esbuild from 'esbuild';
import chalk from 'chalk';
import { spawn } from 'child_process';

const outfile = './.dev-server/index.js';
const entryPoint = './src/index.ts';

let worker;

const plugins = [
  {
    name: 'my-plugin',
    setup(build) {
      build.onEnd(result => {
        if (result.errors.length) {
          console.error(chalk.red('⛔ Build failed !!'));
          console.log(chalk.yellow('\n🕐 Waiting for new changes ...\n'));
          return;
        }

        // run if file changes
        run();
      });
    },
  },
];

(async function () {
  // 📦 bundle typescript files into one js file, and watch for changes.
  try {
    const context = await esbuild.context({
      entryPoints: [entryPoint],
      external: ['./node_modules/*'],
      platform: 'node',
      outfile,
      format: 'esm',
      sourcemap: true,
      bundle: true,
      define: {
        'process.env.NODE_ENV': '"development"',
      },
      plugins,
    });

    // Enable watch mode
    await context.watch();
  } catch (error) {
    console.error(error);
  }
})();

// to run bundled file.
function run() {
  // 🔪 kill last spawned worker
  if (worker) {
    try {
      process.kill(worker.pid);
    } catch (error) {
      console.error(chalk.red('⛔ Failed to kill worker !!'));
    }
  }

  //🧹 clean up console logs
  console.clear();

  //🔥 start new worker
  console.log(chalk.yellow('\n👀 Watching for changes in "./src/**/*" ...\n'));
  worker = spawn('node', ['--enable-source-maps', outfile], { stdio: 'inherit' });

  //👂 listen for worker exit signal.
  worker.on('exit', code => {
    if (code !== 0) return;
    console.log(chalk.yellow('\n\n🕐 Waiting for new changes ...'));
  });
}
