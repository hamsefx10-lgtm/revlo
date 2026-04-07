const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes("export const dynamic = 'force-dynamic';")) {
        // Remove bad injections safely
        const lines = content.split('\n');
        const cleanLines = lines.filter(line => !line.includes("export const dynamic = 'force-dynamic';"));
        let newContent = cleanLines.join('\n');
        
        // Inject before the first export
        const funcMatch = newContent.match(/export (async )?function/);
        if (funcMatch) {
            newContent = newContent.slice(0, funcMatch.index) + "\nexport const dynamic = 'force-dynamic';\n\n" + newContent.slice(funcMatch.index);
        }
        
        fs.writeFileSync(fullPath, newContent);
        console.log('Cleaned and Fixed:', fullPath);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'app', 'api'));
processDir(path.join(process.cwd(), 'app', 'shop', 'api')); // If exists
