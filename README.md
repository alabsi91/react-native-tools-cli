# Node.js CLI template

> ⚠️⚠️ For Windows only

- ✅ TypeScript.
- ✅ EsLint.
- ✅ EsBuild.
- ✅ Inquirer.
- ✅ Chalk.
- ✅ Gradient-string
- ✅ Nsis installer.
- ✅ Helpers
  - Arguments parser.
  - Spinner (loading).

## 🔷 Scripts

### `start:dev`

- Start the project in development mode **( Hot Reload )**.

### `build:js`

- Build typescript files into javascript files.

### `serve:build`

- Start the project from the build folder.

### `build:bundle`

- Bundle the project and its dependencies into a single minified file.

### `serve:bundle`

- Start the project from the bundle folder.

### `build:installer`

- Creates an NSIS installer to install your CLI to Windows.
- First, you need to install `NSIS` to your system via PowerShell `winget install NSIS.NSIS`.
- The installer will add the installation folder path to the `PATH` system variable.
- By default, the installer will include Node.js.
- To change the installer icon and banner, replace the files in `.\scripts\installer-assets`
- The script will get the installer information from the `package.json` file.
- See `.\scripts\build-installer.js` for more information.

## 🔷 Usage

- First clone the project.

```
git clone https://github.com/alabsi91/nodejs-cli-typescript-nsis-template.git
```

- Then go to the project folder and install the dependencies.

```
npm install
```
