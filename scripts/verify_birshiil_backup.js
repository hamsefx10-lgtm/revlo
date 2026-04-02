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
const txLines = lines.filter(l => l.includes('INSERT INTO public.transactions VALUES') && l.includes('3c156507-ea0a-4974-8a54-92f1e9dd519a'));

let totalIn = 0;
let totalOut = 0;

console.log(`Transactions for Birshiil in Backup:`);
for (const line of txLines) {
  const match = line.match(/VALUES \((.*)\);/);
  if (!match) continue;
  
  const vals = splitSqlValues(match[1]);
  const amt = Math.abs(Number(vals[2]));
  const type = vals[3];
  
  const accountId = vals[8];
  const fromAccountId = vals[9];
  const toAccountId = vals[10];
  
  const isBirshiil = (id) => id === '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  let isIn = false;
  let isOut = false;

  if (!accountId) {
    if (isBirshiil(toAccountId)) isIn = true;
    else if (isBirshiil(fromAccountId)) isOut = true;
  } else if (isBirshiil(accountId)) {
    const isIncomeType = ['INCOME','DEBT_RECEIVED','TRANSFER_IN','SHAREHOLDER_DEPOSIT'].includes(type) || 
                   (type === 'DEBT_REPAID' && !vals[14] && !vals[12]);
    if (isIncomeType) isIn = true;
    else isOut = true;
  }

  if (isIn && !isOut) {
     totalIn += amt;
  } else if (!isIn && isOut) {
     totalOut += amt;
  }
}

console.log(`Total IN: ${totalIn}`);
console.log(`Total OUT: ${totalOut}`);
console.log(`NET BALANCE IN BACKUP: ${totalIn - totalOut}`);
