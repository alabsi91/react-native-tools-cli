export default {
  // Output folder for the installer
  outFolder: 'installer',

  // Output JavaScript file for the installer
  outJsFile: 'index.cjs',

  // Entry file for the installer
  entryFile: 'src/index.ts',

  // NSIS (Nullsoft Scriptable Install System) CLI path
  nsisCliPath: 'C:/Program Files (x86)/NSIS/makensis.exe',

  // Files or folders to be included in the installer
  includeAssets: [],

  // Flag to include Node.js in the installer, making the installer larger in size
  // Will add an option to install Node.js in the installer, true by default
  includeNodejs: false,

  // Node.js version to download
  nodeVersion: 'latest-v20.x',

  // Function to generate Node.js download link based on the version
  nodeDownloadLink: version => `https://nodejs.org/dist/${version}/win-x64/node.exe`,

  // Flag to copy an existing node.exe on this machine instead of downloading it
  useCurrentNodeExe: true,

  // Flag to remove all files after build except `installer.exe`
  cleanAfterBuild: true,
};
