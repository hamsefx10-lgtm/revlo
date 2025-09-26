'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Download, FileText, BarChart, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import Toast from '@/components/common/Toast';

interface FiscalYearSummary {
  fiscalYear: {
    id: string;
    year: number;
    startDate: string;
    endDate: string;
    status: string;
    description?: string;
  };
  summary: {
    totalTransactions: number;
    totalProjects: number;
    totalExpenses: number;
    totalPayments: number;
    totalIncome: number;
    netProfit: number;
  };
}

interface FiscalYearReports {
  summary: FiscalYearSummary;
  reports: {
    incomeStatement: {
      revenue: any[];
      expenses: any[];
    };
    balanceSheet: {
      assets: any[];
      liabilities: any[];
      equity: any[];
    };
    cashFlow: {
      operating: any[];
      investing: any[];
    };
    projectPerformance: any[];
  };
}

export default function FiscalYearReportsPage() {
  const params = useParams();
  const fiscalYearId = params.id as string;
  
  const [reports, setReports] = useState<FiscalYearReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (fiscalYearId) {
      fetchReports();
    }
  }, [fiscalYearId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/fiscal-years/${fiscalYearId}/reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        setToast({ message: 'Qalad ayaa dhacay marka la soo saarayay warbixinnada', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    setToast({ message: 'PDF export waa la hirgelin doonaa', type: 'success' });
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    setToast({ message: 'Excel export waa la hirgelin doonaa', type: 'success' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!reports) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">Warbixinnada lama helin</p>
        </div>
      </Layout>
    );
  }

  const { summary, reports: reportData } = reports;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Warbixinnada Sanadka {summary.fiscalYear.year}
            </h1>
            <p className="text-gray-600">
              {new Date(summary.fiscalYear.startDate).toLocaleDateString('so-SO')} - {' '}
              {new Date(summary.fiscalYear.endDate).toLocaleDateString('so-SO')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dakhliga Guud</p>
                <p className="text-2xl font-bold text-green-600">
                  ${summary.summary.totalIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kharashyada Guud</p>
                <p className="text-2xl font-bold text-red-600">
                  ${summary.summary.totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${summary.summary.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <BarChart className={`w-6 h-6 ${summary.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Faa'iidada Guud</p>
                <p className={`text-2xl font-bold ${summary.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${summary.summary.netProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mashaariicda</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.summary.totalProjects}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Income Statement */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Warbixinta Dakhliga iyo Kharashka</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4 text-green-600">Dakhliga</h3>
                <div className="space-y-2">
                  {reportData.incomeStatement.revenue.map((transaction, index) => (
                    <div key={index} className="flex justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">{transaction.description}</span>
                      <span className="text-sm font-medium text-green-600">
                        ${Number(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4 text-red-600">Kharashyada</h3>
                <div className="space-y-2">
                  {reportData.incomeStatement.expenses.map((transaction, index) => (
                    <div key={index} className="flex justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{transaction.description}</span>
                      <span className="text-sm font-medium text-red-600">
                        ${Number(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Waxqabadka Mashaariicda</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mashruuc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Macmiil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lacagta Heerka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lacagta La Bixiyay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Xaaladda
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.projectPerformance.map((project, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.customer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${Number(project.agreementAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${Number(project.advancePaid).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}

