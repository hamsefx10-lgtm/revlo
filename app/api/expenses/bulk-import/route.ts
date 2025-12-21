// app/api/expenses/bulk-import/route.ts - Bulk Import Expenses API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '../auth';

export async function POST(request: Request) {
  try {
    const { companyId, userId } = await getSessionCompanyUser();
    const { expenseType, subCategory, projectId, expenses } = await request.json();

    if (!expenseType || !subCategory || !Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah' },
        { status: 400 }
      );
    }

    if (expenseType === 'project' && !projectId) {
      return NextResponse.json(
        { message: 'Project ID waa waajib marka project expense ah' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as any[]
    };

    // Process each expense
    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];

      try {
        // Validate based on subcategory - Dynamic validation for all categories
        let validationError = null;

        if (subCategory === 'Material') {
          if (!expense.Name || !expense.Quantity || !expense.Price || !expense.Unit) {
            validationError = 'Name, Quantity, Price, iyo Unit waa waajib';
          }
        } else if (subCategory === 'Labor' || subCategory === 'Company Labor') {
          if (!expense.EmployeeName || !expense.Wage || !expense.WorkDescription) {
            validationError = 'EmployeeName, Wage, iyo WorkDescription waa waajib';
          }
        } else if (subCategory === 'Debt') {
          if (!expense.Description || !expense.Amount || !expense.LenderName || !expense.LoanDate) {
            validationError = 'Description, Amount, LenderName, iyo LoanDate waa waajib';
          }
        } else if (subCategory === 'Transport' || subCategory === 'Rental' || subCategory === 'Consultancy' || subCategory === 'Fuel' || subCategory === 'Other') {
          // All other categories require Description, Amount, and ExpenseDate
          if (!expense.Description || !expense.Amount) {
            validationError = 'Description iyo Amount waa waajib';
          }
          if (!expense.ExpenseDate) {
            validationError = 'ExpenseDate waa waajib';
          }
        } else {
          // Default validation for unknown categories
          if (!expense.Description || !expense.Amount) {
            validationError = 'Description iyo Amount waa waajib';
          }
        }

        if (validationError) {
          results.errors.push({
            row: i + 2,
            message: validationError
          });
          results.skipped++;
          continue;
        }

        // Determine category and subCategory based on expense type
        let category: string;
        let finalSubCategory: string | null = null;

        if (expenseType === 'company') {
          // For company expenses, category is 'Company Expense' and subCategory is the specific type
          category = 'Company Expense';
          finalSubCategory = subCategory;
        } else {
          // For project expenses, category is the subcategory directly
          category = subCategory;
          finalSubCategory = null;
        }

        // Resolve Account ID from PaidFrom name
        let resolvedAccountId: string | null = null;
        if (expense.PaidFrom) {
          const account = await prisma.account.findFirst({
            where: {
              companyId,
              name: { equals: expense.PaidFrom, mode: 'insensitive' }
            }
          });
          if (account) {
            resolvedAccountId = account.id;
          }
        }

        // Prepare expense data
        let expenseData: any = {
          companyId,
          userId: userId || null,
          category,
          subCategory: finalSubCategory,
          paidFrom: expense.PaidFrom || 'Cash', // Keep the string name for display
          accountId: resolvedAccountId, // Store relationship if found
          expenseDate: expense.ExpenseDate ? new Date(expense.ExpenseDate) : new Date(), // Use provided date or current date
          note: expense.Note || null,
          approved: false,
        };

        // Handle Material expenses
        if (subCategory === 'Material') {
          const materials = [{
            name: expense.Name,
            qty: expense.Quantity,
            price: expense.Price,
            unit: expense.Unit
          }];

          const totalAmount = parseFloat(expense.Quantity) * parseFloat(expense.Price);

          expenseData.description = expense.Description || expense.Name;
          expenseData.amount = totalAmount.toString();
          expenseData.materials = materials;
          expenseData.materialDate = expense.MaterialDate ? new Date(expense.MaterialDate) : new Date(expense.ExpenseDate);

          if (expenseType === 'project') {
            expenseData.projectId = projectId;
          }
        }
        // Handle Labor expenses
        else if (subCategory === 'Labor' || subCategory === 'Company Labor') {
          // Find employee by name
          const employee = await prisma.employee.findFirst({
            where: {
              companyId,
              fullName: {
                contains: expense.EmployeeName,
                mode: 'insensitive'
              }
            }
          });

          if (!employee) {
            results.errors.push({
              row: i + 2,
              message: `Shaqaale lama helin: ${expense.EmployeeName}`
            });
            results.skipped++;
            continue;
          }

          expenseData.description = expense.WorkDescription;
          expenseData.amount = parseFloat(expense.Wage).toString();
          expenseData.employeeId = employee.id;

          if (expenseType === 'project') {
            expenseData.projectId = projectId;
          }
        }
        // Handle other expenses (Transport, Rental, Consultancy, Fuel, Other, Debt)
        else {
          expenseData.description = expense.Description;
          expenseData.amount = parseFloat(expense.Amount).toString();
          
          // Use ExpenseDate if provided, otherwise use current date
          if (expense.ExpenseDate) {
            expenseData.expenseDate = new Date(expense.ExpenseDate);
          }

          if (subCategory === 'Transport') {
            expenseData.transportType = expense.TransportType || null;
          } else if (subCategory === 'Rental') {
            expenseData.equipmentName = expense.EquipmentName || null;
            expenseData.rentalPeriod = expense.RentalPeriod || null;
            expenseData.rentalFee = expense.RentalFee ? parseFloat(expense.RentalFee) : null;
            expenseData.supplierName = expense.SupplierName || null;
          } else if (subCategory === 'Consultancy') {
            expenseData.consultantName = expense.ConsultantName || null;
            expenseData.consultancyType = expense.ConsultancyType || null;
            expenseData.consultancyFee = expense.ConsultancyFee ? parseFloat(expense.ConsultancyFee) : null;
          } else if (subCategory === 'Debt') {
            const customerName = expense.LenderName;
            let customer = await prisma.customer.findFirst({
              where: {
                companyId,
                name: {
                  contains: customerName,
                  mode: 'insensitive',
                },
              },
            });

            // If customer not found, create new one
            if (!customer) {
              customer = await prisma.customer.create({
                data: {
                  companyId,
                  name: customerName,
                  phone: '0000000000', // Default placeholder
                  email: null,
                  address: null,
                }
              });
            }
            expenseData.customerId = customer.id;
            // Map LoanDate to expenseDate as it conceptually represents when the debt was taken
            expenseData.expenseDate = new Date(expense.LoanDate);
            // We don't have lenderName on Expense model, relying on customerId relation
            expenseData.note = expense.Note || null;
          }

          if (expenseType === 'project') {
            expenseData.projectId = projectId;
          }
        }

        // Create expense
        const newExpense = await prisma.expense.create({
          data: expenseData
        });

        // Create Transaction and Update Account Balance for ALL expense types
        // This ensures account balance is automatically updated when expenses are imported
        if (resolvedAccountId) {
          const transactionAmount = parseFloat(expenseData.amount);
          let transactionType: 'EXPENSE' | 'DEBT_TAKEN' = 'EXPENSE';
          let transactionDescription = expenseData.description || 'Bulk imported expense';

          // Determine transaction type based on category
          if (subCategory === 'Debt' && expenseData.customerId) {
            transactionType = 'DEBT_TAKEN';
            transactionDescription = expenseData.description || `Debt for ${expense.LenderName || 'Customer'}`;
          }

          // 1. Create Transaction
          await prisma.transaction.create({
            data: {
              description: transactionDescription,
              amount: Math.abs(transactionAmount),
              type: transactionType,
              transactionDate: expenseData.expenseDate,
              note: expenseData.note,
              accountId: resolvedAccountId,
              expenseId: newExpense.id,
              userId: userId || null,
              companyId,
              customerId: expenseData.customerId || null,
              projectId: expenseData.projectId || null,
              employeeId: expenseData.employeeId || null,
            }
          });

          // 2. Update Account Balance (Money OUT for expenses)
          await prisma.account.update({
            where: { id: resolvedAccountId },
            data: { balance: { decrement: transactionAmount } }
          });
        }

        results.created++;
      } catch (error: any) {
        console.error(`Error creating expense at row ${i + 2}:`, error);
        results.errors.push({
          row: i + 2,
          message: error.message || 'Cilad ayaa dhacday'
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: `Guul! ${results.created} kharash ayaa la soo geliyay`,
      ...results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
