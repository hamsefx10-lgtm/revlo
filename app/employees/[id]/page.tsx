// app/employees/[id]/page.tsx - Employee Details Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; // To get employee ID from URL and for navigation
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare, Briefcase, DollarSign, Calendar,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, Plus, Tag as TagIcon, Coins, Clock as ClockIcon,
  ClipboardList, TrendingUp // For work description icon and trending up icon
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Import Toast component
import { calculateEmployeeSalary, calculateEmployeeDays } from '@/lib/utils';

// --- Employee Data Interface (Refined for API response) ---
interface Employee {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string; // e.g., "Labor", "Manager", "Admin"
  monthlySalary: number; // Will be number after API processing
  salaryPaidThisMonth: number; // Lacagta la bixiyay bishaan
  lastPaymentDate?: string; // Taariikhda ugu dambeysay ee mushahar la qaatay
  isActive: boolean; // Active or Inactive
  startDate: string; // Taariikhda uu shaqada bilaabay
  overpaidAmount: number; // Lacagta la siidaayay marka loo eego kasbashada (from API)
  createdAt: string;
  updatedAt: string;
  // Nested data from API includes (as per API /api/employees/[id]/route.ts)
  laborRecords: { 
    id: string; 
    employeeName: string; 
    workDescription: string; 
    agreedWage: number; 
    paidAmount: number; 
    remainingWage: number; 
    dateWorked: string; 
    projectId: string; 
    project: { name: string; }; 
  }[];
  transactions: { 
    id: string; 
    description: string; 
    amount: number; 
    type: string; 
    transactionDate: string; 
  }[];
  // Calculated fields for frontend display (derived from API data)
  category: string;
  dailyRate?: number; 
  earnedThisMonth?: number; 
  daysWorkedThisMonth?: number;
  unpaidDaysFromPreviousMonths?: number;
  totalUnpaidDays?: number;
  daysPaidFor?: number;
  totalDaysShouldWork?: number; 
}

interface Expense {
  id: string;
  date: string;
  category: string;
  subCategory?: string;
  amount: number;
  approved?: boolean;
  note?: string;
}

