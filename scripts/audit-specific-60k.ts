import prisma from '../lib/db';

async function auditSpecific60k() {
    console.log('--- Baaritaanka Gaarka ah ee 60k-da (Partial Payment) ---\n');

    try {
        // Hel Kharashka (Expense) qiimihiisu yahay ugu dhawaan 73k ama uu la socdo 60k oo la bixiyay
        const expenses = await prisma.expense.findMany({
            where: {
                paymentStatus: 'PARTIAL',
                // Haddii aad taqaanid description-ka waad raadin kartaa, haddii kale waxaan soo bixinaynaa dhammaan kuwa PARTIAL ah si aan u aragno
            },
            include: {
                transactions: true,
                account: true,
                vendor: true,
                project: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5 // Soo qaado 5-tii ugu dambeysay
        });

        console.log(`Waxa la helay ${expenses.length} kharash oo dhowaan PARTIAL la dhiibay.`);

        for (const exp of expenses) {
            console.log(`\n======================================================`);
            console.log(`=> KHARASH ID (Expense ID): ${exp.id}`);
            console.log(`=> Sharaxaad (Description): ${exp.description}`);
            console.log(`=> Wadarta Kharashka (Total Amount): $${exp.amount}`);
            console.log(`=> Goobta (Project ID): ${exp.projectId || 'Lama diiwaangelinmashruuc'}`);
            console.log(`   Iibiyaha (Vendor): ${exp.vendor ? exp.vendor.name : 'XUJAAN: LAMA DOORAN (Tani waxay sababeysaa in Transaction-ka uu 60k Inflow ka dhigo)'}`);
            console.log(`   Taariikh: ${exp.createdAt.toISOString()}`);

            console.log(`\n=> DIIWAANADA XISAABTA (Transactions) EE KU XIRAN KHARASHKAN:`);

            let trxCount = 1;
            exp.transactions.forEach(t => {
                console.log(`   -----------------`);
                console.log(`   [TRANSACTION ${trxCount}]`);
                console.log(`   - Diiwaanka ID: ${t.id}`);
                console.log(`   - Sharaxaad: ${t.description}`);
                console.log(`   - Nooca Diiwaanka (Type): --> [ ${t.type} ] <--`);
                console.log(`   - Lacagta kujirta Diiwaanka (Amount): $${t.amount}`);

                // Sharaxaad yar oo la socota type-ka iyo amount-ka
                if (t.type === 'DEBT_TAKEN') {
                    console.log(`     Sharax: Tani waa diiwaanka muujinaya inaad 73k deyn ahaan u qaadatay (Total Debt). Akoon lama xirin.`);
                } else if (t.type === 'DEBT_REPAID') {
                    console.log(`     Sharax: Tani waa diiwaanka muujinaya 60k-da aad bixisay.`);
                    const isPositive = Number(t.amount) > 0;
                    console.log(`     MUHIIM: Lacagtu ma Negative baa mise waa Positive? ${isPositive ? 'Waa POSITIVE (+) (Waxa u xisaabsan in lacag idin soo gashay!)' : 'Waa NEGATIVE (-) (Sida saxda ah e lacag idinka baxaysa)'}`);
                }

                console.log(`   - Taariikhda la diray: ${t.transactionDate.toISOString()}`);
                console.log(`   - Akoonka ay ku dhacday (Account ID): ${t.accountId || 'WAA VIRTUAL RECORD (Akoon malahan)'}`);

                trxCount++;
            });
            console.log(`======================================================\n`);
        }

    } catch (error) {
        console.error('Cilad:', error);
    } finally {
        await prisma.$disconnect();
    }
}

auditSpecific60k();
