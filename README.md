# Boilerplate Flutter Project

When you use `flutter create test`, it generates a standard project with `MyApp`. However, with Flutter Fusion, the experience gets enhanced. It automates the detection and integration of fonts into the `yaml` file. Additionally, it offers the choice between a features-first or layer-first architecture.

Moreover, it provides the option to include a `textTheme` automatically or generate a Styles Class for easy access to various `TextStyles`, such as `StylesRoboto.bold(20, color: Colors.black)`.

## Installation

To install Flutter Fusion globally, run:

```bash
npm install -g flutter-fusion
```

## Flags

- `-f /path/to/fonts` or `--fonts /path/to/fonts`: This flag facilitates the automatic detection of fonts and their respective weights. Ensure that you organize your font files as follows:

**Note**: The font family folder should be named exactly as your font family (e.g., "Roboto") - 

Example Structure:
  - `path/to/fonts/Roboto/`
    - Place your .ttf or .otf font files inside the `Roboto` folder (You don't need to rename the .ttf or .otf files; their original names are sufficient.)
  - `path/to/fonts/Poppins/`
    - Place your .ttf or .otf font files inside the `Poppins` folder (You don't need to rename the .ttf or .otf files; their original names are sufficient.)
  - `path/fo/fonts/OtherFontFamily/`



flutter-fusion will automatically detect the FontFamilies: `Roboto` with their respective fonts and `Poppins` with their respective fonts.




- `-w` or `--with-text-styles`: This flag generates custom TextStyles as a Class for your custom FontFamily. Note that the --font flag is needed for this.

- `-t` or `--text-theme`: Utilize this flag to add textTheme automatically to your MaterialApp.

- `-l` or `--layer-first`: Opt for Layer-First Architecture instead of the default Features-First Architecture.
