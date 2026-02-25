const fs = require('fs');
const content = fs.readFileSync('nuur-txns.log', 'utf16le');
console.log(content);
