const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Using a simpler string split to extract the style content
    const startStr = "<style dangerouslySetInnerHTML={{";
    const cssStartStr = "__html: `";
    
    const startIndex = content.indexOf(startStr);
    if (startIndex === -1) {
        console.log('No style tag found in ' + filePath);
        return;
    }
    
    const cssStartIndex = content.indexOf(cssStartStr, startIndex) + cssStartStr.length;
    
    const cssEndStr = "`";
    // We must find the closing backtick of the style block, which is right before "}} />"
    const tagEndStr = "}} />";
    const tagEndIndex = content.indexOf(tagEndStr, cssStartIndex);
    
    if (tagEndIndex === -1) {
        console.log('Could not find end of style tag in ' + filePath);
        return;
    }
    
    // The CSS content is between cssStartIndex and the backtick right before tagEndIndex
    let cssEndIndex = tagEndIndex - 1;
    while (content[cssEndIndex] !== '`' && cssEndIndex > cssStartIndex) {
        cssEndIndex--;
    }
    
    const cssContent = content.substring(cssStartIndex, cssEndIndex).trim();
    
    const cssPath = filePath.replace('.tsx', '.css');
    fs.writeFileSync(cssPath, cssContent, 'utf8');
    
    // Remove the whole style tag
    const fullTagEndIndex = tagEndIndex + tagEndStr.length;
    content = content.substring(0, startIndex) + content.substring(fullTagEndIndex);
    
    // Add import at the top
    const fileName = path.basename(cssPath);
    const importLine = `import './${fileName}';\n`;
    content = importLine + content;
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed ' + filePath);
}

fixFile('telemetry-desktop/src/App.tsx');
fixFile('src/app/resources/spec2/page.tsx');
