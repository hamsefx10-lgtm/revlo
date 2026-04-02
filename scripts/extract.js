const fs = require('fs');

function splitSqlValues(str) {
  let res = [];
  let inStr = false;
  let current = '';
  for(let i=0; i<str.length; i++) {
    if(str[i]==="'") {
      if(i+1<str.length && str[i+1]==="'") {
        current+="'"; i++;
      } else {
        inStr = !inStr;
      }
    } else if(str[i]===',' && !inStr) {
      res.push(current.trim());
      current='';
    } else {
      current += str[i];
    }
  }
  res.push(current.trim());
  return res.map(r => r === 'NULL' ? null : r.replace(/^'|'$/g, ''));
}

const sql = fs.readFileSync('railway_dump.sql', 'utf8');
const lines = sql.split('\n');
const txLines = lines.filter(l => l.includes('INSERT INTO public.transactions VALUES') && l.includes('3c156507-ea0a-4974-8a54-92f1e9dd519a'));

const parsedTxs = txLines.map(line => {
  const match = line.match(/VALUES \((.*)\);/);
  if (!match) return null;
  return splitSqlValues(match[1]);
}).filter(Boolean);

console.log('Total found:', parsedTxs.length);
if (parsedTxs.length > 0) {
    parsedTxs[0].forEach((col, idx) => console.log(`${idx}: ${col}`));
}
