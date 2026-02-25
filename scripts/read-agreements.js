const fs = require('fs');

const content = fs.readFileSync('agreements.log', 'utf16le');
console.log(content);
