const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function importExcelData() {
  try {
    console.log('🚀 Starting Excel data import...');
    
    // Excel file path - waxaad ku beddeli kartaa path-kaaga
    const excelFilePath = path.join(__dirname, '../data/revlo-data.xlsx');
    
    // Read Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetNames = workbook.SheetNames;
    
    console.log('📊 Found sheets:', sheetNames);
    
    // Import Companies
    if (workbook.Sheets['Companies']) {
      await importCompanies(workbook.Sheets['Companies']);
    }
    
    // Import Users
    if (workbook.Sheets['Users']) {
      await importUsers(workbook.Sheets['Users']);
    }
    
    // Import Projects
    if (workbook.Sheets['Projects']) {
      await importProjects(workbook.Sheets['Projects']);
    }
    
    // Import Expenses
    if (workbook.Sheets['Expenses']) {
      await importExpenses(workbook.Sheets['Expenses']);
    }
    
    console.log('✅ Excel data import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error importing Excel data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importCompanies(sheet) {
  try {
    const companies = XLSX.utils.sheet_to_json(sheet);
    console.log(`📈 Importing ${companies.length} companies...`);
    
    for (const company of companies) {
      await prisma.company.upsert({
        where: { name: company.name },
        update: {
          industry: company.industry || null,
          email: company.email || null,
          phone: company.phone || null,
          address: company.address || null,
          website: company.website || null,
          taxId: company.taxId || null,
        },
        create: {
          name: company.name,
          industry: company.industry || null,
          email: company.email || null,
          phone: company.phone || null,
          address: company.address || null,
          website: company.website || null,
          taxId: company.taxId || null,
        },
      });
    }
    
    console.log('✅ Companies imported successfully!');
  } catch (error) {
    console.error('❌ Error importing companies:', error);
  }
}

async function importUsers(sheet) {
  try {
    const users = XLSX.utils.sheet_to_json(sheet);
    console.log(`👥 Importing ${users.length} users...`);
    
    for (const user of users) {
      // Hash password if provided, otherwise use default
      const hashedPassword = user.password ? 
        require('bcryptjs').hashSync(user.password, 10) : 
        require('bcryptjs').hashSync('default123', 10);
      
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          fullName: user.fullName,
          phone: user.phone || '',
          role: user.role || 'MEMBER',
          status: user.status || 'Active',
        },
        create: {
          fullName: user.fullName,
          email: user.email,
          password: hashedPassword,
          phone: user.phone || '',
          role: user.role || 'MEMBER',
          status: user.status || 'Active',
          companyId: user.companyId, // Make sure this exists in Companies sheet
        },
      });
    }
    
    console.log('✅ Users imported successfully!');
  } catch (error) {
    console.error('❌ Error importing users:', error);
  }
}

async function importProjects(sheet) {
  try {
    const projects = XLSX.utils.sheet_to_json(sheet);
    console.log(`📋 Importing ${projects.length} projects...`);
    
    for (const project of projects) {
      await prisma.project.upsert({
        where: { 
          name_companyId: {
            name: project.name,
            companyId: project.companyId
          }
        },
        update: {
          description: project.description || null,
          startDate: project.startDate ? new Date(project.startDate) : null,
          endDate: project.endDate ? new Date(project.endDate) : null,
          status: project.status || 'ACTIVE',
          budget: project.budget ? parseFloat(project.budget) : null,
        },
        create: {
          name: project.name,
          description: project.description || null,
          startDate: project.startDate ? new Date(project.startDate) : null,
          endDate: project.endDate ? new Date(project.endDate) : null,
          status: project.status || 'ACTIVE',
          budget: project.budget ? parseFloat(project.budget) : null,
          companyId: project.companyId,
        },
      });
    }
    
    console.log('✅ Projects imported successfully!');
  } catch (error) {
    console.error('❌ Error importing projects:', error);
  }
}

async function importExpenses(sheet) {
  try {
    const expenses = XLSX.utils.sheet_to_json(sheet);
    console.log(`💰 Importing ${expenses.length} expenses...`);
    
    for (const expense of expenses) {
      await prisma.expense.upsert({
        where: { id: expense.id || `exp_${Date.now()}_${Math.random()}` },
        update: {
          amount: parseFloat(expense.amount),
          description: expense.description || null,
          date: expense.date ? new Date(expense.date) : new Date(),
          category: expense.category || 'OTHER',
          status: expense.status || 'PENDING',
        },
        create: {
          amount: parseFloat(expense.amount),
          description: expense.description || null,
          date: expense.date ? new Date(expense.date) : new Date(),
          category: expense.category || 'OTHER',
          status: expense.status || 'PENDING',
          userId: expense.userId,
          projectId: expense.projectId || null,
          companyId: expense.companyId,
        },
      });
    }
    
    console.log('✅ Expenses imported successfully!');
  } catch (error) {
    console.error('❌ Error importing expenses:', error);
  }
}

// Run the import
importExcelData();
