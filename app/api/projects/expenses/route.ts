// app/api/expenses/route.ts - Expense Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation if needed
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyUser } from '@/lib/auth';
import { sendReceiptViaWhatsApp } from '@/lib/whatsapp/send-receipt';

// GET /api/expenses - Soo deji dhammaan kharashyada
export async function GET(request: Request) {
  try {
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const subCategory = searchParams.get('subCategory');
    const category = searchParams.get('category');
    const projectId = searchParams.get('projectId');

    // Build where clause
    const where: any = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (subCategory) where.subCategory = subCategory;
    if (category) where.category = category;
    // projectId=null means only company expenses (not linked to a project)
    if (projectId === 'null') {
      where.projectId = null;
    } else if (projectId) {
      where.projectId = projectId;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      select: {
        id: true,
        expenseDate: true,
        employeeId: true,
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
          }
        },
        category: true,
        subCategory: true,
        description: true,
        amount: true,
        paidFrom: true,
        note: true,
        approved: true,
        employee: {
          select: {
            id: true,
            fullName: true,
          }
        },
        expenseCategory: true,
        createdAt: true,
        updatedAt: true,
        materials: true,
        materialDate: true,
        paymentStatus: true,
        invoiceNumber: true,
        paymentDate: true,
        company: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    // Fetch account information for all unique account IDs
    const accountIds = [...new Set(expenses.map((exp: any) => exp.paidFrom).filter(Boolean))];
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });

    // Create a map for quick lookup
    const accountMap = new Map(accounts.map((acc: any) => [acc.id, acc.name]));

    // Map to frontend format: always return amount as number, project name, etc.
    const mappedExpenses = expenses.map((exp: any) => ({
      id: exp.id,
      date: exp.expenseDate,
      project: exp.project ? { id: exp.project.id, name: exp.project.name } : undefined,
      company: exp.company ? { id: exp.company.id, name: exp.company.name } : undefined,
      vendor: exp.vendor ? { id: exp.vendor.id, name: exp.vendor.name } : undefined,
      customer: exp.customer ? { id: exp.customer.id, name: exp.customer.name } : undefined,
      category: exp.category,
      subCategory: exp.subCategory || undefined,
      description: exp.description || '', // Always use actual DB value, never auto-generate
      amount: typeof exp.amount === 'object' && 'toNumber' in exp.amount ? exp.amount.toNumber() : Number(exp.amount),
      paidFrom: exp.paidFrom,
      accountName: accountMap.get(exp.paidFrom) || exp.paidFrom, // Show account name or fallback to ID
      note: exp.note,
      approved: exp.approved,
      employee: exp.employee ? { id: exp.employee.id, name: exp.employee.fullName } : undefined,
      employeeId: exp.employeeId || undefined,
      expenseCategory: exp.expenseCategory ? exp.expenseCategory.name : undefined,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
      materials: exp.materials || [],
      materialDate: exp.materialDate || undefined,
      paymentStatus: exp.paymentStatus,
      paidAmount: exp.paymentStatus === 'PAID' ? exp.amount : 0,
      invoiceNumber: exp.invoiceNumber,
      paymentDate: exp.paymentDate,
    }));
    return NextResponse.json({ expenses: mappedExpenses }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka kharashyada la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Ku dar kharash cusub
export async function POST(request: Request) {
  try {

    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;
    const userId = session?.userId;
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if request contains FormData (file upload) or JSON
    const contentType = request.headers.get('content-type') || '';
    let data: any;
    let receiptFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with file upload
      const formData = await request.formData();

      // Extract receipt file if present
      const file = formData.get('receiptImage');
      if (file && file instanceof File) {
        receiptFile = file;
      }

      // Extract all other fields from FormData
      data = {};
      for (const [key, value] of formData.entries()) {
        if (key !== 'receiptImage') {
          // Parse JSON strings and arrays
          if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              data[key] = value;
            }
          } else {
            data[key] = value;
          }
        }
      }
    } else {
      // Handle regular JSON request
      data = await request.json();
    }

    const {
      description,
      amount,
      category,
      subCategory,
      paidFrom,
      expenseDate,
      note,
      projectId,
      customerId, // NEW: for Debt/Debt Repayment
      employeeId, // For Salary payments
      materials, // <-- NEW: for Material expenses
      receiptUrl: providedReceiptUrl, // NEW: for receipt image URL (if already uploaded elsewhere)
      vendorId, // NEW: Vendor payment tracking fields
      paymentStatus,
      invoiceNumber,
      paymentDate,
      materialDate, // NEW: for Material date tracking
      paidAmount, // NEW: for Partial payments
    } = data;

    // Save receipt image if provided
    let receiptUrl = providedReceiptUrl;
    if (receiptFile) {
      try {
        const { saveReceiptImage } = await import('@/lib/upload');
        receiptUrl = await saveReceiptImage(receiptFile);
      } catch (uploadError: any) {
        console.error('Receipt upload error:', uploadError);
        return NextResponse.json(
          { message: `Khalad sawirka rasiidka: ${uploadError.message}` },
          { status: 400 }
        );
      }
    }

    // Defensive: fallback for missing/invalid category
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { message: 'Nooca kharashka waa waajib (category).' },
        { status: 400 }
      );
    }

    // Always trim description if present
    let finalDescription = typeof description === 'string' ? description.trim() : '';
    // Only require description for Labor and Company Expense: Salary
    let mustHaveDescription = false;
    if (category === 'Labor' || (category === 'Company Expense' && subCategory === 'Salary')) {
      mustHaveDescription = true;
    }
    if (!finalDescription && mustHaveDescription) {
      return NextResponse.json(
        { message: 'Sharaxaad (description) waa waajib.' },
        { status: 400 }
      );
    }
    // For Material expenses, always require materials array
    if (category === 'Material' && (!Array.isArray(materials) || materials.length === 0)) {
      return NextResponse.json(
        { message: 'Materials waa waajib (ugu yaraan hal alaab).' },
        { status: 400 }
      );
    }

    // NEW: Vendor payment validation for Material expenses
    /* if (category === 'Material') {
      if (!vendorId) {
        return NextResponse.json(
          { message: 'Iibiyaha waa waajib kharashyada alaabta.' },
          { status: 400 }
        );
      } */
    if (category === 'Material') { // Reduced check
      if (!paymentStatus || !['PAID', 'UNPAID', 'PARTIAL'].includes(paymentStatus)) {
        return NextResponse.json(
          { message: 'Xaaladda lacag bixinta waa waajib.' },
          { status: 400 }
        );
      }
      if (paymentStatus === 'PAID' && !paidFrom) {
        return NextResponse.json(
          { message: 'Akoonka lacagta laga jarayo waa waajib marka lacagta la bixiyay.' },
          { status: 400 }
        );
      }
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json(
        { message: 'Qiimaha (amount) waa waajib.' },
        { status: 400 }
      );
    }
    // paidFrom is only required when a payment is actually made
    if (!paidFrom) {
      const requiresPaidFrom = !(
        category === 'Material' && paymentStatus === 'UNPAID'
      );
      if (requiresPaidFrom) {
        return NextResponse.json(
          { message: 'Akoonka laga bixiyay (paidFrom) waa waajib marka lacag dhab ahaantii la bixiyay.' },
          { status: 400 }
        );
      }
    }
    if (!expenseDate) {
      return NextResponse.json(
        { message: 'Taariikhda kharashka (expenseDate) waa waajib.' },
        { status: 400 }
      );
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { message: 'Qiimaha waa inuu noqdaa nambar wanaagsan.' },
        { status: 400 }
      );
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId, companyId },
      });
      if (!project) {
        return NextResponse.json({ message: 'Mashruuca la doortay lama helin.' }, { status: 400 });
      }
    }




    // Always set subCategory to 'Salary' for company salary expenses if missing
    let finalSubCategory = subCategory;
    if (category === 'Company Expense' && employeeId && (!subCategory || subCategory === null)) {
      finalSubCategory = 'Salary';
    }
    const newExpense = await prisma.expense.create({
      data: {
        description: finalDescription,
        amount: amount.toString(),
        category,
        subCategory: finalSubCategory || null,
        paidFrom,
        expenseDate: new Date(expenseDate),
        note: note || null,
        approved: false,
        projectId: projectId || null,
        companyId,
        userId,
        // Always set employeeId for salary payments, and for any expense with employeeId
        employeeId: (category === 'Company Expense' && finalSubCategory === 'Salary' && employeeId) ? employeeId : (employeeId ? employeeId : undefined),
        // Store materials array if present and category is Material (project or company)
        ...(((category === 'Material' || (category === 'Company Expense' && finalSubCategory === 'Material')) && Array.isArray(materials)) ? { materials } : {}),
        // NEW: Store customerId for company debts
        ...(customerId ? { customerId } : {}),
        // NEW: Store receipt URL if provided
        ...(receiptUrl ? { receiptUrl } : {}),
        // NEW: Store vendor payment tracking fields
        ...(vendorId ? { vendorId } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(invoiceNumber ? { invoiceNumber } : {}),
        ...(paymentDate ? { paymentDate: new Date(paymentDate) } : {}),
        // NEW: Store material date if provided
        ...(materialDate ? { materialDate: new Date(materialDate) } : {}),
      },
    });
    // 2b. If this is a Salary payment, increment salaryPaidThisMonth for the employee
    if (category === 'Company Expense' && subCategory === 'Salary' && employeeId && amount) {
      await prisma.employee.update({
        where: { id: employeeId, companyId },
        data: {
          salaryPaidThisMonth: { increment: Number(amount) },
          lastPaymentDate: new Date(expenseDate),
        },
      });
    }

    // NOTE: Account balance updates are handled below using transactionType logic; avoid double-decrement here.

    // 2. Create corresponding transactions
    const totalAmountNum = Number(amount);
    const paidAmountNum = Number(paidAmount || 0);
    const isPartial = paymentStatus === 'PARTIAL';
    const isUnpaid = paymentStatus === 'UNPAID';

    // We'll collect transactions to create
    const transactionsToCreate = [];

    if (category === 'Debt' || (category === 'Company Expense' && subCategory === 'Debt')) {
      if (paymentStatus === 'REPAID') {
        transactionsToCreate.push({
          description: finalDescription,
          amount: Math.abs(totalAmountNum),
          type: 'DEBT_REPAID' as const,
          transactionDate: new Date(expenseDate),
          note: note || null,
          accountId: paidFrom || null,
          projectId: projectId || null,
          expenseId: newExpense.id,
          userId,
          companyId,
          customerId: customerId || undefined,
        });
      } else {
        transactionsToCreate.push({
          description: finalDescription,
          amount: Math.abs(totalAmountNum),
          type: 'DEBT_TAKEN' as const,
          transactionDate: new Date(expenseDate),
          note: note || null,
          accountId: paidFrom || null,
          projectId: projectId || null,
          expenseId: newExpense.id,
          userId,
          companyId,
          customerId: customerId || undefined,
        });
      }
    } else if (category === 'Material' || (category === 'Company Expense' && (subCategory === 'Material' || vendorId))) {
      // Logic for Vendor-related expenses (Material or other Company Expenses with vendorId)
      if (isPartial) {
        // 1. Record the full liability (No accountId)
        transactionsToCreate.push({
          description: `${finalDescription} (Total Debt)`,
          amount: totalAmountNum, // Will be treated as StandardOut in report
          type: 'DEBT_TAKEN' as const,
          transactionDate: new Date(expenseDate),
          note: note || null,
          accountId: null, // Virtual record
          projectId: projectId || null,
          expenseId: newExpense.id,
          userId,
          companyId,
          vendorId: vendorId || undefined,
        });
        // 2. Record the actual payment (With accountId)
        if (paidAmountNum > 0) {
          transactionsToCreate.push({
            description: finalDescription,
            amount: paidAmountNum,
            type: 'DEBT_REPAID' as const,
            transactionDate: new Date(expenseDate),
            note: note || null,
            accountId: paidFrom || null,
            projectId: projectId || null,
            expenseId: newExpense.id,
            userId,
            companyId,
            vendorId: vendorId || undefined,
          });
        }
      } else if (isUnpaid) {
        // Record as full debt
        transactionsToCreate.push({
          description: finalDescription,
          amount: totalAmountNum,
          type: 'DEBT_TAKEN' as const,
          transactionDate: new Date(expenseDate),
          note: note || null,
          accountId: null,
          projectId: projectId || null,
          expenseId: newExpense.id,
          userId,
          companyId,
          vendorId: vendorId || undefined,
        });
      } else {
        // Fully PAID
        transactionsToCreate.push({
          description: finalDescription,
          amount: -Math.abs(totalAmountNum),
          type: 'EXPENSE' as const,
          transactionDate: new Date(expenseDate),
          note: note || null,
          accountId: paidFrom || null,
          projectId: projectId || null,
          expenseId: newExpense.id,
          userId,
          companyId,
          vendorId: vendorId || undefined,
        });
      }
    } else {
      // Default basic expense
      transactionsToCreate.push({
        description: finalDescription,
        amount: -Math.abs(totalAmountNum),
        type: 'EXPENSE' as const,
        transactionDate: new Date(expenseDate),
        note: note || null,
        accountId: paidFrom || null,
        projectId: projectId || null,
        expenseId: newExpense.id,
        userId,
        companyId,
        customerId: customerId || undefined,
      });
    }

    // Bulk create transactions and update account balances
    for (const trxData of transactionsToCreate) {
      // Standardize signs for account movements:
      // Positive = Inflow, Negative = Outflow
      const type = trxData.type;
      const amountValue = Math.abs(trxData.amount);

      const isInflow = [
        'INCOME',
        'DEBT_RECEIVED',
        'TRANSFER_IN',
        'SHAREHOLDER_DEPOSIT'
      ].includes(type);

      const finalAmount = isInflow ? amountValue : -amountValue;

      await prisma.transaction.create({
        data: {
          ...trxData,
          amount: finalAmount
        },
      });

      // Update account balance using the signed amount
      if (trxData.accountId && finalAmount !== 0) {
        await prisma.account.update({
          where: { id: trxData.accountId },
          data: {
            balance: { increment: finalAmount },
          },
        });
      }
    }

    // 4. Update project balance if this is a debt repayment for a project
    if (projectId && (category === 'Debt' || (category === 'Company Expense' && subCategory === 'Debt')) && paymentStatus === 'REPAID') {
      await prisma.project.update({
        where: { id: projectId, companyId },
        data: {
          advancePaid: { increment: totalAmountNum },
          remainingAmount: { decrement: totalAmountNum }
        }
      });

      // Check if project is fully paid
      const updatedProject = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (updatedProject && Number(updatedProject.remainingAmount) <= 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: 'Completed' }
        });
      }
    }
    // 5. Send automated WhatsApp receipt to vendor if applicable
    if (vendorId && (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL')) {
      try {
        const vendor = await prisma.shopVendor.findUnique({ where: { id: vendorId } });
        const company = await prisma.company.findUnique({ where: { id: companyId } });

        if (vendor?.phoneNumber && company) {
          // Add basic vendor context for the PDF generator
          const expenseWithVendor = { ...newExpense, vendor };
          console.log(`[Expenses API] Triggering WhatsApp receipt for expense ${newExpense.id} to vendor ${vendor.name}`);
          // Send asynchronously without awaiting to not block the API response
          sendReceiptViaWhatsApp(company.id, company.name, vendor.phoneNumber, expenseWithVendor);
        }
      } catch (waErr) {
        console.error('[Expenses API] Failed to trigger WhatsApp receipt', waErr);
      }
    }

    return NextResponse.json(
      { message: 'Kharashka si guul leh ayaa loo daray!', expense: newExpense },
      { status: 201 }
    );
  } catch (error) {
    console.error('Expense API error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}