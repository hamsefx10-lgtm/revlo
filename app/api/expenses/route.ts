// app/api/expenses/route.ts - Expense Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation if needed
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyUser } from './auth';

// GET /api/expenses - Soo deji dhammaan kharashyada
export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
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
        /* vendor: {
          select: {
            id: true,
            name: true,
          }
        }, */
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
      // vendor: exp.vendor ? { id: exp.vendor.id, name: exp.vendor.name } : undefined,
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

    const { companyId, userId } = await getSessionCompanyUser();

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

    // 2. Create a corresponding transaction
    let transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'DEBT_TAKEN' | 'DEBT_REPAID' | 'OTHER' = 'EXPENSE';
    let transactionAmount = Number(amount);
    let transactionCustomerId = undefined;
    let transactionVendorId = vendorId || undefined;
    // FIX: Initialize with paidFrom as fallback - ensures account balance is always updated when paidFrom exists
    let transactionAccountId = paidFrom || undefined;
    if (category === 'Debt' || (category === 'Company Expense' && subCategory === 'Debt')) {
      if (paymentStatus === 'REPAID') {
        transactionType = 'DEBT_REPAID';
        transactionCustomerId = customerId || null;
        // When repaying debt, if paidFrom is selected, money goes into account (income)
        transactionAccountId = paidFrom || undefined;
      } else {
        transactionType = 'DEBT_TAKEN';
        transactionCustomerId = customerId || null;
        // When taking debt, if paidFrom is selected, deduct from that account
        transactionAccountId = paidFrom || undefined;
      }

      // Safety check: ensure customerId is set for Debt transactions if passed in payload
      if (customerId && !transactionCustomerId) {
        transactionCustomerId = customerId;
      }
      console.log('Creating debt transaction:', {
        category,
        subCategory,
        customerId,
        amount,
        description,
        transactionType,
        transactionAccountId
      });
    } else if (category === 'Material') {
      if (paymentStatus === 'PAID') {
        // If paid, create expense transaction and deduct from account
        transactionType = 'EXPENSE';
        transactionAccountId = paidFrom;
      } else if (paymentStatus === 'PARTIAL') {
        // If partial, create DEBT_REPAID transaction for the paid amount only
        // This represents the initial payment towards the vendor debt
        transactionType = 'DEBT_REPAID';
        transactionAccountId = paidFrom;
        // Use paidAmount for transaction instead of total amount
        if (paidAmount) {
          transactionAmount = Number(paidAmount);
        }
        transactionVendorId = vendorId;
        // When repaying vendor debt, if paidFrom is selected, deduct from that account
        transactionAccountId = paidFrom || undefined;
      } else {
        // If unpaid, create debt transaction (vendor debt)
        transactionType = 'DEBT_TAKEN';
        transactionVendorId = vendorId; // Track vendor on transaction
        // If paidFrom is provided even for unpaid, deduct from account (user is paying now)
        transactionAccountId = paidFrom || undefined;
      }
    } else if (category === 'Company Expense') {
      // Check if this is money given to a customer (should be tracked as debt)
      if (customerId && paidFrom && subCategory !== 'Debt') {
        // Money given to customer from account = DEBT_TAKEN
        transactionType = 'DEBT_TAKEN';
        transactionCustomerId = customerId;
        transactionAccountId = paidFrom;
      } else if (vendorId) {
        // NEW: Handle Vendor Expenses (Company Expenses related to a vendor)
        // This mirrors the logic for Material expenses to support Partial/Unpaid statuses for vendors
        if (paymentStatus === 'PAID') {
          // Full payment made
          transactionType = 'EXPENSE';
          transactionAccountId = paidFrom;
          transactionVendorId = vendorId;
        } else if (paymentStatus === 'PARTIAL') {
          // Partial payment made - create DEBT_REPAID for the paid amount
          transactionType = 'DEBT_REPAID';
          transactionAccountId = paidFrom;
          if (paidAmount) {
            transactionAmount = Number(paidAmount);
          }
          transactionVendorId = vendorId;
        } else {
          // Unpaid bill - create DEBT_TAKEN (Vendor Debt)
          transactionType = 'DEBT_TAKEN';
          transactionVendorId = vendorId;
          // If paidFrom is strictly null/undefined for Unpaid, account balance won't change, which is correct
          transactionAccountId = paidFrom || undefined;
        }
      } else {
        // For ALL other company expenses without specific vendor/customer tracking
        transactionType = 'EXPENSE';
        transactionAccountId = paidFrom;
      }
    }
    // FIX: If customerId is provided with paidFrom (money given to customer), create DEBT_TAKEN transaction
    // This handles cases where expense has customerId but category is not explicitly "Debt"
    if (customerId && paidFrom && !transactionCustomerId && transactionType === 'EXPENSE') {
      // Check if this expense represents money given to customer
      // If customerId exists and paidFrom exists, it means money was given to customer
      transactionType = 'DEBT_TAKEN';
      transactionCustomerId = customerId;
      transactionAccountId = paidFrom;
      console.log('Auto-detected customer debt transaction:', {
        customerId,
        amount,
        description,
        category,
        subCategory
      });
    }
    // For EXPENSE, always store as negative (money out)
    if (transactionType === 'EXPENSE') {
      transactionAmount = -Math.abs(transactionAmount);
    }
    // For DEBT_TAKEN, store as positive (money given to customer)
    if (transactionType === 'DEBT_TAKEN') {
      transactionAmount = Math.abs(transactionAmount);
    }
    // For DEBT_REPAID, store as positive (money received from customer - income)
    if (transactionType === 'DEBT_REPAID') {
      transactionAmount = Math.abs(transactionAmount);
    }
    await prisma.transaction.create({
      data: {
        description: finalDescription,
        amount: transactionAmount,
        type: transactionType,
        transactionDate: new Date(expenseDate),
        note: note || null,
        accountId: transactionAccountId || paidFrom || null,
        projectId: projectId || null,
        expenseId: newExpense.id,
        userId,
        companyId,
        customerId: transactionCustomerId,
        vendorId: transactionVendorId,
      },
    });

    // 3. Update account balance based on transaction type
    // FIX: Use transactionAccountId or paidFrom as fallback to ensure account balance is updated
    const accountIdToUpdate = transactionAccountId || paidFrom;

    // Use the calculated transactionAmount (which handles partial payments correctly) 
    // instead of the raw total 'amount'.
    // We use Math.abs() because 'decrement' expects a positive number to subtract,
    // and 'increment' expects a positive number to add.
    const amountToAdjust = Math.abs(transactionAmount);

    if (accountIdToUpdate && amountToAdjust > 0) {
      if (transactionType === 'DEBT_REPAID') {
        // DEBT_REPAID with customerId = customer repays us (money comes IN)
        // DEBT_REPAID with vendorId = we repay vendor (money goes OUT)
        if (transactionCustomerId) {
          // Customer repaying us - add money to account (income)
          await prisma.account.update({
            where: { id: accountIdToUpdate },
            data: {
              balance: { increment: amountToAdjust },
            },
          });
        } else if (transactionVendorId) {
          // We repaying vendor - subtract money from account (expense)
          await prisma.account.update({
            where: { id: accountIdToUpdate },
            data: {
              balance: { decrement: amountToAdjust },
            },
          });
        }
      } else if (transactionType === 'DEBT_TAKEN') {
        // DEBT_TAKEN with customerId = We give money to customer (Money OUT)
        if (transactionCustomerId) {
          await prisma.account.update({
            where: { id: accountIdToUpdate },
            data: {
              balance: { decrement: amountToAdjust },
            },
          });
        }
        // DEBT_TAKEN with vendorId (We owe vendor) = No cash movement usually, 
        // BUT if paidFrom is set, it might technically be a payment? 
        // No, standard UNPAID expense doesn't hit account. 
        // Logic check: if paidFrom is set on UNPAID, we already prevent it in validation or allow it as "paying now". 
        // If transactionAccountId is set, we respect it.
        else if (transactionAccountId) {
          await prisma.account.update({
            where: { id: accountIdToUpdate },
            data: {
              balance: { decrement: amountToAdjust },
            },
          });
        }
      } else {
        // For EXPENSE (Standard payment), subtract money from account
        await prisma.account.update({
          where: { id: accountIdToUpdate },
          data: {
            balance: { decrement: amountToAdjust },
          },
        });
      }
    }

    // 4. Update project balance if this is a debt repayment for a project
    if (transactionType === 'DEBT_REPAID' && projectId) {
      await prisma.project.update({
        where: { id: projectId, companyId },
        data: {
          advancePaid: { increment: Number(amount) },
          remainingAmount: { decrement: Number(amount) }
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

    // Trigger real-time update for customer pages if this is a debt transaction
    if (transactionType === 'DEBT_TAKEN' && transactionCustomerId) {
      console.log(`DEBT_TAKEN transaction created for customer ${transactionCustomerId}, amount: ${transactionAmount}`);
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