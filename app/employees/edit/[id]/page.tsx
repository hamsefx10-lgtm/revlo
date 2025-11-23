// app/employees/edit/[id]/page.tsx - Edit Employee Page (10000% Design - API Integration with Dynamic Forms)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation'; // Import useParams
import Layout from '../../../../components/layouts/Layout';
import { 
  X, Loader2, Info, CheckCircle, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare,
  ArrowLeft, Tag, Briefcase as BriefcaseIcon, Clock as ClockIcon, Coins, Calendar, DollarSign, ClipboardList, Edit, ChevronRight
} from 'lucide-react';
import Toast from '../../../../components/common/Toast'; // Reuse Toast component

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams(); // Get employee ID from URL
  
  const [employeeType, setEmployeeType] = useState<'Company' | 'Project'>('Company'); // Company or Project employee
  
  // Common fields for all employee types
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true); // Default to active

  // Company Employee specific fields
  const [companyRole, setCompanyRole] = useState(''); // Role for company employee
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(''); // Monthly salary for company employee
  const [salaryStartDate, setSalaryStartDate] = useState(''); // Salary start date
  const [salaryStartTime, setSalaryStartTime] = useState(''); // Salary start time

  // Project Employee specific fields (these are for adding new labor records for an existing employee)
  // Note: This page primarily edits the main employee profile. Adding new labor records
  // for a project employee should ideally be done via a separate modal/form on the employee details page.
  // For simplicity here, if the employeeType is 'Project', we'll only edit their core profile.
  // The fields below are kept for consistency with the 'add' page structure but won't be used for PUT.
  const [selectedProject, setSelectedProject] = useState('');
  const [projectEmployeeName, setProjectEmployeeName] = useState(''); 
  const [workDescription, setWorkDescription] = useState('');
  const [agreedWage, setAgreedWage] = useState<number | ''>(''); 
  const [laborPaidAmount, setLaborPaidAmount] = useState<number | ''>(''); 
  const [dateWorked, setDateWorked] = useState(new Date().toISOString().split('T')[0]); 

  const [loading, setLoading] = useState(true); // Set to true for initial fetch
  const [submitting, setSubmitting] = useState(false); // For form submission loading
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const companyEmployeeRoles = ['Manager', 'Admin', 'HR', 'Accountant', 'Other']; // Roles for company employees
  const projectEmployeeRoles = ['Labor', 'Supervisor', 'Specialist', 'Other']; // Roles for project employees (if distinct)

  // Dummy data for selections (will be replaced by API calls)
  const dummyProjects = [ // Used for project selection in Project Employee form (if adding labor)
    { id: 'proj001', name: 'Furniture Project A' },
    { id: 'proj002', name: 'Office Setup B' },
    { id: 'proj003', name: 'Restaurant Decor C' },
  ];

  // --- Fetch Employee Details ---
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!id) return; // Don't fetch if ID is not available yet

      setLoading(true);
      try {
        const response = await fetch(`/api/employees/${id}`);
        if (!response.ok) throw new Error('Failed to fetch employee details');
        const data = await response.json();
        
        // Populate form fields with fetched data
        setFullName(data.employee.fullName);
        setEmail(data.employee.email || '');
        setPhone(data.employee.phone || '');
        setIsActive(data.employee.isActive);
        
        // Parse startDate to separate date and time
        if (data.employee.startDate) {
          const startDateObj = new Date(data.employee.startDate);
          setSalaryStartDate(startDateObj.toISOString().split('T')[0]);
          // Extract time in HH:MM format
          const hours = String(startDateObj.getHours()).padStart(2, '0');
          const minutes = String(startDateObj.getMinutes()).padStart(2, '0');
          setSalaryStartTime(`${hours}:${minutes}`);
        } else {
          setSalaryStartDate('');
          setSalaryStartTime('');
        }

        // Determine employee type and populate specific fields
        // If monthlySalary exists, it's a Company employee
        if (data.employee.monthlySalary !== undefined && data.employee.monthlySalary !== null) {
          setEmployeeType('Company');
          setCompanyRole(data.employee.role);
          setMonthlySalary(parseFloat(data.employee.monthlySalary)); // Convert Decimal to number
        } else {
          // If no monthly salary, assume it's a Project employee.
          // For editing, we primarily edit the core employee profile.
          setEmployeeType('Project'); 
          setCompanyRole(data.employee.role); // Use the existing role for project employee profile
          setMonthlySalary(''); // No monthly salary for project employee profile
        }

      } catch (error: any) {
        console.error('Error fetching employee details for edit:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta shaqaalaha la soo gelinayay.', type: 'error' });
        // Redirect if employee not found or error
        router.push('/employees'); 
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeDetails();
  }, [id, router]); // Re-fetch if ID changes or router updates

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!fullName.trim()) newErrors.fullName = 'Magaca buuxa waa waajib.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Fadlan geli email sax ah.';

    // Validation specific to the current employeeType being edited
    if (employeeType === 'Company') {
      if (!companyRole) newErrors.companyRole = 'Doorka shirkadda waa waajib.';
      if (typeof monthlySalary !== 'number' || monthlySalary <= 0) newErrors.monthlySalary = 'Mushaharka bil kasta waa waajib oo waa inuu noqdaa nambar wanaagsan.';
      if (!salaryStartDate) newErrors.salaryStartDate = 'Taariikhda bilowga mushaharka waa waajib.';
      if (!salaryStartTime) newErrors.salaryStartTime = 'Waqtiga bilowga mushaharka waa waajib.';
    } else { // Project Employee (editing core profile)
      // For project employees, we're editing their general profile, not a specific labor record.
      // We need to ensure they still have a role.
      if (!companyRole) newErrors.companyRole = 'Doorka shaqaalaha waa waajib.'; // Re-using companyRole for generic role
      if (!salaryStartDate) newErrors.salaryStartDate = 'Taariikhda bilowga shaqada waa waajib.';
      if (!salaryStartTime) newErrors.salaryStartTime = 'Waqtiga bilowga shaqada waa waajib.';
    }
    
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setValidationErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setSubmitting(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    let employeeData: any = {
      fullName,
      email: email || null,
      phone: phone || null,
      isActive,
    };

    try {
      // Combine date and time into ISO datetime string
      let startDateTime: string | null = null;
      if (salaryStartDate && salaryStartTime) {
        const [hours, minutes] = salaryStartTime.split(':');
        const dateTime = new Date(`${salaryStartDate}T${hours}:${minutes}:00`);
        startDateTime = dateTime.toISOString();
      }

      if (employeeType === 'Company') {
        employeeData = {
          ...employeeData,
          role: companyRole,
          monthlySalary: monthlySalary,
          startDate: startDateTime,
          category: 'COMPANY',
          // salaryPaidThisMonth and daysWorkedThisMonth are updated via separate actions/APIs
        };
        // API call for updating an existing general employee
        const response = await fetch(`/api/employees/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update company employee');
        setToastMessage({ message: data.message || 'Shaqaalaha shirkadda si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });

      } else { // Project Employee (updating core profile)
        employeeData = {
          ...employeeData,
          role: companyRole, // Use generic role for project employee profile
          monthlySalary: null, // Ensure monthlySalary is null for project employees
          startDate: startDateTime, // Allow project employees to have start date/time
          category: 'PROJECT',
        };
        // API call for updating an existing general employee (who might be a project employee)
        const response = await fetch(`/api/employees/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update project employee profile');
        setToastMessage({ message: data.message || 'Shaqaalaha mashruuca si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      }

      router.push(`/employees/${id}`); // Redirect to employee details page on success
    } catch (error: any) {
      console.error('Employee Edit API error:', error);
      setToastMessage({ message: error.message || 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Employee Data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href={`/employees/${id}`} className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Edit Shaqaale: {fullName}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Type Selection (Read-only after initial creation for simplicity) */}
          <div>
            <label htmlFor="employeeType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Shaqaalaha</label>
            <div className="flex space-x-3">
              <button 
                type="button" 
                disabled // Disable type change on edit page for simplicity
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${employeeType === 'Company' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 cursor-not-allowed'}`}
              >
                <Building size={20}/> <span>Shaqaalaha Shirkadda</span>
              </button>
              <button 
                type="button" 
                disabled // Disable type change on edit page for simplicity
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${employeeType === 'Project' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700 cursor-not-allowed'}`}
              >
                <BriefcaseIcon size={20}/> <span>Shaqaalaha Mashruuca</span>
              </button>
            </div>
          </div>

          {/* Common Fields for all employee types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Buuxa <span className="text-redError">*</span></label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tusaale: Axmed Cali"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.fullName ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.fullName && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.fullName}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tusaale@ganacsi.com"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.email ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.email && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taleefan (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="063-XXXXXXX"
                  className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                />
              </div>
            </div>
            <div>
              <label htmlFor="isActive" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Xaaladda Shaqaalaha</label>
              <div className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
                <span className="text-darkGray dark:text-gray-300">Firfircoon</span>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  className="h-5 w-5 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Fields based on Employee Type */}
          {employeeType === 'Company' ? (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in space-y-6">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-4">Faahfaahinta Shaqaalaha Shirkadda</h3>
              {/* Company Role */}
              <div>
                <label htmlFor="companyRole" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Doorka Shirkadda <span className="text-redError">*</span></label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="companyRole"
                    value={companyRole}
                    onChange={(e) => setCompanyRole(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.companyRole ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Door --</option>
                    {companyEmployeeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
                {validationErrors.companyRole && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.companyRole}</p>}
              </div>

              {/* Monthly Salary */}
              <div>
                <label htmlFor="monthlySalary" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mushahar Bil kasta ($) <span className="text-redError">*</span></label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <input
                    type="number"
                    id="monthlySalary"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || '')}
                    placeholder="Tusaale: 2500"
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.monthlySalary ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  />
                </div>
                {validationErrors.monthlySalary && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.monthlySalary}</p>}
              </div>

              {/* Salary Start Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="salaryStartDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Bilowga Mushaharka <span className="text-redError">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                    <input
                      type="date"
                      id="salaryStartDate"
                      value={salaryStartDate}
                      onChange={(e) => setSalaryStartDate(e.target.value)}
                      className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.salaryStartDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                  </div>
                  {validationErrors.salaryStartDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.salaryStartDate}</p>}
                </div>
                <div>
                  <label htmlFor="salaryStartTime" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Waqtiga Bilowga Mushaharka <span className="text-redError">*</span></label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                    <input
                      type="time"
                      id="salaryStartTime"
                      value={salaryStartTime}
                      onChange={(e) => setSalaryStartTime(e.target.value)}
                      className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.salaryStartTime ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                  </div>
                  {validationErrors.salaryStartTime && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.salaryStartTime}</p>}
                </div>
              </div>
            </div>
          ) : ( // Project Employee Form (This section is for editing core profile, not adding new labor records)
            <div className="p-4 border border-secondary/20 rounded-lg bg-secondary/5 animate-fade-in space-y-6">
              <h3 className="text-lg font-bold text-secondary dark:text-green-300 mb-4">Faahfaahinta Shaqaalaha Mashruuca</h3>
              <p className="text-sm text-mediumGray dark:text-gray-400">
                Boggan waxaa loogu talagalay in lagu wax ka beddelo macluumaadka guud ee shaqaalaha. Diiwaangelinta shaqada mashruuca (sida maalmaha la shaqeeyay ama mushaharka la bixiyay) waxaa laga maamulaa bogga faahfaahinta shaqaalaha.
              </p>
              {/* Project Employee Role (if distinct from main fullName) */}
              <div>
                <label htmlFor="projectEmployeeRole" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Doorka Shaqaalaha Mashruuca <span className="text-redError">*</span></label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="projectEmployeeRole"
                    value={companyRole} // Re-using companyRole state for generic role
                    onChange={(e) => setCompanyRole(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.companyRole ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Door --</option>
                    {projectEmployeeRoles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
                {validationErrors.companyRole && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.companyRole}</p>}
              </div>
              
              {/* Project Employee Start Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="projectStartDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Bilowga Shaqada <span className="text-redError">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                    <input
                      type="date"
                      id="projectStartDate"
                      value={salaryStartDate}
                      onChange={(e) => setSalaryStartDate(e.target.value)}
                      className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.salaryStartDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                  </div>
                  {validationErrors.salaryStartDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.salaryStartDate}</p>}
                </div>
                <div>
                  <label htmlFor="projectStartTime" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Waqtiga Bilowga Shaqada <span className="text-redError">*</span></label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                    <input
                      type="time"
                      id="projectStartTime"
                      value={salaryStartTime}
                      onChange={(e) => setSalaryStartTime(e.target.value)}
                      className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.salaryStartTime ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                  </div>
                  {validationErrors.salaryStartTime && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{validationErrors.salaryStartTime}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Edit className="mr-2" size={20} />
            )}
            {submitting ? 'Cusboonaysiinaya Shaqaale...' : 'Cusboonaysii Shaqaale'}
          </button>
        </form>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}