const EmployeeDetailsPage: React.FC = () => {
  // Fetch salary summary for this employee (define only once, at the top)
  const fetchSalarySummary = async () => {
    try {
      const response = await fetch('/api/employees/salary-summary');
      if (!response.ok) throw new Error('Failed to fetch salary summary');
      const data = await response.json();
      if (data.summary) {
        const summary = data.summary.find((s: any) => s.employeeId === id);
        setSalarySummary(summary || null);
      }
    } catch (error) {
      setSalarySummary(null);
    }
  };
  const { id } = useParams(); // Get employee ID from URL
  const router = useRouter(); // For redirection after delete
  const [employee, setEmployee] = useState<Employee | null>(null); // State for employee data
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview'); // For tab navigation
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [salaryExpenses, setSalaryExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [salarySummary, setSalarySummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Mobile-friendly view modes similar to Project page
  const [viewModes, setViewModes] = useState<{ labor: 'list' | 'board' }>(() => ({
    labor: (typeof window !== 'undefined' && window.innerWidth < 768) ? 'board' : 'list'
  }));

  // Auto-switch to board view on mobile for better readability
  useEffect(() => {
    const applyMobileDefault = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        setViewModes(prev => ({ ...prev, labor: isMobile ? 'board' : prev.labor }));
      }
    };
    applyMobileDefault();
    window.addEventListener('resize', applyMobileDefault);
    return () => window.removeEventListener('resize', applyMobileDefault);
  }, []);

  // Fetch all expenses for this employee (approved only)
  // Fetch only salary expenses for this employee
  const fetchSalaryExpenses = async () => {
    if (!id) return;
    setExpensesLoading(true);
    try {
      const response = await fetch(`/api/expenses?employeeId=${id}&subCategory=Salary`);
      if (!response.ok) throw new Error('Failed to fetch salary expenses');
      const data = await response.json();
      setSalaryExpenses(data.expenses || []);
    } catch (error) {
      setSalaryExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  // --- API Functions ---
  const fetchEmployeeDetails = async () => {
  // fetchSalarySummary is now only defined once outside, not inside fetchEmployeeDetails
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${id}`);
      if (!response.ok) throw new Error('Failed to fetch employee details');
      const data = await response.json();
      
      // Convert Decimal fields to Number for frontend display
      const employeeData = {
        ...data.employee,
        monthlySalary: parseFloat(data.employee.monthlySalary),
        salaryPaidThisMonth: parseFloat(data.employee.salaryPaidThisMonth),
        overpaidAmount: parseFloat(data.employee.overpaidAmount), // Ensure overpaidAmount is number
        // Ensure nested Decimal values are also converted
        laborRecords: data.employee.laborRecords.map((rec: any) => ({
            ...rec,
            agreedWage: parseFloat(rec.agreedWage),
            paidAmount: parseFloat(rec.paidAmount),
            remainingWage: parseFloat(rec.remainingWage),
        })),
        transactions: data.employee.transactions.map((trx: any) => ({
            ...trx,
            amount: parseFloat(trx.amount),
        })),
      };

      // Use new category field for logic
      if (employeeData.category === 'COMPANY') {
        // Use the new improved calculation function
        const daysCalculation = calculateEmployeeDays(
          employeeData.monthlySalary,
          employeeData.startDate,
          new Date(),
          employeeData.salaryPaidThisMonth
        );

        employeeData.dailyRate = daysCalculation.dailyRate;
        employeeData.earnedThisMonth = daysCalculation.earnedThisMonth;
        employeeData.overpaidAmount = daysCalculation.overpaidAmount;
        employeeData.daysWorkedThisMonth = daysCalculation.daysWorkedThisMonth;
        
        // Add new fields for better display
        employeeData.unpaidDaysFromPreviousMonths = daysCalculation.unpaidDaysFromPreviousMonths;
        employeeData.totalUnpaidDays = daysCalculation.totalUnpaidDays;
        employeeData.daysPaidFor = daysCalculation.daysPaidFor;
        employeeData.totalDaysShouldWork = daysCalculation.totalDaysShouldWork;
      } else {
        // For project employees, earnedThisMonth is sum of agreedWage in laborRecords
        employeeData.earnedThisMonth = employeeData.laborRecords.reduce((sum: number, record: any) => sum + record.agreedWage, 0);
      }

      setEmployee(employeeData); 
    } catch (error: any) {
      console.error('Error fetching employee details:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta shaqaalaha la soo gelinayay.', type: 'error' });
      setEmployee(null); // Set employee to null on error
      router.push('/employees'); 
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (window.confirm('Ma hubtaa inaad tirtirto shaqaalahan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/employees/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete employee');
        
        setToastMessage({ message: data.message || 'Shaqaalaha si guul leh ayaa loo tirtiray!', type: 'success' });
        router.push('/employees'); // Redirect to employees list after successful delete
      } catch (error: any) {
        console.error('Error deleting employee:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka shaqaalaha la tirtirayay.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails(); // Fetch employee details when ID is available
      fetchSalaryExpenses(); // Fetch only salary expenses
      fetchSalarySummary(); // Fetch salary summary
    }
  // (moved above)
    // eslint-disable-next-line
  }, [id]);

  // Add refresh function to manually refresh data
  const refreshData = async () => {
    if (id) {
      setRefreshing(true);
      try {
        await Promise.all([
          fetchEmployeeDetails(),
          fetchSalaryExpenses(),
          fetchSalarySummary()
        ]);
        setToastMessage({ message: 'Data-ka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      } catch (error) {
        setToastMessage({ message: 'Cilad ayaa dhacday marka data-ka la cusboonaysiinayay.', type: 'error' });
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Add event listener for page visibility to refresh when user comes back to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        // Refresh data when page becomes visible again
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Employee Details...
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center p-8 text-redError bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <InfoIcon size={32} className="inline-block mb-4 text-redError"/>
          <p className="text-xl font-bold">Shaqaalaha ID "{id}" lama helin.</p>
          <Link href="/employees" className="mt-4 inline-block text-primary hover:underline">Ku Noqo Shaqaalaha &rarr;</Link>
        </div>
        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </Layout>
    );
  }

  // --- Combine all relevant payments for this employee ---
  // Only use salary expenses for Payments tab (for COMPANY employees)
  const salaryExpenseTransactions = employee.category === 'COMPANY'
    ? salaryExpenses.map(e => ({
        id: e.id,
        description: e.category + (e.subCategory ? ` - ${e.subCategory}` : ''),
        amount: -Math.abs(e.amount),
        type: 'EXPENSE',
        transactionDate: e.date,
        source: 'expense',
        note: e.note || '',
      }))
    : [];
  // All transactions for other tabs (unchanged)
  const allTransactions = [
    ...employee.transactions.map(t => ({ ...t, source: 'transaction', note: '' })),
    ...salaryExpenseTransactions,
  ].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  // --- Calculate Salary Information using our salary calculation system ---
  const salaryCalculation = employee.monthlySalary ? 
    calculateEmployeeSalary(
      Number(employee.monthlySalary),
      employee.startDate,
      new Date().toISOString().split('T')[0],
      Number(employee.salaryPaidThisMonth || 0)
    ) : null;

  // Use the calculated values
  const totalPaidThisMonth = Number(employee.salaryPaidThisMonth || 0);
  const salaryRemaining = salaryCalculation ? salaryCalculation.remainingSalary : 0;
  const totalSalaryOwed = salaryCalculation ? salaryCalculation.totalSalaryOwed : 0;
  const monthsWorked = salaryCalculation ? salaryCalculation.totalMonths : 0;
  const isOverpaidBasedOnWork = salaryRemaining < 0;
  const overpaidAmount = isOverpaidBasedOnWork ? Math.abs(salaryRemaining) : 0;
  
  // Calculate earned this month based on employee type
  const earnedThisMonth = employee.category === 'COMPANY' 
    ? (employee.earnedThisMonth || 0)
    : employee.laborRecords.reduce((sum, record) => sum + record.agreedWage, 0);

  // Calculate days-related variables for overpaid detection
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyRate = employee.monthlySalary ? employee.monthlySalary / daysInMonth : 0;
  const daysPaid = dailyRate ? Math.floor(totalPaidThisMonth / dailyRate) : 0;
  const daysWorked = employee.daysWorkedThisMonth || 0;
  const isOverpaidDays = daysPaid > daysWorked;

  return (
    <Layout>
      {/* Mobile Header */}
      <div className="block md:hidden mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/employees" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200">
            <ArrowLeft size={24} className="inline-block" />
          </Link>
          <button 
            onClick={refreshData} 
            disabled={refreshing}
            className={`p-2 rounded-lg transition duration-200 ${
              refreshing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-blue-700'
            }`}
          >
            {refreshing ? <Loader2 size={18} className="animate-spin" /> : <ClockIcon size={18} />}
          </button>
        </div>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">{employee.fullName}</h1>
          <div className="flex flex-wrap justify-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              employee.category === 'COMPANY' 
                ? 'bg-primary/10 text-primary border border-primary/30' 
                : 'bg-accent/10 text-accent border border-accent/30'
            }`}>
              {employee.category === 'COMPANY' ? '🏢 Company' : '🏗️ Project'}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/30">
              {employee.role}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
              ID: {employee.id.slice(0, 8)}...
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/employees/edit/${employee.id}`}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition duration-200 shadow-md bg-accent text-white hover:bg-orange-600 flex items-center justify-center"
          >
            <Edit size={16} className="mr-2" />
            Edit Shaqaale
          </Link>
          <button 
            onClick={handleDeleteEmployee}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-sm transition duration-200 shadow-md bg-redError text-white hover:bg-red-700 flex items-center justify-center"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/employees" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">{employee.fullName}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                employee.category === 'COMPANY' 
                  ? 'bg-primary/10 text-primary border border-primary/30' 
                  : 'bg-accent/10 text-accent border border-accent/30'
              }`}>
                {employee.category === 'COMPANY' ? '🏢 Shaqaale Shirkadda' : '🏗️ Shaqaale Mashruuca'}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary border border-secondary/30">
                {employee.role}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-300">
                ID: {employee.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={refreshData} 
            disabled={refreshing}
            className={`py-2.5 px-6 rounded-lg font-bold text-lg transition duration-200 shadow-md flex items-center ${
              refreshing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-blue-700'
            }`}
          >
            {refreshing ? (
              <Loader2 size={20} className="mr-2 animate-spin" />
            ) : (
              <ClockIcon size={20} className="mr-2" />
            )}
            {refreshing ? 'Cusboonaysiina...' : 'Cusboonaysii'}
          </button>
          <Link href={`/employees/edit/${employee.id}`} className="bg-accent text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center">
            <Edit size={20} className="mr-2" /> Edit Shaqaale
          </Link>
          <button onClick={handleDeleteEmployee} className="bg-redError text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-red-700 transition duration-200 shadow-md flex items-center">
            <Trash2 size={20} className="mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* Employee Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-xl shadow-md text-center">
          <h4 className="text-xs md:text-lg font-semibold text-mediumGray dark:text-gray-400">Nooca</h4>
          <p className="text-lg md:text-3xl font-extrabold text-primary">{employee.category === 'COMPANY' ? 'Company' : 'Project'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-xl shadow-md text-center">
          <h4 className="text-xs md:text-lg font-semibold text-mediumGray dark:text-gray-400">Doorka</h4>
          <p className="text-lg md:text-3xl font-extrabold text-primary">{employee.role}</p>
        </div>
        {employee.category === 'COMPANY' && (
          <>
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 p-6 rounded-xl shadow-lg border border-primary/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <DollarSign className="text-primary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-primary dark:text-primary">Mushahar Bil kasta</h4>
              <p className="text-3xl font-extrabold text-primary dark:text-primary">{employee.monthlySalary?.toLocaleString() || 0} ETB</p>
            </div>
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 dark:from-secondary/20 dark:to-secondary/30 p-6 rounded-xl shadow-lg border border-secondary/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <Coins className="text-secondary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-secondary dark:text-secondary">La Bixiyay Bishaan</h4>
              <p className="text-3xl font-extrabold text-secondary dark:text-secondary">{totalPaidThisMonth.toLocaleString()} ETB</p>
            </div>
            <div className={`p-6 rounded-xl shadow-lg border text-center ${
              salaryRemaining < 0 
                ? 'bg-gradient-to-br from-redError/10 to-redError/20 dark:from-redError/20 dark:to-redError/30 border-redError/30' 
                : 'bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 border-accent/30'
            }`}>
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className={salaryRemaining < 0 ? "text-redError" : "text-accent"} size={24} />
              </div>
              <h4 className={`text-lg font-semibold ${salaryRemaining < 0 ? 'text-redError dark:text-redError' : 'text-accent dark:text-accent'}`}>
                Hadhay Bishaan
              </h4>
              <p className={`text-3xl font-extrabold ${salaryRemaining < 0 ? 'text-redError dark:text-redError' : 'text-accent dark:text-accent'}`}>
                {salaryRemaining < 0 ? `-${Math.abs(salaryRemaining).toLocaleString()} ETB` : `${salaryRemaining.toLocaleString()} ETB`}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 p-6 rounded-xl shadow-lg border border-primary/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <Briefcase className="text-primary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-primary dark:text-primary">Kasbaday Bishaan</h4>
              <p className="text-3xl font-extrabold text-primary dark:text-primary">{earnedThisMonth.toLocaleString()} ETB</p>
            </div>
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 dark:from-secondary/20 dark:to-secondary/30 p-6 rounded-xl shadow-lg border border-secondary/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <Calendar className="text-secondary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-secondary dark:text-secondary">Maalmo Shaqeeyay</h4>
              <p className="text-3xl font-extrabold text-secondary dark:text-secondary">{employee.daysWorkedThisMonth || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-accent dark:text-accent">Bilaha La Shaqeeyay</h4>
              <p className="text-3xl font-extrabold text-accent dark:text-accent">{monthsWorked}</p>
              <p className="text-sm text-accent dark:text-accent mt-1">
                Laga bilaabay {new Date(employee.startDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 p-6 rounded-xl shadow-lg border border-primary/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <DollarSign className="text-primary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-primary dark:text-primary">Wadarta Maalmaha La Shaqeeyay</h4>
              <p className="text-3xl font-extrabold text-primary dark:text-primary">
                {employee.totalDaysShouldWork || 0} Maalmood
              </p>
              <p className="text-sm text-primary dark:text-primary mt-1">
                {employee.totalDaysShouldWork ? `${employee.totalDaysShouldWork} maalmood oo dhan la shaqeeyay` : 'Ma jiraan maalmaha la shaqeeyay'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 dark:from-secondary/20 dark:to-secondary/30 p-6 rounded-xl shadow-lg border border-secondary/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <Coins className="text-secondary" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-secondary dark:text-secondary">Maalmaha Aan La Bixin Bilihii Hore</h4>
              <p className="text-3xl font-extrabold text-secondary dark:text-secondary">
                {employee.unpaidDaysFromPreviousMonths || 0} Maalmood
              </p>
              <p className="text-sm text-secondary dark:text-secondary mt-1">
                {employee.unpaidDaysFromPreviousMonths ? `${employee.unpaidDaysFromPreviousMonths} maalmood oo aan la bixin bilihii hore` : 'Dhammaan maalmaha waa la bixiyay'}
              </p>
            </div>
            {isOverpaidBasedOnWork && (
              <div className="bg-gradient-to-br from-redError/10 to-redError/20 dark:from-redError/20 dark:to-redError/30 p-6 rounded-xl shadow-lg border border-redError/30 text-center animate-fade-in-up md:col-span-2">
                <h4 className="flex items-center justify-center space-x-2 text-lg font-semibold text-redError mb-2">
                  <XCircle size={24} className="text-redError"/>
                  <span>Lacag La Siidaayay Marka Loo Eego Shaqada La Qabtay</span>
                </h4>
                <p className="text-3xl font-extrabold text-redError mb-1">-{`${overpaidAmount.toLocaleString()} ETB`}</p>
                <p className="text-sm text-mediumGray dark:text-gray-500 mt-1">
                  Shaqaaluhu wuxuu qaatay mushahar ka badan inta uu kasbaday bishaan (kasbaday: {earnedThisMonth.toLocaleString()} ETB, la bixiyay: {totalPaidThisMonth.toLocaleString()} ETB).
                </p>
              </div>
            )}
          </>
        )}
        {employee.category === 'PROJECT' && (
          <>
            <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <Briefcase className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-accent dark:text-accent">Wadar Agreed Wage</h4>
              <p className="text-3xl font-extrabold text-accent dark:text-accent">
                {employee.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0).toLocaleString()} ETB
              </p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <ClipboardList className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-accent dark:text-accent">Mashruuca La Shaqeeyay</h4>
              <p className="text-3xl font-extrabold text-accent dark:text-accent">{employee.laborRecords?.length || 0}</p>
              <p className="text-sm text-accent dark:text-accent mt-1">Mashruuc</p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <DollarSign className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-accent dark:text-accent">Lacagta La Bixiyay</h4>
              <p className="text-3xl font-extrabold text-accent dark:text-accent">
                {employee.laborRecords?.reduce((sum, record) => sum + (record.paidAmount || 0), 0).toLocaleString()} ETB
              </p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-accent dark:text-accent">Lacagta Hadhay</h4>
              <p className="text-3xl font-extrabold text-accent dark:text-accent">
                {employee.laborRecords?.reduce((sum, record) => sum + (record.remainingWage || 0), 0).toLocaleString()} ETB
              </p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <Calendar className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-accent dark:text-accent">Taariikhda Ugu Dambeysay</h4>
              <p className="text-lg font-bold text-accent dark:text-accent">
                {employee.laborRecords && employee.laborRecords.length > 0 
                  ? new Date(employee.laborRecords[0].dateWorked).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/30 text-center">
              <div className="flex items-center justify-center mb-3">
                <UserIcon className="text-accent" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-accent dark:text-accent">Nooca Shaqaalaha</h4>
              <p className="text-2xl font-bold text-accent dark:text-accent">Project</p>
              <p className="text-sm text-accent dark:text-accent mt-1">Shaqaale Mashruuc</p>
            </div>
          </>
        )}
      </div>

      {/* Tabs for Employee Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in-up">
        <div className="border-b border-lightGray dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 md:space-x-8 px-3 md:px-6 lg:px-8 overflow-x-auto" aria-label="Tabs">
            {['Overview', 'Labor Records', 'Payments', 'Transactions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg focus:outline-none transition-colors duration-200
                  ${activeTab === tab 
                    ? 'border-primary text-primary dark:text-gray-100' 
                    : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {activeTab === 'Overview' && (
            <div>
              <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Macluumaadka Guud</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-darkGray dark:text-gray-100 mb-6">
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Magaca Buuxa:</span> {employee.fullName}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Doorka:</span> {employee.role}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Email:</span> {employee.email || 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taleefan:</span> {employee.phone || 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Xaaladda:</span> {employee.isActive ? 'Active' : 'Inactive'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Diiwaan Gashan:</span> {new Date(employee.createdAt).toLocaleDateString()}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taariikhda Bilowga Shaqada:</span> {new Date(employee.startDate).toLocaleDateString()}</p>
                {employee.lastPaymentDate && <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taariikhda Mushahar Ugu Dambeysay:</span> {new Date(employee.lastPaymentDate).toLocaleDateString()}</p>}
              </div>
              
              {/* Salary Calculation Details for Company Employees */}
              {employee.category === 'COMPANY' && salaryCalculation && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 p-6 rounded-xl border border-primary/30 mb-6">
                  <h4 className="text-xl font-bold text-primary dark:text-primary mb-4 flex items-center">
                    <DollarSign className="mr-2" size={24} />
                    Xisaabinta Mushahaarka Shirkadda
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-primary dark:text-primary font-medium">Bilaha La Shaqeeyay</p>
                      <p className="text-2xl font-bold text-primary dark:text-primary">{monthsWorked}</p>
                      <p className="text-xs text-primary dark:text-primary">
                        Laga bilaabay {new Date(employee.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-primary dark:text-primary font-medium">Mushahaar/Bil</p>
                      <p className="text-2xl font-bold text-primary dark:text-primary">{employee.monthlySalary?.toLocaleString()} ETB</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-primary dark:text-primary font-medium">Wadarta Mushahaarka</p>
                      <p className="text-2xl font-bold text-primary dark:text-primary">{totalSalaryOwed.toLocaleString()} ETB</p>
                      <p className="text-xs text-primary dark:text-primary">
                        {monthsWorked} bilood × {employee.monthlySalary?.toLocaleString()} ETB
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-primary dark:text-primary font-medium">Hore La Bixiyay</p>
                      <p className="text-2xl font-bold text-primary dark:text-primary">{employee.salaryPaidThisMonth?.toLocaleString()} ETB</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-primary/30">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-primary dark:text-primary">Lacagta Hadhay:</span>
                      <span className={`text-2xl font-bold ${salaryRemaining < 0 ? 'text-redError dark:text-redError' : 'text-secondary dark:text-secondary'}`}>
                        {salaryRemaining < 0 ? `-${Math.abs(salaryRemaining).toLocaleString()} ETB` : `${salaryRemaining.toLocaleString()} ETB`}
                      </span>
                    </div>
                    {salaryRemaining < 0 && (
                      <p className="text-sm text-redError dark:text-redError mt-2">
                        ⚠️ Shaqaaluhu wuxuu qaatay mushahar ka badan inta uu kasbaday
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Project Work Details for Project Employees */}
              {employee.category === 'PROJECT' && employee.laborRecords && employee.laborRecords.length > 0 && (
                <div className="bg-gradient-to-r from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl border border-accent/30 mb-6">
                  <h4 className="text-xl font-bold text-accent dark:text-accent mb-4 flex items-center">
                    <Briefcase className="mr-2" size={24} />
                    Xogta Mashruuca
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-accent dark:text-accent font-medium">Mashruuca La Shaqeeyay</p>
                      <p className="text-2xl font-bold text-accent dark:text-accent">{employee.laborRecords.length}</p>
                      <p className="text-xs text-accent dark:text-accent">Mashruuc</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-accent dark:text-accent font-medium">Wadar Agreed Wage</p>
                      <p className="text-2xl font-bold text-accent dark:text-accent">
                        {employee.laborRecords.reduce((sum, record) => sum + (record.agreedWage || 0), 0).toLocaleString()} ETB
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-accent dark:text-accent font-medium">Lacagta La Bixiyay</p>
                      <p className="text-2xl font-bold text-accent dark:text-accent">
                        {employee.laborRecords.reduce((sum, record) => sum + (record.paidAmount || 0), 0).toLocaleString()} ETB
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-accent dark:text-accent font-medium">Lacagta Hadhay</p>
                      <p className="text-2xl font-bold text-accent dark:text-accent">
                        {employee.laborRecords.reduce((sum, record) => sum + (record.remainingWage || 0), 0).toLocaleString()} ETB
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-accent/30">
                    <h5 className="text-lg font-semibold text-accent dark:text-accent mb-3">Mashruuca La Shaqeeyay:</h5>
                    <div className="space-y-2">
                      {employee.laborRecords.map((record, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div>
                            <span className="font-medium text-darkGray dark:text-gray-100">{record.project?.name || 'Unknown Project'}</span>
                            <p className="text-sm text-mediumGray dark:text-gray-400">{record.workDescription}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-accent dark:text-accent">{record.agreedWage?.toLocaleString()} ETB</p>
                            <p className="text-sm text-mediumGray dark:text-gray-400">
                              Paid: {record.paidAmount?.toLocaleString()} ETB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
        )}
        {/* --- Monthly Salary/Advance Summary Section (Single, Clear, Not Duplicated) --- */}
        {employee.category === 'COMPANY' && (
          <div className="mb-6 bg-lightGray dark:bg-gray-700 rounded-xl p-5 animate-fade-in-up">
            <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-3">Xogta Lacagaha Mushaharka Bishaan</h3>
            <div className="flex flex-wrap gap-8">
              <div>
                <span className="block text-mediumGray dark:text-gray-400">La Bixiyay Bishaan</span>
                <span className="text-2xl font-bold text-accent">{totalPaidThisMonth.toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="block text-mediumGray dark:text-gray-400">Hadhay Bishaan</span>
                <span className={`text-2xl font-bold ${salaryRemaining < 0 ? 'text-redError' : 'text-primary'}`}>{salaryRemaining < 0 ? `-${Math.abs(salaryRemaining).toLocaleString()} ETB` : `${salaryRemaining.toLocaleString()} ETB`}</span>
              </div>
              <div>
                <span className="block text-mediumGray dark:text-gray-400">Kasbaday Bishaan</span>
                <span className="text-2xl font-bold text-primary">{earnedThisMonth.toLocaleString()} ETB</span>
              </div>
              {isOverpaidBasedOnWork && (
                <div>
                  <span className="block text-mediumGray dark:text-gray-400">Overpaid</span>
                  <span className="text-2xl font-bold text-redError">-{overpaidAmount.toLocaleString()} ETB</span>
                </div>
              )}
            </div>
            {isOverpaidDays && (
              <div className="mt-3 p-3 bg-redError/10 rounded-lg text-redError font-semibold">
                Shaqaalahan waxaa loo bixiyay lacag ka badan maalmaha uu shaqeeyay bishaan! (La bixiyay: {daysPaid} maalmood, Shaqeeyay: {daysWorked} maalmood)
              </div>
            )}
          </div>
        )}
      {/* <-- HALKAAS KALIYA HAL ) */}
      {activeTab === 'Labor Records' && employee.category === 'PROJECT' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">Project Labor</h3>
            <div className="md:hidden inline-flex items-center gap-1 bg-lightGray p-1 rounded-lg">
              <button onClick={() => setViewModes(v => ({...v, labor: 'list'}))} className={`px-2 py-1 rounded ${viewModes.labor==='list' ? 'bg-white shadow' : 'text-mediumGray'}`}>List</button>
              <button onClick={() => setViewModes(v => ({...v, labor: 'board'}))} className={`px-2 py-1 rounded ${viewModes.labor==='board' ? 'bg-white shadow' : 'text-mediumGray'}`}>Board</button>
                  </div>
          </div>
          {(() => {
            const records = employee.laborRecords || [];
            if (records.length === 0) {
              return <p className="text-mediumGray dark:text-gray-400">No labor records for this employee.</p>;
            }

            // Group by project
            const projectMap: Record<string, { projectId: string; projectName: string; agreed: number; paid: number; remaining: number; items: any[] }>
              = {} as any;
            for (const r of records) {
              const key = r.projectId;
              if (!projectMap[key]) {
                projectMap[key] = { 
                  projectId: r.projectId, 
                  projectName: r.project?.name || 'Project', 
                  agreed: 0, 
                  paid: 0, 
                  remaining: 0, 
                  items: [] 
                };
              }
              projectMap[key].agreed += Number(r.agreedWage || 0);
              projectMap[key].paid += Number(r.paidAmount || 0);
              projectMap[key].remaining += Number(r.remainingWage || 0);
              projectMap[key].items.push(r);
            }
            const grouped = Object.values(projectMap);

            const totalAgreed = grouped.reduce((s, g) => s + g.agreed, 0);
            const totalPaid = grouped.reduce((s, g) => s + g.paid, 0);
            const totalRemaining = grouped.reduce((s, g) => s + g.remaining, 0); // use actual remaining (can be negative)

            const goPayRemaining = (projectId: string, projectName: string, remaining: number) => {
              // Navigate to expenses add with preselected params
              const params = new URLSearchParams({
                type: 'project',
                category: 'Labor',
                projectId,
                employeeId: String(employee.id),
              });
              // We rely on expenses/add logic to auto-fill remaining when previous records exist
              router.push(`/expenses/add?${params.toString()}`);
            };

            return (
              <div>
                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-lightGray dark:border-gray-700">
                    <div className="text-xs text-mediumGray">Total Project Wage</div>
                    <div className="text-lg font-bold text-darkGray dark:text-gray-100">{totalAgreed.toLocaleString()} ETB</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-lightGray dark:border-gray-700">
                    <div className="text-xs text-mediumGray">Total Paid</div>
                    <div className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()} ETB</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-lightGray dark:border-gray-700">
                    <div className="text-xs text-mediumGray">Remaining</div>
                    <div className={`text-lg font-bold ${totalRemaining >= 0 ? 'text-accent' : 'text-redError'}`}>{totalRemaining.toLocaleString()} ETB</div>
                  </div>
                </div>

                {/* Per-project mobile views */}
                {viewModes.labor === 'list' ? (
                  <ul className="divide-y divide-lightGray rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-lightGray dark:border-gray-700">
                    {grouped.map(g => (
                      <li key={g.projectId} className="p-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Briefcase className="text-accent" size={18} />
                            <span className="font-bold truncate text-darkGray dark:text-gray-100">{g.projectName}</span>
                          </div>
                          <div className="text-xs text-mediumGray mt-1">Agreed {g.agreed.toLocaleString()} • Paid {g.paid.toLocaleString()} • Rem {g.remaining.toLocaleString()}</div>
                        </div>
                        {g.remaining > 0 && (
                          <button onClick={() => goPayRemaining(g.projectId, g.projectName, g.remaining)} className="px-3 py-1.5 rounded-md bg-secondary text-white text-xs">Bixi</button>
                        )}
                </li>
              ))}
            </ul>
          ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {grouped.map((g) => (
                      <div key={g.projectId} className="rounded-xl bg-white dark:bg-gray-800 border border-lightGray dark:border-gray-700 p-3 md:p-4">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center space-x-2 min-w-0 flex-1">
                           <Briefcase className="text-accent flex-shrink-0" size={18} />
                           <h4 className="text-base md:text-lg font-bold text-darkGray dark:text-gray-100 truncate">{g.projectName}</h4>
                         </div>
                         <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${g.remaining > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                           {g.remaining > 0 ? 'Pending' : 'Paid'}
                         </span>
                       </div>
                       <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
                         <div>
                           <div className="text-xs text-mediumGray">Agreed</div>
                           <div className="font-bold text-sm md:text-base">{g.agreed.toLocaleString()} ETB</div>
                         </div>
                         <div>
                           <div className="text-xs text-mediumGray">Paid</div>
                           <div className="font-bold text-green-600 text-sm md:text-base">{g.paid.toLocaleString()} ETB</div>
                         </div>
                         <div>
                           <div className="text-xs text-mediumGray">Remaining</div>
                           <div className={`font-bold text-sm md:text-base ${g.remaining > 0 ? 'text-redError' : 'text-secondary'}`}>{g.remaining.toLocaleString()} ETB</div>
                         </div>
                       </div>
                       <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                         <div className="text-xs text-mediumGray">Contracts: {g.items.length}</div>
                         {g.remaining > 0 && (
                           <button onClick={() => goPayRemaining(g.projectId, g.projectName, g.remaining)} className="px-3 py-2 rounded-lg bg-secondary text-white text-xs md:text-sm hover:bg-green-600 transition-colors w-full sm:w-auto">
                             Bixi Inta Dhiman
                           </button>
                         )}
                       </div>
                      
                      {/* Transactions related to this project's labor payments */}
                      {(() => {
                        const projectTransactions = (employee.transactions || []).filter((t: any) => t.projectId === g.projectId);
                        if (projectTransactions.length === 0) {
                          return null;
                        }
                        return (
                          <div className="mt-4 border-t border-lightGray dark:border-gray-700 pt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <ClipboardList size={16} className="text-mediumGray" />
                              <span className="text-sm font-semibold text-darkGray dark:text-gray-100">Transactions</span>
                            </div>
                            <ul className="space-y-2">
                              {projectTransactions.map((trx: any) => (
                                <li key={trx.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <ClockIcon size={14} className="text-mediumGray" />
                                    <span className="truncate text-darkGray dark:text-gray-100" title={trx.description}>{trx.description || 'Payment'}</span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className={`font-bold ${Number(trx.amount) < 0 ? 'text-redError' : 'text-secondary'}`}>{Number(trx.amount).toLocaleString()} ETB</span>
                                    <span className="text-mediumGray">{new Date(trx.transactionDate).toLocaleDateString()}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      {activeTab === 'Payments' && employee.category === 'COMPANY' && (
        <div>
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Diiwaanka Mushaharka La Bixiyay</h3>
          {(() => {
            // Only show salary expenses for this employee this month
            const thisMonth = new Date().toISOString().slice(0, 7);
            const paidList = salaryExpenseTransactions.filter(
              t => t.transactionDate.slice(0, 7) === thisMonth
            );
            return paidList.length === 0 ? (
              <p className="text-mediumGray dark:text-gray-400">Ma jiraan diiwaan mushahar la bixiyay oo la helay.</p>
            ) : (
              <ul className="space-y-3">
                {paidList.map((trx: any) => (
                  <li key={trx.id} className="flex justify-between items-center bg-lightGray dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Coins className="text-redError" size={20} />
                      <span className="font-semibold text-darkGray dark:text-gray-100">{trx.description}</span>
                    </div>
                    <span className="text-redError font-bold">-${Math.abs(trx.amount).toLocaleString()}</span>
                    <span className="text-sm text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
          {/* Button to record new payment for this employee */}
          <button className="mt-4 bg-secondary text-white py-2 px-4 rounded-lg flex items-center hover:bg-green-600 transition duration-200 w-fit">
            <Plus size={18} className="mr-2"/> Diiwaan Geli Mushahar
          </button>
        </div>
      )}
      {activeTab === 'Transactions' && (
        <div>
          <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Dhaqdhaqaaqa Lacagta Guud</h3>
          {allTransactions.length === 0 ? (
            <p className="text-mediumGray dark:text-gray-400">Ma jiraan dhaqdhaqaaq lacag ah oo la xiriira shaqaalahan.</p>
          ) : (
            <ul className="space-y-3">
              {allTransactions.map((trx: any) => (
                <li key={trx.id} className="flex justify-between items-center bg-lightGray dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    {parseFloat(trx.amount) >= 0 ? <DollarSign className="text-secondary" size={20}/> : <XCircle className="text-redError" size={20}/>}
                    <span className="font-semibold text-darkGray dark:text-gray-100">{trx.description}</span>
                  </div>
                  <span className={`${parseFloat(trx.amount) >= 0 ? 'text-secondary' : 'text-redError'} font-bold`}>
                    {parseFloat(trx.amount) >= 0 ? '+' : '-'}${Math.abs(parseFloat(trx.amount)).toLocaleString()}
                  </span>
                  <span className="text-sm text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
        </div>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
};

export default EmployeeDetailsPage;
``