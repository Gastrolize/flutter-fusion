#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const minimist = require('minimist');
require('colors');
const opentype = require('opentype.js');
const { isValidDartPackageName, getTextStyleContent, removeSymbols, buildLayerFirst, buildFeaturesFirst } = require('./helper.js');


const args = minimist(process.argv.slice(2), {
    alias: {
        f: 'fonts',
        w: 'with-text-styles',
        t: 'text-theme',
        l: 'layer-first'
    }
});

// Arguments
const projectName = args._[0];
const fontsFolderPath = args.fonts;
const textStyles = args["with-text-styles"];
const textTheme = args["text-theme"];
const layerFirst = args['layer-first'] ?? false;



// If no project name provided
if (!projectName) {
    console.error('Bitte gib einen Projektnamen an.'.red);
    process.exit(1);
}

// If project name is not valid dart package
if (!isValidDartPackageName(projectName)) {
    console.error(`"${projectName}" is not a valid Dart package name.
    The name should be all lowercase, with underscores to separate words,
"just_like_this".Use only basic Latin letters and Arabic digits: [a-z0-9_].Also,
make sure the name is a valid Dart identifier—that it doesn't start with digits
and isn't a reserved word.
See https://dart.dev/tools/pub/pubspec#name for more information.
`.red);
    process.exit(1);
}

// If provided --fonts flag without fonts path
if (fontsFolderPath === true) {
    console.error('Please provide a path after "--fonts" to your fonts folder'.red);
    process.exit(1);
}

// If provided text styles & theme flags without --fonts flag
if ((textStyles || textTheme) && !fontsFolderPath) {
    console.error('Please provide a path after "--fonts" to your fonts folder or remove -w, -t flags'.red);
    process.exit(1);
}



const projectPath = path.join(process.cwd(), projectName);

// Create flutter project and ignore output
execSync(`flutter create ${projectName}`, { stdio: 'ignore' });

console.log(`[+]: created Flutter project: ${projectName}`.cyan);

// main.dart
const mainDartContent = `
import 'package:flutter/material.dart';
import 'package:${projectName}/app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const App());
}
`;

// write main.dart
fs.writeFileSync(path.join(projectPath, 'lib', 'main.dart'), mainDartContent);


console.log(`[+]: changed main.dart`.cyan);





let pathStart;

// create architecture structure
if (layerFirst) {
    buildLayerFirst(fs, path, projectPath);

    pathStart = path.join(projectPath, 'lib', "presentation", 'home');
} else {
    buildFeaturesFirst(fs, path, projectPath);

    pathStart = path.join(projectPath, 'lib', "features", "home", "presentation");
}



console.log(`[+]: added feature-first layer`.cyan);

// create sample start file
const startDartContent = `
import 'package:flutter/material.dart';

class StartScreen extends StatelessWidget {
  const StartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: FlutterLogo(size: 100),
      ),
    );
  }
}
`;

// write start_screen.dart
fs.writeFileSync(path.join(pathStart, 'start_screen.dart'), startDartContent);

console.log(`[+]: added start_screen.dart`.cyan);

// change widget_test.dart for no errors;
const testDartContent = `
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:${projectName}/app.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const App());

    // Verify that our counter starts at 0.
    expect(find.text('0'), findsOneWidget);
    expect(find.text('1'), findsNothing);

    // Tap the '+' icon and trigger a frame.
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();

    // Verify that our counter has incremented.
    expect(find.text('0'), findsNothing);
    expect(find.text('1'), findsOneWidget);
  });
}
`;

// write widget_test.dart
fs.writeFileSync(path.join(projectPath, 'test', 'widget_test.dart'), testDartContent);

console.log(`[+]: changed widget_test.dart`.cyan);

// get yaml path
const pubspecPath = path.join(projectPath, 'pubspec.yaml');
let pubspecContent = fs.readFileSync(pubspecPath, 'utf8');



const fontList = [];


