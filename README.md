# Node.js CLI template

- ✅ Typescript.
- ✅ eslint.
- ✅ esbuild.
- ✅ prettier.
- ✅ Inquirer.
- ✅ Chalk.
- ✅ Gradient-string
- ✅ node-fetch
- ✅ NSIS installer
- ✅ built-in:
  - Arguments parser.
  - Help message generator.
  - Logger.
  - Spinner (loading).
  - and more...

## Scripts

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

### `build:executable`

- Build the project into an executable file.
- Supports Windows, Linux and macOS.
- Nodejs version must be `20` or higher.

### `build:installer`

> ⚠️ For Windows only

- Creates an NSIS installer.


## Usage

- First clone the project.

```console
git clone https://github.com/alabsi91/nodejs-cli-typescript-nsis-template.git
```

- Then go to the project folder and install the dependencies.

```console
npm install
```
