import { Log } from '@/cli-tools/logger.js';
import Schema from '@schema';
import { askToEnterProjectRootPath, isReactNativeRootDir } from '@utils/utils.js';
import chalk from 'chalk';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

const XMLTemplate = (font: string) => {
  return (
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<font-family xmlns:app="http://schemas.android.com/apk/res-auto">\n' +
    font +
    '\n</font-family>\n'
  );
};
const fontTemplate = (name: string, style: string, weight: string) => {
  return (
    '    ' +
    '<font\n' +
    '        ' +
    'app:font="@font/' +
    path.parse(name).name +
    '\n        ' +
    'app:fontStyle=' +
    `"${style}"` +
    '\n        ' +
    'app:fontWeight=' +
    `"${weight}"` +
    ' />'
  );
};

const XMLTemplate_v26 = (font: string) => {
  return (
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<font-family xmlns:android="http://schemas.android.com/apk/res-auto">\n' +
    font +
    '\n</font-family>\n'
  );
};
const fontTemplate_v26 = (name: string, style: string, weight: string) => {
  return (
    '    ' +
    '<font\n' +
    '        ' +
    'android:font="@font/' +
    path.parse(name).name +
    '\n        ' +
    'android:fontStyle=' +
    `"${style}"` +
    '\n        ' +
    'android:fontWeight=' +
    `"${weight}"` +
    ' />'
  );
};

async function parseFontsInfo(fontsDir: string) {
  const fontsFiles = await fs.readdir(fontsDir);
  const fontsInfo = [];
  const fontsFamilies = new Set<string>();

  for (const fileName of fontsFiles) {
    const fontFamily = fileName.split('-')[0];
    const normalizeName = fileName.toLowerCase().replace(/-/g, '_');
    let variant = normalizeName.split(/[_.]/)[1];

    if (!variant || !fontFamily) {
      console.log(
        '\n⛔',
        chalk.red('The font name'),
        chalk.yellow(fileName),
        chalk.red('is not valid, font name should be in this format'),
        chalk.yellow('name-variantStyle.ext'),
        chalk.red('Ex:'),
        chalk.yellow('Roboto-Light.ttf, Roboto-LightItalic.ttf'),
        '\n',
      );
      process.exit(1);
    }

    const isItalic = variant.endsWith('italic');
    if (isItalic) variant = variant.slice(0, -6);

    const fontWeightValue = fontWeight[variant as keyof typeof fontWeight];
    if (!fontWeightValue) {
      console.log('\n⛔', chalk.red('Error while parsing the font name'), chalk.yellow(fileName), '\n');
      process.exit(1);
    }

    fontsFamilies.add(fontFamily);
    fontsInfo.push({
      sourcePath: path.join(fontsDir, fileName),
      fontFamily,
      name: normalizeName,
      weight: fontWeightValue,
      style: isItalic ? 'italic' : 'normal',
    });
  }

  return { fontsInfo, fontsFamilies };
}