// detecting fonts
if (fontsFolderPath) {



    const fontsDir = path.join(projectPath, 'assets', 'fonts');
    fs.ensureDirSync(fontsDir);

    const fontFolders = fs.readdirSync(fontsFolderPath).filter(folder =>
        fs.lstatSync(path.join(fontsFolderPath, folder)).isDirectory()
    );

    if (fontFolders.length == 0) {
        console.warn("[-]: no font folders detected, make sure to give path of folder where all fonts folder are included as font family".yellow);
    }

    pubspecContent += `\n  fonts:\n`;
    fontFolders.forEach(folder => {
        const fontFamily = folder;
        console.log(`[+]: detected Font-Family: ${fontFamily}`.yellow);
        const fontFolderPath = path.join(fontsFolderPath, folder);
        const fontFiles = fs.readdirSync(fontFolderPath).filter(file =>
            file.endsWith('.ttf') || file.endsWith('.otf')
        );

        let fontInfoList = [];
        if (fontFiles.length > 0) {
            pubspecContent += `    - family: ${fontFamily}\n      fonts:\n`;
            fontFiles.forEach(file => {
                const sourcePath = path.join(fontFolderPath, file);
                const destPath = path.join(fontsDir, file);
                fs.copySync(sourcePath, destPath);
                pubspecContent += `        - asset: assets/fonts/${file}\n`;


                let fontInfo = {
                    fontFamily: fontFamily,
                    font: file,
                    italic: false,
                    weight: null
                };

                const font = opentype.loadSync(sourcePath);

                if (!font) {
                    console.log("No font");
                    return;
                }

                if (font.tables.os2 && font.tables.os2.usWeightClass !== undefined) {

                    const weights = font.tables.os2.usWeightClass;
                    fontInfo.weight = weights;
                    pubspecContent += `          weight: ${weights}\n`;

                    if (font.tables['post'] && font.tables['post'].italicAngle !== undefined && font.tables['post'].italicAngle !== 0) {
                        console.log(`[+]: including Font: ${file} - ${weights} - italic`.yellow);
                        pubspecContent += `          style: italic\n`;
                        fontInfo.italic = true;

                    } else {
                        console.log(`[+]: including Font: ${file} - ${weights}`.yellow);

                    }


                } else {
                    console.log(`[+]: including Font: ${file}`.yellow);
                }


                fontInfoList.push(fontInfo);


            });
        } else {
            console.warn("[-]: Fonts ignored, no .ttf or .otf files were found".yellow);
        }

        if (fontInfoList.length > 0) {
            fontList.push({ fontFamily: fontFamily, fonts: fontInfoList });
        }
    });

    console.log('[+]: included fonts'.green);
} else {
    console.warn('[-]: No fonts included, if you want to include fonts use --fonts /path/to/fonts command'.yellow);
}

// write new yaml
fs.writeFileSync(pubspecPath, pubspecContent);

// write textstyles
if (textStyles) {

    if (fontList.length == 0) {
        console.log("No fonts detected".yellow);
        return;
    }

    let stylesDartContent = `import 'package:flutter/material.dart';\n\n`;








    for (const fontFamilyList of fontList) {
        const fontFamily = fontFamilyList.fontFamily;


        if (fontFamilyList.fonts.length > 0) {

            stylesDartContent += `class Styles${removeSymbols(fontFamily)} {\n`;

            for (const font of fontFamilyList.fonts) {

                if (font != null && !font.italic) {
                    stylesDartContent += getTextStyleContent(font);
                }
            }
            stylesDartContent += '}\n\n';
        }


    }



    fs.mkdirSync(path.join(projectPath, 'lib', "styling"));
    fs.writeFileSync(path.join(projectPath, 'lib', 'styling', 'styles.dart'), stylesDartContent);
}


const textThemeList = [
    'displayLarge: TextStyle(fontSize: 57.0, fontWeight: FontWeight.w900)',  // Black
    'displayMedium: TextStyle(fontSize: 45.0, fontWeight: FontWeight.w800)', // ExtraBold
    'displaySmall: TextStyle(fontSize: 36.0, fontWeight: FontWeight.w700)',  // Bold
    'headlineLarge: TextStyle(fontSize: 32.0, fontWeight: FontWeight.w600)', // SemiBold
    'headlineMedium: TextStyle(fontSize: 28.0, fontWeight: FontWeight.w500)',// Medium
    'headlineSmall: TextStyle(fontSize: 24.0, fontWeight: FontWeight.w400)', // Regular
    'titleLarge: TextStyle(fontSize: 22.0, fontWeight: FontWeight.w700)',    // Light
    'titleMedium: TextStyle(fontSize: 16.0, fontWeight: FontWeight.w500)',   // ExtraLight
    'titleSmall: TextStyle(fontSize: 14.0, fontWeight: FontWeight.w400)',    // Thin
    'bodyLarge: TextStyle(fontSize: 16.0, fontWeight: FontWeight.w600)',     // Regular
    'bodyMedium: TextStyle(fontSize: 14.0, fontWeight: FontWeight.w500)',    // Regular
    'bodySmall: TextStyle(fontSize: 12.0, fontWeight: FontWeight.w400)',     // Light
    'labelLarge: TextStyle(fontSize: 14.0, fontWeight: FontWeight.w500)',    // Medium
    'labelMedium: TextStyle(fontSize: 12.0, fontWeight: FontWeight.w400)',   // Regular
    'labelSmall: TextStyle(fontSize: 10.0, fontWeight: FontWeight.w300)',
]



let textThemeContent = '';

// write text themes
if (textTheme) {
    textThemeContent = `textTheme: const TextTheme(
        ${textThemeList.join(",\n              ")}
    )`;

    console.log(`[+]: included TextTheme in app.dart`.cyan);

}




// custom app.dart
const appDartContent = `
import 'package:flutter/material.dart';
import 'package:${projectName}/${layerFirst ? 'presentation/home/start_screen.dart' : 'features/home/presentation/start_screen.dart'}';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
        ${textThemeContent}
      ),
      initialRoute: "start",
      onGenerateRoute: (RouteSettings route) {
        switch (route.name) {
          default:
            return MaterialPageRoute(builder: (context) => const StartScreen());
        }
      },
    );
  }
}
`;

// write app.dart
fs.writeFileSync(path.join(projectPath, 'lib', 'app.dart'), appDartContent);

console.log(`[+]: added & changed app.dart`.cyan);

console.log('Successfully installed boilerplate project'.green);
