export interface ProjectMaterial {
    id: string;
    name: string;
    quantityUsed: number;
    unit: string;
    costPerUnit: number;
    leftoverQty: number;
    dateUsed?: string | Date;
    projectId: string;
}

export interface ProjectReport {
    id: string;
    name: string;
    status: string;
    customer: string;
    startDate: string;
    expectedCompletionDate: string;
    actualCompletionDate: string;
    projectValue: number;
    totalRevenue: number;
    totalPayments: number;
    remainingRevenue: number;
    materialCosts: number;
    laborCosts: number;
    transportCosts: number;
    equipmentCosts: number;
    utilitiesCosts: number;
    consultancyCosts: number;
    totalExpenses: number;
    grossProfit: number;
    profitMargin: number;
    completionPercentage: number;
    expenseCount: number;
    transactionCount: number;
    paymentCount: number;
    receivables: number;
    projectedProfit: number;
    expenses: Array<{
        id: string;
        category: string;
        description: string;
        amount: number;
        date: string;
        subCategory?: string | null;
        note?: string | null;
        employeeName?: string | null;
        supplierName?: string | null;
        materials?: any;
    }>;
    transactions: Array<{
        id: string;
        type: string;
        description: string;
        amount: number;
        date: string;
    }>;
    payments: Array<{
        id: string;
        amount: number;
        date: string;
        description: string;
    }>;
    materialsUsed?: ProjectMaterial[];
}

export interface ProjectReportsData {
    companyName: string;
    companyLogoUrl: string | null;
    startDate: string | null;
    endDate: string | null;
    projects: ProjectReport[];
    summary: {
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        onHoldProjects: number;
        totalRevenue: number;
        totalExpenses: number;
        totalProfit: number;
        totalRemainingAgreement: number;
        totalLosses: number;
        totalReceivables: number;
        totalProjectValue: number;
        averageProfitMargin: number;
    };
}

export type DateFilterType = 'all' | 'lastWeek' | 'lastMonth' | 'lastTwoMonths' | 'thisYear' | 'custom';
