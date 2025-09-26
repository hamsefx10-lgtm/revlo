import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Generate manufacturing reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const companyId = session.user.companyId;

    switch (reportType) {
      case 'overview':
        return await generateOverviewReport(companyId, startDate, endDate);
      
      case 'production-performance':
        return await generateProductionPerformanceReport(companyId, startDate, endDate);
      
      case 'material-usage':
        return await generateMaterialUsageReport(companyId, startDate, endDate);
      
      case 'labor-productivity':
        return await generateLaborProductivityReport(companyId, startDate, endDate);
      
      case 'cost-analysis':
        return await generateCostAnalysisReport(companyId, startDate, endDate);
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating manufacturing report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Overview Report
async function generateOverviewReport(companyId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter = buildDateFilter(startDate, endDate);

  const [
    totalOrders,
    completedOrders,
    inProgressOrders,
    totalProducts,
    totalMaterialCost,
    totalLaborCost,
    averageCompletionTime
  ] = await Promise.all([
    // Total Orders
    prisma.productionOrder.count({
      where: { companyId, ...dateFilter }
    }),
    
    // Completed Orders
    prisma.productionOrder.count({
      where: { companyId, status: 'COMPLETED', ...dateFilter }
    }),
    
    // In Progress Orders
    prisma.productionOrder.count({
      where: { companyId, status: 'IN_PROGRESS', ...dateFilter }
    }),
    
    // Total Products Produced
    prisma.productionOrder.aggregate({
      where: { companyId, status: 'COMPLETED', ...dateFilter },
      _sum: { quantity: true }
    }),
    
    // Total Material Cost
    prisma.materialPurchase.aggregate({
      where: { companyId, ...dateFilter },
      _sum: { totalPrice: true }
    }),
    
    // Total Labor Cost (estimated from work orders)
    prisma.workOrder.aggregate({
      where: { 
        companyId, 
        productionOrder: { ...dateFilter }
      },
      _sum: { estimatedHours: true }
    }),
    
    // Average Completion Time
    prisma.productionOrder.findMany({
      where: { 
        companyId, 
        status: 'COMPLETED',
        startDate: { not: null },
        completedDate: { not: null },
        ...dateFilter
      },
      select: {
        startDate: true,
        completedDate: true
      }
    })
  ]);

  // Calculate average completion time
  const avgCompletionTime = averageCompletionTime.length > 0 
    ? averageCompletionTime.reduce((sum, order) => {
        if (order.startDate && order.completedDate) {
          const diff = new Date(order.completedDate).getTime() - new Date(order.startDate).getTime();
          return sum + (diff / (1000 * 60 * 60 * 24)); // Convert to days
        }
        return sum;
      }, 0) / averageCompletionTime.length
    : 0;

  return NextResponse.json({
    reportType: 'overview',
    period: { startDate, endDate },
    data: {
      totalOrders,
      completedOrders,
      inProgressOrders,
      totalProducts: totalProducts._sum.quantity || 0,
      totalMaterialCost: totalMaterialCost._sum.totalPrice || 0,
      totalLaborCost: (totalLaborCost._sum.estimatedHours || 0) * 25, // Assuming $25/hour
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    }
  });
}

// Production Performance Report
async function generateProductionPerformanceReport(companyId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter = buildDateFilter(startDate, endDate);

  const performanceData = await prisma.productionOrder.findMany({
    where: { companyId, ...dateFilter },
    include: {
      customer: { select: { name: true } },
      workOrders: true,
      billOfMaterials: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const performanceMetrics = performanceData.map(order => {
    const totalMaterialCost = order.billOfMaterials?.reduce((sum, bom) => sum + Number(bom.totalCost), 0) || 0;
    const totalLaborHours = order.workOrders?.reduce((sum, wo) => sum + wo.estimatedHours, 0) || 0;
    const totalLaborCost = totalLaborHours * 25; // $25/hour
    const totalCost = totalMaterialCost + totalLaborCost;
    
    return {
      orderNumber: order.orderNumber,
      productName: order.productName,
      quantity: order.quantity,
      status: order.status,
      customer: order.customer?.name || 'N/A',
      totalCost,
      materialCost: totalMaterialCost,
      laborCost: totalLaborCost,
      costPerUnit: order.quantity > 0 ? totalCost / order.quantity : 0,
      startDate: order.startDate,
      dueDate: order.dueDate,
      completedDate: order.completedDate
    };
  });

  return NextResponse.json({
    reportType: 'production-performance',
    period: { startDate, endDate },
    data: performanceMetrics
  });
}

// Material Usage Report
async function generateMaterialUsageReport(companyId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter = buildDateFilter(startDate, endDate);

  const materialUsage = await prisma.billOfMaterial.groupBy({
    by: ['materialName'],
    where: {
      companyId,
      productionOrder: { ...dateFilter }
    },
    _sum: {
      quantity: true,
      totalCost: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        totalCost: 'desc'
      }
    }
  });

  const materialPurchases = await prisma.materialPurchase.groupBy({
    by: ['materialName'],
    where: {
      companyId,
      ...dateFilter
    },
    _sum: {
      quantity: true,
      totalPrice: true
    }
  });

  // Combine usage and purchases data
  const materialData = materialUsage.map(usage => {
    const purchase = materialPurchases.find(p => p.materialName === usage.materialName);
    return {
      materialName: usage.materialName,
      totalUsed: usage._sum.quantity || 0,
      totalCost: usage._sum.totalCost || 0,
      totalPurchased: purchase?._sum.quantity || 0,
      totalPurchaseCost: purchase?._sum.totalPrice || 0,
      usageCount: usage._count.id,
      efficiency: purchase?._sum.quantity ? 
        Math.round(((usage._sum.quantity || 0) / purchase._sum.quantity) * 100) : 0
    };
  });

  return NextResponse.json({
    reportType: 'material-usage',
    period: { startDate, endDate },
    data: materialData
  });
}

// Labor Productivity Report
async function generateLaborProductivityReport(companyId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter = buildDateFilter(startDate, endDate);

  const laborData = await prisma.workOrder.findMany({
    where: {
      companyId,
      productionOrder: { ...dateFilter }
    },
    include: {
      assignedTo: { select: { fullName: true, role: true } },
      productionOrder: { select: { orderNumber: true, productName: true } }
    }
  });

  const productivityMetrics = laborData.reduce((acc, workOrder) => {
    const employeeName = workOrder.assignedTo?.fullName || 'Unassigned';
    
    if (!acc[employeeName]) {
      acc[employeeName] = {
        employeeName,
        role: workOrder.assignedTo?.role || 'Unknown',
        totalHours: 0,
        totalOrders: 0,
        stages: [],
        efficiency: 0
      };
    }
    
    acc[employeeName].totalHours += workOrder.estimatedHours;
    acc[employeeName].totalOrders += 1;
    acc[employeeName].stages.push(workOrder.stage);
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate efficiency (hours per order)
  Object.values(productivityMetrics).forEach((employee: any) => {
    employee.efficiency = employee.totalOrders > 0 ? 
      Math.round((employee.totalHours / employee.totalOrders) * 10) / 10 : 0;
  });

  return NextResponse.json({
    reportType: 'labor-productivity',
    period: { startDate, endDate },
    data: Object.values(productivityMetrics)
  });
}

// Cost Analysis Report
async function generateCostAnalysisReport(companyId: string, startDate?: string | null, endDate?: string | null) {
  const dateFilter = buildDateFilter(startDate, endDate);

  const costData = await prisma.productionOrder.findMany({
    where: { companyId, ...dateFilter },
    include: {
      billOfMaterials: true,
      workOrders: true,
      materialPurchases: true
    }
  });

  const analysis = costData.map(order => {
    const materialCost = order.billOfMaterials?.reduce((sum, bom) => sum + Number(bom.totalCost), 0) || 0;
    const laborCost = order.workOrders?.reduce((sum, wo) => sum + wo.estimatedHours, 0) * 25 || 0;
    const purchaseCost = order.materialPurchases?.reduce((sum, mp) => sum + Number(mp.totalPrice), 0) || 0;
    const totalCost = materialCost + laborCost + purchaseCost;
    
    return {
      orderNumber: order.orderNumber,
      productName: order.productName,
      quantity: order.quantity,
      materialCost,
      laborCost,
      purchaseCost,
      totalCost,
      costPerUnit: order.quantity > 0 ? totalCost / order.quantity : 0,
      costBreakdown: {
        materialPercentage: totalCost > 0 ? Math.round((materialCost / totalCost) * 100) : 0,
        laborPercentage: totalCost > 0 ? Math.round((laborCost / totalCost) * 100) : 0,
        purchasePercentage: totalCost > 0 ? Math.round((purchaseCost / totalCost) * 100) : 0
      }
    };
  });

  // Calculate totals
  const totals = analysis.reduce((acc, order) => ({
    totalMaterialCost: acc.totalMaterialCost + order.materialCost,
    totalLaborCost: acc.totalLaborCost + order.laborCost,
    totalPurchaseCost: acc.totalPurchaseCost + order.purchaseCost,
    totalCost: acc.totalCost + order.totalCost,
    totalQuantity: acc.totalQuantity + order.quantity
  }), {
    totalMaterialCost: 0,
    totalLaborCost: 0,
    totalPurchaseCost: 0,
    totalCost: 0,
    totalQuantity: 0
  });

  return NextResponse.json({
    reportType: 'cost-analysis',
    period: { startDate, endDate },
    data: {
      orders: analysis,
      totals,
      averageCostPerUnit: totals.totalQuantity > 0 ? totals.totalCost / totals.totalQuantity : 0
    }
  });
}

// Helper function to build date filter
function buildDateFilter(startDate?: string | null, endDate?: string | null) {
  const filter: any = {};
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.gte = new Date(startDate);
    if (endDate) filter.createdAt.lte = new Date(endDate);
  }
  
  return filter;
}