function printCodeExample(fontsFamilies: Set<string>) {
  const colors = [
    chalk.rgb(34, 208, 168),
    chalk.rgb(255, 170, 108),
    chalk.rgb(161, 150, 255),
    chalk.rgb(222, 120, 134),
    chalk.rgb(114, 130, 135),
    chalk.rgb(80, 175, 236),
  ];

  const newLine = (count: number) => '\n'.repeat(count);
  const indent = (count: number) => ' '.repeat(count);

  console.log(chalk.yellow.inverse.bold(' One more thing to do: '), newLine(1));
  process.stdout.write('- Go to the file: ');
  console.log(chalk.blue(`\`android/app/src/main/java/com/${chalk.red('{your.package}')}/MainActivity\``));
  console.log('- Then add the following code:', newLine(1));
  console.log(colors[4]('// Add this 👇'));
  console.log(colors[0]('import'), colors[1]('com.facebook.react.common.assets.ReactFontManager'), newLine(1));
  console.log(
    chalk.yellow('class'),
    colors[0]('MainActivity'),
    chalk.white(':'),
    colors[2]('ReactActivity') + chalk.yellow('() {'),
    newLine(1),
  );

  console.log(
    indent(4),
    chalk.yellow('override'),
    colors[0]('fun'),
    colors[5]('onCreate') + chalk.yellow('(') + chalk.magenta('savedInstanceState') + chalk.white(':'),
    colors[2]('Bundle?') + chalk.yellow(') {'),
    newLine(1),
  );

  console.log(
    indent(8),
    colors[3]('super') + chalk.white('.') + colors[5]('onCreate') + chalk.yellow('(') + chalk.red('null') + chalk.yellow(')'),
    colors[4]('// If you are not using "react-native-screen", use `super.onCreate(savedInstanceState)` instead.'),
    newLine(1),
  );

  console.log(indent(8), colors[4]('// Add this 👇'));

  console.log(
    indent(8),
    Array.from(fontsFamilies)
      .map(
        fontFamily =>
          colors[5]('ReactFontManager') +
          chalk.white('.') +
          colors[1]('getInstance') +
          chalk.yellow('()') +
          chalk.white('.') +
          colors[0]('addCustomFont') +
          chalk.yellow('(') +
          chalk.red('this') +
          chalk.white(', ') +
          chalk.green(`"${fontFamily}"`) +
          chalk.white(', ') +
          colors[2]('R') +
          chalk.white('.') +
          colors[1]('font') +
          chalk.white('.') +
          colors[0](fontFamily.toLowerCase()) +
          chalk.yellow(')'),
      )
      .join(newLine(1) + indent(9)),
  );

  console.log(newLine(1), indent(4), chalk.yellow('}'));
  console.log(newLine(1), chalk.yellow('}'));
  console.log(newLine(2), chalk.green.inverse.bold(' Great! '));
  console.log(newLine(1), '"Now, you can use the fonts after', chalk.yellow.bold.inverse('rebuilding'), 'your app. For example:');
  console.log(newLine(1), chalk.cyan('{'), newLine(1));
  console.log(
    chalk.white('  fontFamily') + chalk.yellow(':'),
    Array.from(fontsFamilies)
      .map(fontFamily => chalk.green(`'${fontFamily}'`))
      .join(chalk.red(' or ')),
  );
  console.log(newLine(1), chalk.cyan('}'), newLine(1));
}

export async function generateAndroidFontsCommand(projectPath = '') {
  const isReactNative = await isReactNativeRootDir(projectPath);
  if (!isReactNative) {
    Log.error('\nThis script must be run in a react-native project !!\n');
    projectPath = await askToEnterProjectRootPath();
  }

  const fontsPath = path.join(projectPath, 'src', 'assets', 'fonts');

  // get all the font files
  if (!existsSync(fontsPath)) {
    Log.error('\nNo fonts found in', chalk.yellow('"src/assets/fonts"'), '. !!\n');
    process.exit(1);
  }

  const { fontsInfo, fontsFamilies } = await parseFontsInfo(fontsPath);

  // create fonts folder if it doesn't exist in android/app/src/main/res
  const fontAndroidDir = path.join(projectPath, 'android', 'app', 'src', 'main', 'res', 'font');
  if (!existsSync(fontAndroidDir)) await fs.mkdir(fontAndroidDir);

  // create font-v26 folder if it doesn't exist in android/app/src/main/res/font
  const fontAndroidDir_v26 = path.join(fontAndroidDir, 'font-v26');
  if (!existsSync(fontAndroidDir_v26)) await fs.mkdir(fontAndroidDir_v26);

  // copy all the font files to android/app/src/main/res/font
  for (const { sourcePath, name } of fontsInfo) {
    const destPath = path.join(fontAndroidDir, name);
    await fs.copyFile(sourcePath, destPath);
  }

  // create fontFamily.xml for each font family
  for (const fontFamily of fontsFamilies) {
    const fontsByFamily = fontsInfo.filter(font => font.fontFamily === fontFamily);

    const fontsXML = fontsByFamily.map(font => fontTemplate(font.name, font.style, font.weight));
    const familyXML = XMLTemplate(fontsXML.join('\n'));
    const fontXMLPath = path.join(fontAndroidDir, `${fontFamily.toLowerCase()}.xml`);
    await fs.writeFile(fontXMLPath, familyXML);

    const fontsXML_v26 = fontsByFamily.map(font => fontTemplate_v26(font.name, font.style, font.weight));
    const familyXML_v26 = XMLTemplate_v26(fontsXML_v26.join('\n'));
    const fontXMLPath_v26 = path.join(fontAndroidDir_v26, `${fontFamily.toLowerCase()}.xml`);
    await fs.writeFile(fontXMLPath_v26, familyXML_v26);
  }

  Log.success('\nFonts generated successfully !!\n\n');

  printCodeExample(fontsFamilies);
}

generateAndroidFontsCommand.schema = Schema.createCommand({
  command: 'generate-fonts',
  description: 'Setup fonts on Android using ./src/assets/fonts/',
  options: [
    {
      name: 'path',
      type: z.string().optional().describe('Specify the React Native root project path.'),
    },
  ],
});
