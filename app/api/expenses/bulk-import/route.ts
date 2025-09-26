// app/api/expenses/bulk-import/route.ts - Bulk Import Expenses API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation if needed
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants

// MUHIIM: Waxaad u baahan doontaa library si aad u baarto CSV/Excel.
// Tusaale: 'csv-parser' ama 'xlsx'
// npm install csv-parser
// npm install xlsx

// POST /api/expenses/bulk-import - Dhoofi kharashyo badan
export async function POST(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;
    // const userId = session.user.id; // User-ka diiwaan geliyay

    const formData = await request.formData();
    const file = formData.get('file') as File; // Faylka la soo shubay

    if (!file) {
      return NextResponse.json(
        { message: 'Fadlan soo shub fayl.' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    // Halkan waxaad ku baari doontaa faylka (CSV/Excel)
    // Tusaale fudud oo CSV ah:
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) { // Headers + at least one data row
      return NextResponse.json(
        { message: 'Faylka waa madhan yahay ama kaliya wuxuu leeyahay headers.' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1);
    const importedExpenses = [];
    const errors: { row: number; message: string }[] = [];

    // Map headers to expected fields (tusaale)
    const headerMap = {
      'description': 'description',
      'amount': 'amount',
      'category': 'category',
      'subcategory': 'subCategory',
      'paidfrom': 'paidFrom',
      'expensedate': 'expenseDate',
      'note': 'note',
      'projectid': 'projectId',
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const values = row.split(',');
      const expenseData: any = {};
      let rowIsValid = true;
      let rowErrors: string[] = [];

      // Ku buuxi xogta object-ka
      for (let j = 0; j < headers.length; j++) {
        const headerKey = headers[j].toLowerCase();
        const fieldName = (headerMap as any)[headerKey];
        if (fieldName) {
          expenseData[fieldName] = values[j] ? values[j].trim() : '';
        }
      }

      // Xaqiijinta xogta saf kasta
      if (!expenseData.description) rowErrors.push('Sharaxaad waa waajib.');
      if (typeof parseFloat(expenseData.amount) !== 'number' || parseFloat(expenseData.amount) <= 0) rowErrors.push('Qiimaha waa waajib oo waa inuu noqdaa nambar wanaagsan.');
      if (!expenseData.category) rowErrors.push('Nooca waa waajib.');
      if (!expenseData.paidFrom) rowErrors.push('Laga Bixiyay waa waajib.');
      if (!expenseData.expenseDate || isNaN(new Date(expenseData.expenseDate).getTime())) rowErrors.push('Taariikhda kharashka waa waajib oo waa inuu noqdaa taariikh sax ah.');

      if (rowErrors.length > 0) {
        errors.push({ row: i + 2, message: rowErrors.join(' ') }); // +2 for header row and 0-indexed array
        rowIsValid = false;
      }

      if (rowIsValid) {
        try {
          // Hubi in project-ka uu jiro haddii la bixiyay
          let project = null;
          if (expenseData.projectId) {
            project = await prisma.project.findUnique({
              where: { id: expenseData.projectId },
              // and: { companyId: companyId } // Mustaqbalka, ku dar filter-kan
            });
            if (!project) {
              errors.push({ row: i + 2, message: `Mashruuca ID "${expenseData.projectId}" lama helin.` });
              continue; // Ka bood safkan
            }
          }

          const newExpense = await prisma.expense.create({
            data: {
              description: expenseData.description,
              amount: parseFloat(expenseData.amount),
              category: expenseData.category,
              subCategory: expenseData.subCategory || null,
              paidFrom: expenseData.paidFrom,
              expenseDate: new Date(expenseData.expenseDate),
              note: expenseData.note || null,
              approved: false, // Default to pending approval for bulk imports
              projectId: project ? project.id : null,
              companyId: "dummyCompanyId", // Mustaqbalka, ka hel session-ka
              userId: "dummyUserId", // Mustaqbalka, ka hel session-ka
            },
          });
          importedExpenses.push(newExpense);
        } catch (dbError: any) {
          errors.push({ row: i + 2, message: `Cilad database: ${dbError.message}` });
        }
      }
    }

    if (importedExpenses.length > 0 && errors.length === 0) {
      return NextResponse.json(
        { message: `Si guul leh ayaa loo dhoofiyay ${importedExpenses.length} kharash!`, importedCount: importedExpenses.length },
        { status: 200 }
      );
    } else if (importedExpenses.length > 0 && errors.length > 0) {
      return NextResponse.json(
        { message: `Waxaa la dhoofiyay ${importedExpenses.length} kharash, laakin waxaa jiray ${errors.length} qalad.`, importedCount: importedExpenses.length, errors },
        { status: 206 } // Partial Content
      );
    } else {
      return NextResponse.json(
        { message: `Dhoofintu way fashilantay. ${errors.length} qalad ayaa la helay.`, errors },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Cilad ayaa dhacday marka kharashyada badan la dhoofinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
