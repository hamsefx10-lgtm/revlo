const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name === 'route.ts') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If it contains GET method AND uses request.url or headers or cookies or session and lacks export const dynamic
      if (content.includes('export async function GET') && !content.includes('export const dynamic')) {
        // Add export const dynamic = 'force-dynamic'; after the imports
        let lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('//')) {
            lastImportIndex = i;
          }
        }
        
        lines.splice(lastImportIndex + 1, 0, '\nexport const dynamic = \'force-dynamic\';\n');
        fs.writeFileSync(fullPath, lines.join('\n'));
        console.log('Fixed:', fullPath);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'app', 'api'));
processDir(path.join(process.cwd(), 'app', 'shop', 'api')); // If exists
