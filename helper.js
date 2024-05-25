function isValidDartPackageName(name) {
    const dartIdentifier = /^[a-z][a-z0-9_]*$/;
    const reservedWords = [
        'abstract', 'else', 'import', 'show', 'as', 'enum', 'in', 'static', 'assert', 'export',
        'interface', 'super', 'async', 'extends', 'is', 'switch', 'await', 'external', 'library',
        'sync', 'break', 'factory', 'mixin', 'this', 'case', 'false', 'new', 'throw', 'catch',
        'final', 'null', 'true', 'class', 'finally', 'on', 'try', 'const', 'for', 'operator',
        'typedef', 'continue', 'function', 'part', 'var', 'covariant', 'get', 'rethrow', 'void',
        'default', 'hide', 'return', 'while', 'deferred', 'if', 'set', 'with', 'do', 'implements',
        'show', 'yield', 'dynamic'
    ];

    return dartIdentifier.test(name) && !reservedWords.includes(name);
}

function getTextStyleContent(font){
        
    return `static TextStyle ${toCamelCase(font["font"].split(".")[0])}(double fontSize,
        {bool italic = false, Color color = Colors.black,bool line=false,bool shadow=false}) {
      return TextStyle(
          fontFamily: "${font["fontFamily"]}",
          color: color,
          ${font["weight"] ? `fontWeight: FontWeight.w${font["weight"]},` : ''}
          fontSize: fontSize,
          fontStyle: italic ? FontStyle.italic : FontStyle.normal,
          decoration: line ? TextDecoration.lineThrough: TextDecoration.none,shadows: shadow ? [ Shadow(color: Colors.white.withOpacity(0.5), blurRadius: 5.0)] : []
        );
    }\n`;
}

function findAllFontWeightIndices(list, target) {
    let indices = [];
    for (let i = 0; i < list.length; i++) {
        if (list[i].includes(target)) {
            indices.push(i);
        }
    }
    return indices;
}

function toCamelCase(str) {
    return str.replace(/[^A-Za-z]/g, '').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
  }

function removeSymbols(str){
    return str.replace(/[^A-Za-z]/g, '');
}


function buildLayerFirst(fs, path, projectPath){
    fs.mkdirSync(path.join(projectPath, 'lib', "presentation"));
    fs.mkdirSync(path.join(projectPath, 'lib', "application"));
    fs.mkdirSync(path.join(projectPath, 'lib', "data"));
    fs.mkdirSync(path.join(projectPath, 'lib', "domain"));


    fs.mkdirSync(path.join(projectPath, 'lib', "presentation",  'home'));
}

function buildFeaturesFirst(fs, path, projectPath){
    fs.mkdirSync(path.join(projectPath, 'lib', "features"));
    fs.mkdirSync(path.join(projectPath, 'lib', "features", 'home'));

    fs.mkdirSync(path.join(projectPath, 'lib', "features", 'home', "presentation"));
    fs.mkdirSync(path.join(projectPath, 'lib', "features", 'home', "application"));
    fs.mkdirSync(path.join(projectPath, 'lib', "features", 'home', "data"));
    fs.mkdirSync(path.join(projectPath, 'lib', "features", 'home', "domain"));
}


module.exports = {
    isValidDartPackageName,
    getTextStyleContent,
    findAllFontWeightIndices,
    toCamelCase,
    removeSymbols,
    buildLayerFirst,
    buildFeaturesFirst
};