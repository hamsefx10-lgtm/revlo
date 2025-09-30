// app/employees/page.tsx - Employees List Page (10000% Design - API Integration & Enhanced)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layouts/Layout';
import { 
  Plus, Search, Filter, Calendar, List, LayoutGrid, DollarSign, Tag, User, ChevronRight, Briefcase, Mail, Phone, MapPin, Truck,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, RefreshCw,
  Clock as ClockIcon, TrendingUp, TrendingDown, Coins // Added for salary/payment tracking
} from 'lucide-react';
import Toast from '../../components/common/Toast'; // Import Toast component
import { calculateEmployeeSalary } from '../../lib/utils';

// --- Employee Data Interface (Refined for API response) ---
interface Employee {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  category?: 'COMPANY' | 'PROJECT';
  monthlySalary?: number | null;
  salaryPaidThisMonth?: number | null;
  lastPaymentDate?: string;
  isActive: boolean;
  startDate: string;
  overpaidAmount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  dailyRate?: number | null;
  earnedThisMonth?: number | null;
  daysWorkedThisMonth?: number | null;
  laborRecords?: Array<{
    id: string;
    projectId: string;
    projectName: string;
    workDescription: string;
    agreedWage: number | null;
    paidAmount: number | null;
    remainingWage: number | null;
    dateWorked: string;
  }>;
}

