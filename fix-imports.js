const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFiles() {
    const directory = path.join(__dirname, 'app');
    let updatedCount = 0;

    walkDir(directory, function (filePath) {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');

            // The regex matches any combination of ../ (2 or more times) followed by components/
            // and replaces the whole relative prefix with @/components/
            const regex = /from\s+['"](?:\.\.\/){2,}components\/(.*?)['"]/g;

            if (regex.test(content)) {
                const updatedContent = content.replace(regex, "from '@/components/$1'");
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`Updated imports in: ${filePath}`);
                updatedCount++;
            }
        }
    });

    console.log(`\nReplacement complete. Total files updated: ${updatedCount}`);
}

processFiles();
