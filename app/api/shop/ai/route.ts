import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// Shop AI Data API — fetches real data for AI responses
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Dual auth: browser (session) OR internal Python server (headers)
    const internalKey = req.headers.get('x-internal-key');
    let companyId: string | null = null;
    let userId: string | null = null;

    if (internalKey === process.env.AI_INTERNAL_KEY) {
      // Python server call — trust headers
      companyId = req.headers.get('x-company-id');
      userId = req.headers.get('x-user-id');
    } else {
      // Browser call — use session
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = session.user.id;
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { companyId: true }
      });
      companyId = currentUser?.companyId || null;
    }

    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

    const { queryType, params } = await req.json();

    switch (queryType) {
      case 'summary': {
        const today = new Date(); today.setHours(0,0,0,0);
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);

        const [todaySales, weekSales, monthSales, products, lowStock, customers, employees, accounts] = await Promise.all([
          prisma.sale.aggregate({ where: { companyId, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
          prisma.sale.aggregate({ where: { companyId, createdAt: { gte: weekAgo } }, _sum: { total: true }, _count: true }),
          prisma.sale.aggregate({ where: { companyId, createdAt: { gte: monthAgo } }, _sum: { total: true }, _count: true }),
          prisma.product.count({ where: { companyId } }),
          prisma.product.count({ where: { companyId, stock: { lte: 5 } } }),
          prisma.shopClient.count({ where: { companyId } }),
          prisma.employee.count({ where: { companyId, isActive: true } }),
          prisma.account.findMany({ where: { companyId }, select: { name: true, balance: true, type: true } }),
        ]);

        return NextResponse.json({
          success: true, data: {
            todaySales: { total: todaySales._sum.total || 0, count: todaySales._count },
            weekSales: { total: weekSales._sum.total || 0, count: weekSales._count },
            monthSales: { total: monthSales._sum.total || 0, count: monthSales._count },
            products, lowStock, customers, employees, accounts,
          }
        });
      }

      case 'debtors_list': {
        const debtorsSales = await prisma.sale.findMany({
          where: { 
            companyId, 
            paymentStatus: { in: ['Partial', 'Unpaid'] } 
          },
          include: { customer: true, realCustomer: true }
        });

        const debtMap = new Map<string, { name: string; phone: string; debt: number; saleCount: number }>();
        
        debtorsSales.forEach(sale => {
          const cust = sale.customer || sale.realCustomer;
          const custId = sale.customerId || sale.realCustomerId;
          
          if (custId && cust) {
            const owed = sale.total - sale.paidAmount;
            if (owed > 0) {
              const prev = debtMap.get(custId) || { 
                name: cust.name, 
                phone: cust.phone || '', 
                debt: 0, 
                saleCount: 0 
              };
              debtMap.set(custId, {
                ...prev,
                debt: prev.debt + owed,
                saleCount: prev.saleCount + 1
              });
            }
          }
        });

        const debtorsList = Array.from(debtMap.values()).sort((a, b) => b.debt - a.debt);

        return NextResponse.json({ 
          success: true, 
          data: {
            totalDebtors: debtorsList.length,
            totalDebtAmount: debtorsList.reduce((s, d) => s + d.debt, 0),
            debtors: debtorsList 
          }
        });
      }

      case 'sales_today': case 'sales_yesterday': case 'sales_week': case 'sales_month': {
        const now = new Date();
        let start = new Date(); start.setHours(0,0,0,0);
        if (queryType === 'sales_yesterday') { start.setDate(start.getDate() - 1); now.setHours(0,0,0,0); }
        if (queryType === 'sales_week') start.setDate(start.getDate() - 7);
        if (queryType === 'sales_month') start.setDate(start.getDate() - 30);

        const sales = await prisma.sale.findMany({
          where: { companyId, createdAt: { gte: start, lte: now } },
          include: { items: true, customer: { select: { name: true } }, realCustomer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }, take: 20,
        });

        const agg = await prisma.sale.aggregate({
          where: { companyId, createdAt: { gte: start, lte: now } },
          _sum: { total: true, subtotal: true, tax: true, paidAmount: true },
          _count: true,
        });

        // profit calculation
        const saleItems = await prisma.saleItem.findMany({
          where: { sale: { companyId, createdAt: { gte: start, lte: now } } },
          select: { total: true, totalCost: true, quantity: true, productName: true },
        });

        const revenue = agg._sum.total || 0;
        const cost = saleItems.reduce((s, i) => s + (i.totalCost || 0), 0);
        const profit = revenue - cost;

        // Top products
        const productMap = new Map<string, { qty: number; revenue: number }>();
        saleItems.forEach(i => {
          const e = productMap.get(i.productName) || { qty: 0, revenue: 0 };
          e.qty += i.quantity; e.revenue += i.total;
          productMap.set(i.productName, e);
        });
        const topProducts = Array.from(productMap.entries())
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(([name, d]) => ({ name, ...d }));

        return NextResponse.json({
          success: true, data: {
            period: queryType.replace('sales_', ''),
            count: agg._count,
            revenue, cost, profit,
            tax: agg._sum.tax || 0,
            topProducts,
            recentSales: sales.slice(0, 5).map(s => ({
              invoice: s.invoiceNumber,
              total: s.total,
              customer: s.realCustomer?.name || s.customer?.name || 'Walk-in',
              date: s.createdAt,
              method: s.paymentMethod,
              status: s.paymentStatus,
            })),
          }
        });
      }

      case 'customer_search': {
        const name = (params?.name || '').toLowerCase();
        const customers = await prisma.shopClient.findMany({
          where: { companyId, name: { contains: name, mode: 'insensitive' } },
          include: {
            sales: { select: { total: true, paymentStatus: true, paidAmount: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 5 },
          },
          take: 5,
        });

        return NextResponse.json({
          success: true,
          data: customers.map(c => {
            const totalSales = c.sales.reduce((s, sale) => s + sale.total, 0);
            const totalPaid = c.sales.reduce((s, sale) => s + sale.paidAmount, 0);
            const debt = totalSales - totalPaid;
            return {
              name: c.name, phone: c.phone, status: c.status,
              totalSales, totalPaid, debt,
              lastSale: c.sales[0]?.createdAt || null,
              saleCount: c.sales.length,
            };
          })
        });
      }

      case 'low_stock': {
        const products = await prisma.product.findMany({
          where: { companyId, stock: { lte: 5 } },
          select: { name: true, stock: true, minStock: true, sellingPrice: true, category: true },
          orderBy: { stock: 'asc' }, take: 10,
        });
        return NextResponse.json({ success: true, data: products });
      }

      case 'inventory_overview': {
        const products = await prisma.product.findMany({
          where: { companyId },
          select: { name: true, stock: true, sellingPrice: true, costPrice: true, category: true, status: true },
          orderBy: { stock: 'asc' },
        });
        const totalValue = products.reduce((s, p) => s + (p.sellingPrice * p.stock), 0);
        const totalCost = products.reduce((s, p) => s + (p.costPrice * p.stock), 0);
        const categories = Array.from(new Set(products.map(p => p.category)));
        return NextResponse.json({
          success: true,
          data: { total: products.length, totalValue, totalCost, potentialProfit: totalValue - totalCost, categories, lowStock: products.filter(p => p.stock <= 5).length, outOfStock: products.filter(p => p.stock === 0).length }
        });
      }

      case 'employees_list': {
        const emps = await prisma.employee.findMany({
          where: { companyId },
          select: { fullName: true, role: true, monthlySalary: true, isActive: true, phone: true, startDate: true },
        });
        const totalPayroll = emps.filter(e => e.isActive).reduce((s, e) => s + Number(e.monthlySalary || 0), 0);
        return NextResponse.json({ success: true, data: { employees: emps.map(e => ({ name: e.fullName, role: e.role, salary: Number(e.monthlySalary || 0), isActive: e.isActive, phone: e.phone })), totalPayroll, activeCount: emps.filter(e => e.isActive).length } });
      }

      case 'accounts_overview': {
        const accounts = await prisma.account.findMany({
          where: { companyId },
          select: { name: true, type: true, balance: true },
        });
        const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
        return NextResponse.json({ success: true, data: { accounts, totalBalance } });
      }

      // ============================================================
      // WRITE ACTIONS — AI creates/updates records
      // ============================================================

      case 'create_customer': {
        const { name, phone, type } = params || {};
        if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });
        // Check duplicate
        const existing = await prisma.shopClient.findFirst({ where: { companyId, name: { equals: name, mode: 'insensitive' } } });
        if (existing) return NextResponse.json({ success: false, error: 'duplicate', data: { name: existing.name, phone: existing.phone } });
        const customer = await prisma.shopClient.create({
          data: { name, phone: phone || '', email: null, status: 'Active', companyId: companyId!, userId: userId! }
        });
        return NextResponse.json({ success: true, action: 'created', data: { name: customer.name, phone: customer.phone, id: customer.id } });
      }

      case 'create_employee': {
        const { name: empName, role: empRole, salary: empSalary, phone: empPhone } = params || {};
        if (!empName || !empRole) return NextResponse.json({ success: false, error: 'Name and role required' }, { status: 400 });
        const emp = await prisma.employee.create({
          data: { fullName: empName, role: empRole, monthlySalary: empSalary ? parseFloat(empSalary) : null, phone: empPhone || null, companyId, isActive: true }
        });
        return NextResponse.json({ success: true, action: 'created', data: { name: emp.fullName, role: emp.role, salary: Number(emp.monthlySalary || 0), id: emp.id } });
      }

      case 'create_product': {
        const { name: prodName, sellingPrice, costPrice, stock: prodStock, category: prodCat } = params || {};
        if (!prodName || !sellingPrice) return NextResponse.json({ success: false, error: 'Name and price required' }, { status: 400 });
        const sku = `AI-${Date.now().toString(36).toUpperCase()}`;
        const prod = await prisma.product.create({
          data: { name: prodName, sku, sellingPrice: parseFloat(sellingPrice), costPrice: costPrice ? parseFloat(costPrice) : 0, stock: prodStock ? parseInt(prodStock) : 0, category: prodCat || 'General', companyId, userId: userId!, status: 'In Stock' }
        });
        return NextResponse.json({ success: true, action: 'created', data: { name: prod.name, price: prod.sellingPrice, stock: prod.stock, id: prod.id } });
      }

      case 'adjust_stock': {
        const { productName, newStock } = params || {};
        if (!productName) return NextResponse.json({ success: false, error: 'Product name required' }, { status: 400 });
        const product = await prisma.product.findFirst({ where: { companyId, name: { contains: productName, mode: 'insensitive' } } });
        if (!product) return NextResponse.json({ success: false, error: 'not_found' });
        const oldStock = product.stock;
        const updated = await prisma.product.update({
          where: { id: product.id },
          data: { stock: parseInt(newStock), status: parseInt(newStock) > 5 ? 'In Stock' : parseInt(newStock) > 0 ? 'Low Stock' : 'Out of Stock' }
        });
        await prisma.stockMovement.create({
          data: { productId: product.id, type: 'Adjustment', quantity: parseInt(newStock) - oldStock, userId: userId!, reference: 'AI Adjustment' }
        });
        return NextResponse.json({ success: true, action: 'adjusted', data: { name: product.name, oldStock, newStock: parseInt(newStock) } });
      }

      case 'create_sale': {
        const { productName: saleProdName, customerName, quantity: saleQty, paidAmount: salePaid, paymentMethod: salePM } = params || {};
        if (!saleProdName) return NextResponse.json({ success: false, error: 'Product name required' }, { status: 400 });

        // Find product
        const saleProd = await prisma.product.findFirst({ where: { companyId, name: { contains: saleProdName, mode: 'insensitive' } } });
        if (!saleProd) return NextResponse.json({ success: false, error: 'product_not_found', message: `Alaabta "${saleProdName}" lama helin` });

        const qty = parseInt(saleQty || '1');
        if (saleProd.stock < qty) return NextResponse.json({ success: false, error: 'insufficient_stock', message: `Stock gaadhay: ${saleProd.stock} kaliya` });

        // Find customer (optional) — check ShopClient first, then Customer
        let custId: string | null = null;
        let realCustId: string | null = null;
        if (customerName) {
          const shopClient = await prisma.shopClient.findFirst({ where: { companyId, name: { contains: customerName, mode: 'insensitive' } } });
          if (shopClient) {
            custId = shopClient.id;
          } else {
            // Fallback: check Customer table
            const realCust = await prisma.customer.findFirst({ where: { companyId, name: { contains: customerName, mode: 'insensitive' } } });
            if (realCust) realCustId = realCust.id;
          }
        }

        const itemTotal = saleProd.sellingPrice * qty;
        const tax = 0;
        const total = itemTotal + tax;
        const paid = salePaid && !isNaN(parseFloat(salePaid)) ? parseFloat(salePaid) : total;
        const invNum = `AI-${Date.now().toString(36).toUpperCase()}`;

        // Transaction: create sale + update stock
        const sale = await prisma.$transaction(async (tx: any) => {
          // Update stock
          const newStock = saleProd.stock - qty;
          await tx.product.update({
            where: { id: saleProd.id },
            data: { stock: newStock, status: newStock > 5 ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock' }
          });

          // Stock movement
          await tx.stockMovement.create({
            data: { productId: saleProd.id, type: 'Sale', quantity: -qty, userId: userId!, reference: `AI Sale: ${invNum}` }
          });

          // Create sale
          return tx.sale.create({
            data: {
              invoiceNumber: invNum,
              subtotal: itemTotal,
              tax,
              total,
              paymentMethod: salePM || 'Cash',
              paymentStatus: paid >= total ? 'Paid' : 'Partial',
              paidAmount: paid,
              userId: userId!,
              companyId: companyId!,
              customerId: custId,
              realCustomerId: realCustId,
              currency: 'ETB',
              notes: 'AI Sale Entry',
              items: {
                create: [{
                  productId: saleProd.id,
                  productName: saleProd.name,
                  quantity: qty,
                  unitPrice: saleProd.sellingPrice,
                  total: itemTotal,
                  costPrice: saleProd.costPrice || 0,
                  totalCost: (saleProd.costPrice || 0) * qty,
                }]
              }
            },
            include: { customer: true, realCustomer: true }
          });
        });

        return NextResponse.json({
          success: true, action: 'sale_created',
          data: {
            invoice: sale.invoiceNumber,
            product: saleProd.name,
            quantity: qty,
            total,
            paid,
            customer: (sale as any).customer?.name || (sale as any).realCustomer?.name || 'Walk-in',
            paymentStatus: sale.paymentStatus,
          }
        });
      }

      case 'product_search': {
        const { productName: searchName } = params || {};
        const found = await prisma.product.findMany({
          where: { companyId, name: { contains: searchName || '', mode: 'insensitive' } },
          select: { name: true, sellingPrice: true, costPrice: true, stock: true, category: true, status: true },
          take: 5,
        });
        return NextResponse.json({ success: true, data: found });
      }

      case 'top_customers': {
        const topCusts = await prisma.shopClient.findMany({
          where: { companyId },
          include: { sales: { select: { total: true, paidAmount: true } } },
          take: 50,
        });
        const ranked = topCusts
          .map(c => ({ name: c.name, phone: c.phone, totalSales: c.sales.reduce((s, x) => s + x.total, 0), totalPaid: c.sales.reduce((s, x) => s + x.paidAmount, 0), saleCount: c.sales.length }))
          .filter(c => c.saleCount > 0)
          .sort((a, b) => b.totalSales - a.totalSales)
          .slice(0, 10);
        return NextResponse.json({ success: true, data: ranked });
      }

      case 'expenses_overview': {
        const now2 = new Date();
        const monthStart = new Date(now2.getFullYear(), now2.getMonth(), 1);
        const expenses = await prisma.transaction.findMany({
          where: { companyId, type: 'EXPENSE', transactionDate: { gte: monthStart } },
          select: { amount: true, category: true, description: true, transactionDate: true },
          orderBy: { transactionDate: 'desc' }, take: 20,
        });
        const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
        const byCategory = new Map<string, number>();
        expenses.forEach(e => byCategory.set(e.category || 'Other', (byCategory.get(e.category || 'Other') || 0) + Number(e.amount)));
        return NextResponse.json({ success: true, data: { total: totalExpenses, byCategory: Object.fromEntries(byCategory), recent: expenses.slice(0, 5) } });
      }

      // ============================================================
      // REFUND — Cancel a sale, restore stock
      // ============================================================
      case 'refund_sale': {
        const { invoiceNumber } = params || {};
        if (!invoiceNumber) return NextResponse.json({ success: false, error: 'Invoice number required' }, { status: 400 });

        const sale = await prisma.sale.findFirst({
          where: { companyId, invoiceNumber: { contains: invoiceNumber, mode: 'insensitive' } },
          include: { items: true, customer: true }
        });
        if (!sale) return NextResponse.json({ success: false, error: 'not_found', message: `Invoice "${invoiceNumber}" lama helin` });
        if (sale.status === 'Refunded') return NextResponse.json({ success: false, error: 'already_refunded', message: 'Sale-kan hore ayaa loo refund gareeyyay' });

        // Transaction: mark refunded + restore stock
        await prisma.$transaction(async (tx: any) => {
          // Mark sale as refunded
          await tx.sale.update({
            where: { id: sale.id },
            data: { status: 'Refunded', paymentStatus: 'Refunded', notes: `${sale.notes || ''} | AI Refund ${new Date().toISOString()}` }
          });

          // Restore stock for each item
          for (const item of sale.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity }, status: 'In Stock' }
            });
            await tx.stockMovement.create({
              data: { productId: item.productId, type: 'Refund', quantity: item.quantity, userId: userId!, reference: `AI Refund: ${sale.invoiceNumber}` }
            });
          }
        });

        return NextResponse.json({
          success: true, action: 'refunded',
          data: {
            invoice: sale.invoiceNumber,
            total: sale.total,
            customer: sale.customer?.name || 'Walk-in',
            itemsRestored: sale.items.map(i => ({ name: i.productName, qty: i.quantity })),
          }
        });
      }

      // ============================================================
      // DELETE PRODUCT — Remove from inventory
      // ============================================================
      case 'delete_product': {
        const { productName: delProdName } = params || {};
        if (!delProdName) return NextResponse.json({ success: false, error: 'Product name required' }, { status: 400 });

        const delProd = await prisma.product.findFirst({ where: { companyId, name: { contains: delProdName, mode: 'insensitive' } } });
        if (!delProd) return NextResponse.json({ success: false, error: 'not_found', message: `Alaabta "${delProdName}" lama helin` });

        // Check if product has sales
        const saleCount = await prisma.saleItem.count({ where: { productId: delProd.id } });
        if (saleCount > 0) {
          return NextResponse.json({ success: false, error: 'has_sales', message: `Alaabtan ${saleCount} iib ayaa lagu sameeyay — lama tirtiri karo. Stock-ka 0 ka dhig.` });
        }

        await prisma.product.delete({ where: { id: delProd.id } });
        return NextResponse.json({ success: true, action: 'deleted', data: { name: delProd.name, price: delProd.sellingPrice } });
      }

      // ============================================================
      // VENDORS — Get suppliers list
      // ============================================================
      case 'vendors_list': {
        const vendors = await prisma.shopVendor.findMany({
          where: { companyId },
          select: { name: true, type: true, phone: true, email: true, contactPerson: true, productsServices: true },
          orderBy: { name: 'asc' },
        });
        const poAgg = await prisma.purchaseOrder.groupBy({
          by: ['vendorId'],
          where: { companyId },
          _sum: { total: true },
          _count: true,
        });
        return NextResponse.json({
          success: true,
          data: { vendors: vendors.map(v => ({ ...v })), totalVendors: vendors.length }
        });
      }

      // ============================================================
      // PURCHASES — Get recent purchase orders
      // ============================================================
      case 'purchases_list': {
        const purchases = await prisma.purchaseOrder.findMany({
          where: { companyId },
          include: { vendor: { select: { name: true } }, items: { select: { productName: true, quantity: true, unitCost: true, total: true } } },
          orderBy: { createdAt: 'desc' },
          take: 15,
        });
        const poTotal = await prisma.purchaseOrder.aggregate({ where: { companyId }, _sum: { total: true, paidAmount: true }, _count: true });
        return NextResponse.json({
          success: true,
          data: {
            count: poTotal._count,
            totalSpent: poTotal._sum.total || 0,
            totalPaid: poTotal._sum.paidAmount || 0,
            outstanding: (poTotal._sum.total || 0) - (poTotal._sum.paidAmount || 0),
            recent: purchases.map(p => ({
              poNumber: p.poNumber,
              vendor: p.vendor.name,
              total: p.total,
              paid: p.paidAmount,
              status: p.status,
              paymentStatus: p.paymentStatus,
              date: p.createdAt,
              items: p.items.length,
            })),
          }
        });
      }

      // ============================================================
      // SETTLE DEBT — Record customer debt payment
      // ============================================================
      case 'settle_debt': {
        const { customerName: debtCustName, amount: debtAmount, paymentMethod: debtPM } = params || {};
        if (!debtCustName || !debtAmount) return NextResponse.json({ success: false, error: 'Customer name and amount required' }, { status: 400 });

        const debtCust = await prisma.shopClient.findFirst({ where: { companyId, name: { contains: debtCustName, mode: 'insensitive' } } });
        if (!debtCust) return NextResponse.json({ success: false, error: 'not_found', message: `Macaamiilka "${debtCustName}" lama helin` });

        // Find unpaid/partial sales
        const unpaidSales = await prisma.sale.findMany({
          where: { companyId, customerId: debtCust.id, paymentStatus: { in: ['Partial', 'Unpaid'] } },
          orderBy: { createdAt: 'asc' },
        });

        if (unpaidSales.length === 0) return NextResponse.json({ success: false, error: 'no_debt', message: `${debtCust.name} deyn maleh` });

        let remaining = parseFloat(debtAmount);
        const settled: { invoice: string; paid: number }[] = [];

        await prisma.$transaction(async (tx: any) => {
          for (const sale of unpaidSales) {
            if (remaining <= 0) break;
            const owed = sale.total - sale.paidAmount;
            const payment = Math.min(remaining, owed);
            const newPaid = sale.paidAmount + payment;

            await tx.sale.update({
              where: { id: sale.id },
              data: { paidAmount: newPaid, paymentStatus: newPaid >= sale.total ? 'Paid' : 'Partial' }
            });

            settled.push({ invoice: sale.invoiceNumber, paid: payment });
            remaining -= payment;
          }
        });

        const totalDebt = unpaidSales.reduce((s, sale) => s + (sale.total - sale.paidAmount), 0);
        return NextResponse.json({
          success: true, action: 'debt_settled',
          data: {
            customer: debtCust.name,
            amountPaid: parseFloat(debtAmount) - remaining,
            salesSettled: settled,
            remainingDebt: Math.max(0, totalDebt - parseFloat(debtAmount)),
          }
        });
      }

      // ============================================================
      // UPDATE PRODUCT — Edit name, selling price, cost price
      // ============================================================
      case 'update_product': {
        const { productName: editProdName, newName, newSellingPrice, newCostPrice } = params || {};
        if (!editProdName) return NextResponse.json({ success: false, error: 'Product name required' }, { status: 400 });

        const editProd = await prisma.product.findFirst({ where: { companyId, name: { contains: editProdName, mode: 'insensitive' } } });
        if (!editProd) return NextResponse.json({ success: false, error: 'not_found', message: `Alaabta "${editProdName}" lama helin` });

        const updateData: any = {};
        if (newName) updateData.name = newName;
        if (newSellingPrice) updateData.sellingPrice = parseFloat(newSellingPrice);
        if (newCostPrice) updateData.costPrice = parseFloat(newCostPrice);

        if (Object.keys(updateData).length === 0) return NextResponse.json({ success: false, error: 'nothing_to_update', message: 'Wax la beddelo lama bixin' });

        const updated = await prisma.product.update({ where: { id: editProd.id }, data: updateData });
        return NextResponse.json({
          success: true, action: 'updated',
          data: {
            name: updated.name,
            sellingPrice: updated.sellingPrice,
            costPrice: updated.costPrice,
            changes: Object.keys(updateData),
          }
        });
      }

      // ============================================================
      // SEARCH SALE — Find sale by invoice number
      // ============================================================
      case 'search_sale': {
        const { invoiceNumber: searchInv } = params || {};
        if (!searchInv) return NextResponse.json({ success: false, error: 'Invoice number required' }, { status: 400 });

        const foundSale = await prisma.sale.findFirst({
          where: { companyId, invoiceNumber: { contains: searchInv, mode: 'insensitive' } },
          include: { items: true, customer: true, realCustomer: true },
        });

        if (!foundSale) return NextResponse.json({ success: false, error: 'not_found', message: `Invoice "${searchInv}" lama helin` });

        return NextResponse.json({
          success: true,
          data: {
            invoice: foundSale.invoiceNumber,
            total: foundSale.total,
            paid: foundSale.paidAmount,
            debt: foundSale.total - foundSale.paidAmount,
            status: foundSale.status,
            paymentStatus: foundSale.paymentStatus,
            paymentMethod: foundSale.paymentMethod,
            customer: foundSale.customer?.name || foundSale.realCustomer?.name || 'Walk-in',
            date: foundSale.createdAt,
            items: foundSale.items.map(i => ({ name: i.productName, qty: i.quantity, price: i.unitPrice, total: i.total })),
          }
        });
      }

      // ============================================================
      // MULTI-ITEM SALE — Sell multiple products in one transaction
      // ============================================================
      case 'create_multi_sale': {
        const { items: itemsJson, customerName: multiCustName, paidAmount: multiPaid, paymentMethod: multiPM } = params || {};
        if (!itemsJson) return NextResponse.json({ success: false, error: 'Items required' }, { status: 400 });

        let items: { productName: string; quantity: string }[];
        try {
          items = JSON.parse(itemsJson);
        } catch {
          return NextResponse.json({ success: false, error: 'invalid_items', message: 'Items JSON khalad' });
        }

        if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ success: false, error: 'empty_items' });

        // Find all products
        const productResults: { product: any, qty: number }[] = [];
        for (const item of items) {
          const prod = await prisma.product.findFirst({ where: { companyId, name: { contains: item.productName, mode: 'insensitive' } } });
          if (!prod) return NextResponse.json({ success: false, error: 'product_not_found', message: `Alaabta "${item.productName}" lama helin` });
          const qty = parseInt(item.quantity || '1');
          if (prod.stock < qty) return NextResponse.json({ success: false, error: 'insufficient_stock', message: `${prod.name} stock: ${prod.stock} kaliya, ${qty} ayaad rabtay` });
          productResults.push({ product: prod, qty });
        }

        // Find customer
        let multiCustId: string | null = null;
        let multiRealCustId: string | null = null;
        if (multiCustName) {
          const sc = await prisma.shopClient.findFirst({ where: { companyId, name: { contains: multiCustName, mode: 'insensitive' } } });
          if (sc) multiCustId = sc.id;
          else {
            const rc = await prisma.customer.findFirst({ where: { companyId, name: { contains: multiCustName, mode: 'insensitive' } } });
            if (rc) multiRealCustId = rc.id;
          }
        }

        const subtotal = productResults.reduce((s, r) => s + r.product.sellingPrice * r.qty, 0);
        const total = subtotal;
        const paid = multiPaid && !isNaN(parseFloat(multiPaid)) ? parseFloat(multiPaid) : total;
        const invNum = `AI-${Date.now().toString(36).toUpperCase()}`;

        const multiSale = await prisma.$transaction(async (tx: any) => {
          // Update stock for each product
          for (const { product, qty } of productResults) {
            const newStock = product.stock - qty;
            await tx.product.update({
              where: { id: product.id },
              data: { stock: newStock, status: newStock > 5 ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock' }
            });
            await tx.stockMovement.create({
              data: { productId: product.id, type: 'Sale', quantity: -qty, userId: userId!, reference: `AI Multi-Sale: ${invNum}` }
            });
          }

          return tx.sale.create({
            data: {
              invoiceNumber: invNum,
              subtotal,
              tax: 0,
              total,
              paymentMethod: multiPM || 'Cash',
              paymentStatus: paid >= total ? 'Paid' : 'Partial',
              paidAmount: paid,
              userId: userId!,
              companyId: companyId!,
              customerId: multiCustId,
              realCustomerId: multiRealCustId,
              currency: 'ETB',
              notes: 'AI Multi-Item Sale',
              items: {
                create: productResults.map(({ product, qty }) => ({
                  productId: product.id,
                  productName: product.name,
                  quantity: qty,
                  unitPrice: product.sellingPrice,
                  total: product.sellingPrice * qty,
                  costPrice: product.costPrice || 0,
                  totalCost: (product.costPrice || 0) * qty,
                }))
              }
            },
            include: { customer: true, items: true }
          });
        });

        return NextResponse.json({
          success: true, action: 'multi_sale_created',
          data: {
            invoice: multiSale.invoiceNumber,
            items: (multiSale as any).items.map((i: any) => ({ name: i.productName, qty: i.quantity, total: i.total })),
            total,
            paid,
            customer: (multiSale as any).customer?.name || 'Walk-in',
            paymentStatus: multiSale.paymentStatus,
          }
        });
      }

      // ============================================================
      // UPDATE CUSTOMER — Edit name or phone
      // ============================================================
      case 'update_customer': {
        const { customerName: editCustName, newName: custNewName, newPhone } = params || {};
        if (!editCustName) return NextResponse.json({ success: false, error: 'Customer name required' }, { status: 400 });

        const editCust = await prisma.shopClient.findFirst({ where: { companyId, name: { contains: editCustName, mode: 'insensitive' } } });
        if (!editCust) return NextResponse.json({ success: false, error: 'not_found', message: `Macaamiilka "${editCustName}" lama helin` });

        const custUpdateData: any = {};
        if (custNewName) custUpdateData.name = custNewName;
        if (newPhone) custUpdateData.phone = newPhone;

        if (Object.keys(custUpdateData).length === 0) return NextResponse.json({ success: false, error: 'nothing_to_update' });

        const updatedCust = await prisma.shopClient.update({ where: { id: editCust.id }, data: custUpdateData });
        return NextResponse.json({
          success: true, action: 'updated',
          data: { name: updatedCust.name, phone: updatedCust.phone, changes: Object.keys(custUpdateData) }
        });
      }

      // ============================================================
      // CREATE VENDOR — Register a new supplier
      // ============================================================
      case 'create_vendor': {
        const { name: vendorName, type: vendorType, phone: vendorPhone, contactPerson: vendorContact } = params || {};
        if (!vendorName) return NextResponse.json({ success: false, error: 'Vendor name required' }, { status: 400 });

        const existingVendor = await prisma.shopVendor.findFirst({ where: { companyId, name: { equals: vendorName, mode: 'insensitive' } } });
        if (existingVendor) return NextResponse.json({ success: false, error: 'exists', message: `Baayi'e "${vendorName}" hore ayuu u jiray` });

        const newVendor = await prisma.shopVendor.create({
          data: {
            name: vendorName,
            type: vendorType || 'General',
            phone: vendorPhone || null,
            contactPerson: vendorContact || null,
            companyId: companyId!,
            userId: userId,
          }
        });
        return NextResponse.json({
          success: true, action: 'vendor_created',
          data: { name: newVendor.name, type: newVendor.type, phone: newVendor.phone }
        });
      }

      // ============================================================
      // DAILY REPORT — Comprehensive business summary
      // ============================================================
      case 'daily_report': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's sales
        const todaySales = await prisma.sale.findMany({
          where: { companyId, createdAt: { gte: today, lt: tomorrow }, status: { not: 'Refunded' } },
          include: { items: true },
        });
        const salesCount = todaySales.length;
        const totalRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
        const totalCost = todaySales.reduce((s, sale) => s + sale.items.reduce((c, i) => c + (i.totalCost || 0), 0), 0);
        const totalProfit = totalRevenue - totalCost;
        const unpaidToday = todaySales.filter(s => s.paymentStatus !== 'Paid').reduce((s, sale) => s + (sale.total - sale.paidAmount), 0);

        // Low stock
        const lowStockProducts = await prisma.product.findMany({
          where: { companyId, stock: { lte: 5 } },
          select: { name: true, stock: true },
          orderBy: { stock: 'asc' },
          take: 10,
        });

        // Outstanding debts
        const debtSales = await prisma.sale.findMany({
          where: { companyId, paymentStatus: { in: ['Partial', 'Unpaid'] } },
          include: { customer: true },
        });
        const totalDebt = debtSales.reduce((s, sale) => s + (sale.total - sale.paidAmount), 0);

        // Top products today
        const productSales = new Map<string, { qty: number; revenue: number }>();
        todaySales.forEach(sale => sale.items.forEach(item => {
          const prev = productSales.get(item.productName) || { qty: 0, revenue: 0 };
          productSales.set(item.productName, { qty: prev.qty + item.quantity, revenue: prev.revenue + item.total });
        }));
        const topProducts = Array.from(productSales.entries())
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 5)
          .map(([name, data]) => ({ name, ...data }));

        return NextResponse.json({
          success: true,
          data: {
            date: today.toISOString().split('T')[0],
            sales: { count: salesCount, revenue: totalRevenue, cost: totalCost, profit: totalProfit, unpaidToday },
            lowStock: lowStockProducts,
            debts: { totalOutstanding: totalDebt, customerCount: new Set(debtSales.map(s => s.customerId).filter(Boolean)).size },
            topProducts,
          }
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown query type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