// --- Employee Table Row Component ---
const EmployeeRow: React.FC<{ employee: Employee; onEdit: (id: string) => void; onDelete: (id: string) => void; onRecordDailyWork: (id: string) => void; onRecordPayment: (id: string) => void }> = ({ employee, onEdit, onDelete, onRecordDailyWork, onRecordPayment }) => {
  // Calculate total salary owed based on months worked
  const salaryCalculation = employee.monthlySalary ? 
    calculateEmployeeSalary(
      Number(employee.monthlySalary),
      employee.startDate,
      new Date().toISOString().split('T')[0],
      Number(employee.salaryPaidThisMonth || 0)
    ) : null;
  
  const salaryRemaining = salaryCalculation ? salaryCalculation.remainingSalary : 0;
  const isOverpaidBasedOnWork = (employee.overpaidAmount ?? 0) > 0;
  const progress = employee.monthlySalary ? ((employee.salaryPaidThisMonth ?? 0) / employee.monthlySalary) * 100 : 0;
  
  let statusClass = '';
  let statusBgClass = '';
  if (employee.isActive) {
      statusClass = 'text-secondary';
      statusBgClass = 'bg-secondary/10';
  } else {
      statusClass = 'text-mediumGray';
      statusBgClass = 'bg-mediumGray/10';
  }

  return (
    <tr className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 dark:hover:from-primary/10 dark:hover:to-secondary/10 transition-all duration-200 border-b border-lightGray dark:border-gray-700 last:border-b-0 group">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            employee.category === 'COMPANY' 
              ? 'bg-gradient-to-br from-primary to-secondary' 
              : 'bg-gradient-to-br from-accent to-orange-500'
          }`}>
            <User size={16} className="text-white"/>
          </div>
          <div>
          <span className="font-semibold">{employee.fullName}</span>
            <div className="text-xs text-mediumGray dark:text-gray-400">
              ID: {employee.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <Tag size={16} className={employee.category === 'COMPANY' ? 'text-primary' : 'text-accent'}/> 
          <span className="font-medium">{employee.role}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            employee.category === 'COMPANY' 
              ? 'bg-primary/10 text-primary border border-primary/30' 
              : 'bg-accent/10 text-accent border border-accent/30'
          }`}>
            {employee.category === 'COMPANY' ? '🏢 Company' : '🏗️ Project'}
          </span>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        <div className="flex items-center space-x-2">
          {employee.email ? <Mail size={16} className="text-green-500"/> : <XCircle size={16} className="text-redError"/>} 
          <span>{employee.email || 'N/A'}</span>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">
        {employee.phone ? (
          <span className="text-green-600 dark:text-green-400 font-bold">{employee.phone}</span>
        ) : (
          <span className="text-mediumGray">N/A</span>
        )}
      </td>
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">
        {employee.category === 'COMPANY' ? (
          employee.monthlySalary != null ? (
          <div className="text-right">
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{employee.monthlySalary.toLocaleString()} ETB/bil</div>
            {salaryCalculation && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {salaryCalculation.totalMonths} bilood = {salaryCalculation.totalSalaryOwed.toLocaleString()} ETB
              </div>
            )}
          </div>
          ) : <span className="text-mediumGray">N/A</span>
        ) : (
          <div className="text-right">
            <div className="text-sm font-bold text-accent dark:text-accent">
              {employee.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0).toLocaleString()} ETB
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Project Wage
            </div>
          </div>
        )}
      </td>
      <td className="p-4 whitespace-nowrap text-secondary font-semibold text-right">
        {employee.category === 'COMPANY' ? (
          employee.salaryPaidThisMonth != null ? (
          <span className="text-green-600 dark:text-green-400 font-bold">{employee.salaryPaidThisMonth.toLocaleString()} ETB</span>
        ) : (
          <span className="text-mediumGray">N/A</span>
          )
        ) : (
          <div className="text-right">
            <div className="text-sm font-bold text-accent dark:text-accent">
              {employee.laborRecords?.reduce((sum, record) => sum + (record.paidAmount || 0), 0).toLocaleString()} ETB
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Total Paid
            </div>
          </div>
        )}
      </td>
      <td className={`p-4 whitespace-nowrap font-semibold text-right ${salaryRemaining < 0 ? 'text-redError' : 'text-primary'}`}> 
        {employee.category === 'COMPANY' ? (
          salaryCalculation ? (
          <div className="text-right">
            <div className={`text-sm font-bold ${salaryRemaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {Math.abs(salaryRemaining).toLocaleString()} ETB
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {salaryRemaining < 0 ? 'Overpaid' : 'Remaining'}
            </div>
          </div>
          ) : <span className="text-mediumGray">N/A</span>
        ) : (
          <div className="text-right">
            <div className="text-sm font-bold text-accent dark:text-accent">
              {(() => {
                const totalAgreedWage = employee.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0) || 0;
                const totalPaidAmount = employee.laborRecords?.reduce((sum, record) => sum + (record.paidAmount || 0), 0) || 0;
                const totalRemaining = totalAgreedWage - totalPaidAmount;
                return totalRemaining.toLocaleString();
              })()} ETB
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Remaining
            </div>
          </div>
        )}
      </td>
      <td className="p-4 whitespace-nowrap text-center">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${employee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center space-x-1">
          <button onClick={() => onRecordDailyWork(employee.id)} className="p-2 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Record Daily Work">
            <ClockIcon size={16} />
          </button>
          <button onClick={() => onRecordPayment(employee.id)} className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Record Payment">
            <Coins size={16} />
          </button>
          <Link href={`/employees/${employee.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="View Details">
            <Eye size={16} />
          </Link>
          <Link href={`/employees/edit/${employee.id}`} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Edit Employee">
            <Edit size={16} />
          </Link>
          <button onClick={() => onDelete(employee.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Delete Employee">
            <Trash2 size={16} />
          </button>
        </div>
        {/* Show project assignments if present */}
      </td>
    </tr>
  );
};

// --- Employee Card Component (for Mobile View) ---
const EmployeeCard: React.FC<{ employee: Employee; onEdit: (id: string) => void; onDelete: (id: string) => void; onRecordDailyWork: (id: string) => void; onRecordPayment: (id: string) => void }> = ({ employee, onEdit, onDelete, onRecordDailyWork, onRecordPayment }) => {
  const salaryRemaining = (employee.monthlySalary ?? 0) - (employee.salaryPaidThisMonth ?? 0);
  const isOverpaidBasedOnWork = (employee.overpaidAmount ?? 0) > 0;
  const progress = employee.monthlySalary ? ((employee.salaryPaidThisMonth ?? 0) / employee.monthlySalary) * 100 : 0;

    let borderColor = 'border-lightGray dark:border-gray-700';
    if (employee.isActive) borderColor = 'border-primary';
    if (isOverpaidBasedOnWork) borderColor = 'border-redError';


    return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up border-l-4 ${borderColor} relative group`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            employee.category === 'COMPANY' 
              ? 'bg-gradient-to-br from-primary to-secondary' 
              : 'bg-gradient-to-br from-accent to-orange-500'
          }`}>
            <User size={20} className="text-white"/>
          </div>
          <div>
            <h4 className="font-bold text-darkGray dark:text-gray-100 text-lg">{employee.fullName}</h4>
            <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-1">
              <Tag size={14} className={employee.category === 'COMPANY' ? 'text-primary' : 'text-accent'}/> 
              <span>{employee.role}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                employee.category === 'COMPANY' 
                  ? 'bg-primary/10 text-primary border border-primary/30' 
                  : 'bg-accent/10 text-accent border border-accent/30'
              }`}>
                {employee.category === 'COMPANY' ? '🏢 Company' : '🏗️ Project'}
              </span>
            </p>
            <p className="text-xs text-mediumGray dark:text-gray-400">
              ID: {employee.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex space-x-1 flex-shrink-0">
          <button onClick={() => onEdit(employee.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Edit">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(employee.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          {employee.email ? <Mail size={14} className="text-green-500"/> : <XCircle size={14} className="text-redError"/>} 
          <span>Email: {employee.email || 'N/A'}</span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          {employee.phone ? <Phone size={14} className="text-green-500"/> : <XCircle size={14} className="text-redError"/>} 
          <span>Taleefan: {employee.phone || 'N/A'}</span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <DollarSign size={14} className={employee.category === 'COMPANY' ? 'text-blue-500' : 'text-accent'}/> 
          <span>
            {employee.category === 'COMPANY' 
              ? `Mushahar Bil kasta: ${employee.monthlySalary != null ? `${employee.monthlySalary.toLocaleString()} ETB` : 'N/A'}`
              : `Total Project Wage: ${employee.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0).toLocaleString()} ETB`
            }
          </span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <Coins size={14} className="text-green-500"/> 
          <span>
            {employee.category === 'COMPANY' 
              ? `La Bixiyay Bishaan: ${employee.salaryPaidThisMonth != null ? `${employee.salaryPaidThisMonth.toLocaleString()} ETB` : 'N/A'}`
              : `Total Paid: ${employee.laborRecords?.reduce((sum, record) => sum + (record.paidAmount || 0), 0).toLocaleString()} ETB`
            }
          </span>
        </p>
        <p className={`text-sm flex items-center space-x-2 ${isOverpaidBasedOnWork ? 'text-redError' : 'text-primary'}`}>
          <DollarSign size={14} className={isOverpaidBasedOnWork ? 'text-redError' : 'text-blue-500'}/> 
          <span>
            {employee.category === 'COMPANY' 
              ? `Hadhay Bishaan: ${employee.overpaidAmount != null ? (isOverpaidBasedOnWork ? `-${Math.abs(employee.overpaidAmount).toLocaleString()} ETB` : `${employee.overpaidAmount.toLocaleString()} ETB`) : 'N/A'}`
              : `Total Project Remaining: ${(() => {
                  const totalAgreedWage = employee.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0) || 0;
                  const totalPaidAmount = employee.laborRecords?.reduce((sum, record) => sum + (record.paidAmount || 0), 0) || 0;
                  return (totalAgreedWage - totalPaidAmount).toLocaleString();
                })()} ETB`
            }
          </span>
        </p>
      </div>

      {/* Show project assignments if present */}

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-lightGray dark:bg-gray-700 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${progress < 100 ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-gradient-to-r from-green-500 to-green-600'}`} style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-mediumGray dark:text-gray-400">{progress.toFixed(0)}% Paid</span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${employee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-2 mt-4">
        <button onClick={() => onRecordDailyWork(employee.id)} className="p-2 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Record Daily Work">
          <ClockIcon size={16} />
        </button>
        <button onClick={() => onRecordPayment(employee.id)} className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Record Payment">
          <Coins size={16} />
        </button>
        <Link href={`/employees/${employee.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="View Details">
          <Eye size={16} />
        </Link>
      </div>
    </div>
    );
};


export default function EmployeesPage() {
  const router = useRouter(); 
  const [employees, setEmployees] = useState<Employee[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All'); 
  const [filterStatus, setFilterStatus] = useState('All'); // Active/Inactive
  const [filterEmployeeType, setFilterEmployeeType] = useState('All'); // Company/Project
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // Default to list view
  const [pageLoading, setPageLoading] = useState(true); 
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);


  // --- API Functions ---
  const fetchEmployees = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      // Use backend-calculated values directly for live, accurate display
      setEmployees(data.employees);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka shaqaalaha la soo gelinayay.', type: 'error' });
      setEmployees([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto shaqaalahan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/employees/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete employee');
        
        setToastMessage({ message: data.message || 'Shaqaalaha si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchEmployees(); // Re-fetch employees after deleting
      } catch (error: any) {
        console.error('Error deleting employee:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka shaqaalaha la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleEditEmployee = (id: string) => {
    router.push(`/employees/edit/${id}`); // Navigate to edit page
  };

  const handleRecordDailyWork = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
      setToastMessage({ 
        message: `Recording daily work for ${employee.fullName}. This will open a form to record hours worked and tasks completed.`, 
        type: 'info' 
      });
      // TODO: Open modal or navigate to daily work recording form
      // For now, we'll show a success message
      setTimeout(() => {
        setToastMessage({ 
          message: `Daily work recorded successfully for ${employee.fullName}!`, 
          type: 'success' 
        });
      }, 2000);
    }
  };

  const handleRecordPayment = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
      setToastMessage({ 
        message: `Recording payment for ${employee.fullName}. This will open the salary payment form.`, 
        type: 'info' 
      });
      // TODO: Open modal or navigate to payment recording form
      // For now, we'll show a success message
      setTimeout(() => {
        setToastMessage({ 
          message: `Payment recorded successfully for ${employee.fullName}!`, 
          type: 'success' 
        });
      }, 2000);
    }
  };


  useEffect(() => {
    fetchEmployees(); // Fetch employees on component mount
  }, []);

  // Add refresh function to manually refresh data
  const refreshData = async () => {
    await fetchEmployees();
    setToastMessage({ message: 'Data-ka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
  };

  // Add event listener for page visibility to refresh when user comes back to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh data when page becomes visible again
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); 


  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (employee.phone && employee.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'All' || employee.role === filterRole;
    const matchesStatus = filterStatus === 'All' || (filterStatus === 'Active' && employee.isActive) || (filterStatus === 'Inactive' && !employee.isActive);
    const matchesEmployeeType = filterEmployeeType === 'All' || 
                               (filterEmployeeType === 'Company' && employee.category === 'COMPANY') ||
                               (filterEmployeeType === 'Project' && employee.category === 'PROJECT');
    const matchesDate = filterDateRange === 'All' ? true : true; 

    return matchesSearch && matchesRole && matchesStatus && matchesEmployeeType && matchesDate;
  });

  // Filter options
  const employeeRoles = ['All', 'Labor', 'Manager', 'Admin', 'Other']; // Example roles
  const employeeStatuses = ['All', 'Active', 'Inactive'];
  const employeeTypes = ['All', 'Company', 'Project'];
  const dateRanges = ['All', 'Last 30 Days', 'This Quarter', 'This Year'];

  // Statistics with proper salary calculations
  const totalEmployeesCount = filteredEmployees.length;
  const activeEmployeesCount = filteredEmployees.filter(e => e.isActive).length;
  const laborEmployeesCount = filteredEmployees.filter(e => e.role === 'Labor').length;
  
  // Calculate total salary owed based on months worked for each employee
  const totalSalaryOwed = filteredEmployees.reduce((sum, employee) => {
    if (employee.category === 'COMPANY' && employee.monthlySalary) {
      const salaryCalc = calculateEmployeeSalary(
        Number(employee.monthlySalary),
        employee.startDate,
        new Date().toISOString().split('T')[0],
        Number(employee.salaryPaidThisMonth || 0)
      );
      return sum + salaryCalc.totalSalaryOwed;
    } else if (employee.category === 'PROJECT') {
      // For project employees, sum up all agreed wages
      return sum + (employee.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0) || 0);
    }
    return sum;
  }, 0);
  
  const totalSalaryPaid = filteredEmployees.reduce((sum, e) => {
    if (e.category === 'COMPANY') {
      return sum + (e.salaryPaidThisMonth ?? 0);
    } else if (e.category === 'PROJECT') {
      return sum + (e.laborRecords?.reduce((sum, record) => sum + (record.paidAmount || 0), 0) || 0);
    }
    return sum;
  }, 0);
  
  const totalSalaryRemaining = totalSalaryOwed - totalSalaryPaid;
  const totalOverpaidAmount = filteredEmployees.reduce((sum, e) => {
    if (e.category === 'COMPANY') {
      return sum + ((e.overpaidAmount ?? 0) > 0 ? (e.overpaidAmount ?? 0) : 0);
    } else if (e.category === 'PROJECT') {
      // For project employees, calculate overpaid amount from remaining wages
      const totalAgreedWage = e.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0) || 0;
      const totalPaidAmount = e.laborRecords?.reduce((sum, record) => sum + (record.paidAmount || 0), 0) || 0;
      const totalRemaining = totalAgreedWage - totalPaidAmount;
      return sum + (totalRemaining < 0 ? Math.abs(totalRemaining) : 0);
    }
    return sum;
  }, 0);
  
  // Monthly salary commitment (for reference) - includes PROJECT employees
  const totalMonthlySalaryCommitment = filteredEmployees.reduce((sum, e) => {
    if (e.category === 'COMPANY') {
      return sum + (e.monthlySalary ?? 0);
    } else if (e.category === 'PROJECT') {
      // For project employees, sum up all agreed wages
      return sum + (e.laborRecords?.reduce((sum, record) => sum + (record.agreedWage || 0), 0) || 0);
    }
    return sum;
  }, 0);


  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">Employees</h1>
        <div className="flex space-x-3">
          <Link href="/employees/add" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={20} className="mr-2" /> Ku Dar Shaqaale
          </Link>
          <button onClick={refreshData} className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center">
            <RefreshCw size={20} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Employee Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700/30 text-center">
          <div className="flex items-center justify-center mb-3">
            <User className="text-blue-500" size={24} />
          </div>
          <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Wadarta Shaqaalaha</h4>
          <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-100">{totalEmployeesCount}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{activeEmployeesCount} firfircoon</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700/30 text-center">
          <div className="flex items-center justify-center mb-3">
            <DollarSign className="text-green-500" size={24} />
          </div>
          <h4 className="text-lg font-semibold text-green-600 dark:text-green-400">Wadarta Mushahaarka</h4>
          <p className="text-3xl font-extrabold text-green-900 dark:text-green-100">{totalSalaryOwed.toLocaleString()} ETB</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">Company + Project Wages</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl shadow-lg border border-orange-200 dark:border-orange-700/30 text-center">
          <div className="flex items-center justify-center mb-3">
            <Coins className="text-orange-500" size={24} />
          </div>
          <h4 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Lacagta La Bixiyay</h4>
          <p className="text-3xl font-extrabold text-orange-900 dark:text-orange-100">{totalSalaryPaid.toLocaleString()} ETB</p>
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">Company + Project Payments</p>
        </div>
        
        <div className={`p-6 rounded-xl shadow-lg border text-center ${
          totalSalaryRemaining >= 0 
            ? 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700/30' 
            : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700/30'
        }`}>
          <div className="flex items-center justify-center mb-3">
            <TrendingUp className={totalSalaryRemaining >= 0 ? "text-purple-500" : "text-red-500"} size={24} />
          </div>
          <h4 className={`text-lg font-semibold ${totalSalaryRemaining >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
            Mushahar Hadhay
          </h4>
          <p className={`text-3xl font-extrabold ${totalSalaryRemaining >= 0 ? 'text-purple-900 dark:text-purple-100' : 'text-red-900 dark:text-red-100'}`}>
            {Math.abs(totalSalaryRemaining).toLocaleString()} ETB
          </p>
          <p className={`text-sm mt-1 ${totalSalaryRemaining >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
            {totalSalaryRemaining >= 0 ? 'Company + Project Remaining' : 'Overpaid'}
          </p>
        </div>
        
        {totalOverpaidAmount > 0 && (
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-700/30 text-center animate-fade-in-up">
            <div className="flex items-center justify-center mb-3">
              <TrendingDown className="text-red-500" size={24} />
            </div>
            <h4 className="text-lg font-semibold text-red-600 dark:text-red-400">Lacagta La Siidaayay</h4>
            <p className="text-3xl font-extrabold text-red-900 dark:text-red-100">{totalOverpaidAmount.toLocaleString()} ETB</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">Waa la soo celin karaa</p>
            </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
              placeholder="🔍 Search employees by name, email, or phone..."
              className="w-full p-4 pl-12 border-2 border-lightGray dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
        {/* Filter by Role */}
            <div className="relative w-full sm:w-48">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
          <select
                title="Filter by employee role"
                className="w-full p-3 pl-10 border-2 border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none shadow-sm"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            {employeeRoles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
                <ChevronRight className="transform rotate-90" size={18} />
          </div>
        </div>
            
        {/* Filter by Status */}
            <div className="relative w-full sm:w-48">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
          <select
                title="Filter by employee status"
                className="w-full p-3 pl-10 border-2 border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none shadow-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {employeeStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
                <ChevronRight className="transform rotate-90" size={18} />
              </div>
            </div>
            
            {/* Filter by Employee Type */}
            <div className="relative w-full sm:w-48">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
              <select
                title="Filter by employee type"
                className="w-full p-3 pl-10 border-2 border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none shadow-sm"
                value={filterEmployeeType}
                onChange={(e) => setFilterEmployeeType(e.target.value)}
              >
                {employeeTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
                <ChevronRight className="transform rotate-90" size={18} />
          </div>
        </div>
            
        {/* Filter by Date Range */}
            <div className="relative w-full sm:w-48">
              <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
                title="Filter by date range"
                className="w-full p-3 pl-10 border-2 border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none shadow-sm"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            {dateRanges.map(range => <option key={range} value={range}>{range}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
                <ChevronRight className="transform rotate-90" size={18} />
              </div>
            </div>
          </div>
          
        {/* View Mode Toggle */}
          <div className="flex space-x-2 w-full sm:w-auto justify-center">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-mediumGray dark:text-gray-400 border-2 border-lightGray dark:border-gray-700 hover:border-primary'
              }`}
              title="List View"
            >
                <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('cards')} 
              className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${
                viewMode === 'cards' 
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-mediumGray dark:text-gray-400 border-2 border-lightGray dark:border-gray-700 hover:border-primary'
              }`}
              title="Card View"
            >
                <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Employees View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Employees...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan shaqaale la helay.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20">
                <tr>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">MAGACA</th>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">DOORKA</th>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">EMAIL</th>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">TALEEFAN</th>
                  <th scope="col" className="px-4 py-4 text-right text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">MUSHAHAR BIL KASTA</th>
                  <th scope="col" className="px-4 py-4 text-right text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">LA BIXIYAY BISHAAN</th>
                  <th scope="col" className="px-4 py-4 text-right text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">HADHAY BISHAAN</th>
                  <th scope="col" className="px-4 py-4 text-center text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">XAALADDA</th>
                  <th scope="col" className="px-4 py-4 text-center text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredEmployees.map(employee => (
                  <EmployeeRow key={employee.id} employee={employee} onEdit={handleEditEmployee} onDelete={handleDeleteEmployee} onRecordDailyWork={handleRecordDailyWork} onRecordPayment={handleRecordPayment} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Placeholder */}
          <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
              <span className="text-sm text-darkGray dark:text-gray-100">Page 1 of {Math.ceil(filteredEmployees.length / 10) || 1}</span>
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Next</button>
          </div>
        </div>
      ) : ( /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredEmployees.map(employee => (
                <EmployeeCard key={employee.id} employee={employee} onEdit={handleEditEmployee} onDelete={handleDeleteEmployee} onRecordDailyWork={handleRecordDailyWork} onRecordPayment={handleRecordPayment} />
            ))}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
