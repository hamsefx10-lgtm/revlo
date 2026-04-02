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
      res.push(current.trim().replace(/^'|'$/g, ''));
      current='';
    } else {
      current += str[i];
    }
  }
  res.push(current.trim().replace(/^'|'$/g, ''));
  return res.map(r => r === 'NULL' ? null : r);
}

const sql = fs.readFileSync('railway_dump.sql', 'utf8');
const lines = sql.split('\n');

// Find all account insertions
const accountLines = lines.filter(l => l.includes('INSERT INTO public.accounts VALUES'));

let results = [];

for (const line of accountLines) {
  const match = line.match(/VALUES \((.*)\);/);
  if (!match) continue;
  
  const vals = splitSqlValues(match[1]);
  const id = vals[0];
  const name = vals[1];
  const balance = Number(vals[2]);

  if (name.toLowerCase().includes('birr') || name.toLowerCase().includes('cbe')) {
    results.push({ id, name, balance });
  }
}

console.log('--- Account Balances from railway_dump.sql (March 19) ---');
results.forEach(r => {
  console.log(`${r.name} (ID: ${r.id}) -> Balance: ${r.balance} ETB`);
});
