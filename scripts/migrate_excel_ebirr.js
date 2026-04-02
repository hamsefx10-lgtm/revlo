const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function migrateEbirr() {
    const prisma = new PrismaClient();
    try {
        const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
        const accountInfo = await prisma.account.findUnique({ where: { id: EBIRR_ID } });
        if (!accountInfo) throw new Error("Account not found");
        const COMPANY_ID = accountInfo.companyId;

        const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
        
        const validRows = [];
        let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
        if (startIndex === -1) startIndex = 3;
        
        for (let i = startIndex + 1; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            
            let rawCols = line.split('\t');
            if (rawCols.length < 5 && !line.includes('/') && validRows.length > 0) {
                 const prev = validRows[validRows.length - 1];
                 prev.description += ' ' + line.replace(/\t/g, ' ');
                 continue; 
            }
            
            const cols = rawCols.filter(c => c.trim() !== '' && c.trim() !== 'N/A');
            let dateStr = cols[0].trim();
            
            const validTypes = ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEBT_TAKEN', 'DEBT_REPAID', 'DEBT_GIVEN', 'DEBT_RECEIVED'];
            let typeIndex = cols.findIndex(c => validTypes.includes(c.trim()));
            if (typeIndex === -1) continue;
            let typeStr = cols[typeIndex].trim();
            let descStr = cols.slice(1, typeIndex).join(' ').trim() || 'Record';
            
            const inAmtStr = rawCols[rawCols.length - 3];
            const outAmtStr = rawCols[rawCols.length - 2];
            let inAmt = parseFloat(inAmtStr ? inAmtStr.replace(/,/g, '') : '0') || 0;
            let outAmt = parseFloat(outAmtStr ? outAmtStr.replace(/,/g, '') : '0') || 0;
            
            let amount = inAmt > 0 ? inAmt : outAmt;
            if (amount === 0 && descStr !== 'error') {
                 const numbers = [];
                 for (let j = typeIndex + 1; j < cols.length; j++) {
                     const val = cols[j].replace(/,/g, '').trim();
                     if (!isNaN(parseFloat(val)) && isFinite(val)) numbers.push(parseFloat(val));
                 }
                 amount = numbers.find(n => n > 0) || 0;
            }
            if (amount === 0 && descStr !== 'error') continue;
            if (descStr === 'error') amount = 1; 

            if (isNaN(amount) || amount === null || typeof amount !== 'number') continue;
            
            const dParts = dateStr.split('/');
            let jsDate = null;
            if (dParts.length === 3) {
                jsDate = new Date(`${dParts[2]}-${dParts[0].padStart(2, '0')}-${dParts[1].padStart(2, '0')}T12:00:00.000Z`);
            } else { jsDate = new Date(dateStr); }

            if (isNaN(jsDate.valueOf())) continue;
            
            // To force OUTFLOW on DEBT_REPAID, we map it back to standard EXPENSE
            // since assigning random foreign keys can cause strict referential failures
            if (typeStr === 'DEBT_REPAID' && outAmt > 0) {
                typeStr = 'EXPENSE'; 
            }

            let relatedStr = rawCols[4] ? rawCols[4].trim() : '';
            if (relatedStr && relatedStr !== 'N/A') {
                descStr += ` (La Xiriira: ${relatedStr})`;
            }

            validRows.push({
                accountId: EBIRR_ID,
                companyId: COMPANY_ID,
                description: descStr,
                type: typeStr,
                amount: amount,
                transactionDate: jsDate,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        
        console.log(`Parsed ${validRows.length} valid rows from Excel.`);

        const cutoffDate = new Date('2026-03-16T23:59:59.999Z');
        console.log(`2. Deleting old E-BIRR records chronologically UP TO ${cutoffDate.toISOString()}`);
        
        await prisma.transaction.deleteMany({
            where: { accountId: EBIRR_ID, transactionDate: { lte: cutoffDate } }
        });
        
        console.log(`3. Injecting ${validRows.length} fresh verified transactions into DB...`);
        
        let inserted = 0;
        for (const row of validRows) {
            await prisma.transaction.create({ data: row });
            inserted++;
        }
        console.log(`INSERTED ${inserted} fresh records!`);

        await prisma.transaction.updateMany({
            where: { accountId: EBIRR_ID },
            data: { updatedAt: new Date() } 
        });

    } catch (e) {
        console.log("FATAL:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
migrateEbirr();
