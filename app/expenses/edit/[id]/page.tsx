// app/expenses/edit/[id]/page.tsx - Edit Expense Page (Based on Add Page Structure)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import { 
  X, DollarSign, Tag, Calendar, MessageSquare, FileUp, Camera, Upload, 
  Info, ReceiptText, Briefcase, Users, HardHat, Truck, Home, CreditCard, Clock, Plus, Loader2, CheckCircle, XCircle, ChevronRight, ArrowLeft,
  Package, MinusCircle, Building, User, Coins, Save
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';
import { calculateEmployeeSalary } from '@/lib/utils';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Expense type: 'project' or 'company'
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState<'project' | 'company'>('company');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Common fields for all expense types
  const [amount, setAmount] = useState<number | ''>('');
  const [paidFrom, setPaidFrom] = useState('Cash'); 
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]); 
  const [note, setNote] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Specific fields for different categories
  const [materials, setMaterials] = useState([{ id: 1, name: '', qty: '', price: '', unit: '' }]); 
  // Material date tracking
  const [materialDate, setMaterialDate] = useState(new Date().toISOString().split('T')[0]);
  const [workDescription, setWorkDescription] = useState('');
  const [wage, setWage] = useState<number | ''>('');
  const [laborPaidAmount, setLaborPaidAmount] = useState<number | ''>('');
  const [transportType, setTransportType] = useState(''); 

  // Company Expense specific fields
  const [companyExpenseType, setCompanyExpenseType] = useState('');
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState('');
  const [salaryPaymentAmount, setSalaryPaymentAmount] = useState<number | ''>('');
  const [salaryPaymentDate, setSalaryPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [officeRentPeriod, setOfficeRentPeriod] = useState('');
  
  // Additional Company Expense fields
  const [electricityMeterReading, setElectricityMeterReading] = useState('');
  const [marketingCampaignName, setMarketingCampaignName] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [loanDate, setLoanDate] = useState('');
  const [debtRepaymentAmount, setDebtRepaymentAmount] = useState<number | ''>('');
  const [selectedDebt, setSelectedDebt] = useState('');
  
  // Maintenance & Repairs fields
  const [assetName, setAssetName] = useState('');
  const [repairType, setRepairType] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [partsUsed, setPartsUsed] = useState([{ id: 1, name: '', cost: '' }]);
  const [laborHours, setLaborHours] = useState<number | ''>('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');
  
  // Insurance Premiums fields
  const [insuranceType, setInsuranceType] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [coverageStartDate, setCoverageStartDate] = useState('');
  const [coverageEndDate, setCoverageEndDate] = useState('');
  const [premiumAmount, setPremiumAmount] = useState<number | ''>('');
  const [deductible, setDeductible] = useState<number | ''>('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  
  // Legal & Compliance fields
  const [legalServiceType, setLegalServiceType] = useState('');
  const [lawyerName, setLawyerName] = useState('');
  const [caseReference, setCaseReference] = useState('');
  const [hoursBilled, setHoursBilled] = useState<number | ''>('');
  const [legalHourlyRate, setLegalHourlyRate] = useState<number | ''>('');
  const [additionalCosts, setAdditionalCosts] = useState<number | ''>('');
  
  // Travel & Accommodation fields
  const [travelPurpose, setTravelPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [transportationCost, setTransportationCost] = useState<number | ''>('');
  const [accommodationCost, setAccommodationCost] = useState<number | ''>('');
  const [mealsCost, setMealsCost] = useState<number | ''>('');
  const [otherTravelCosts, setOtherTravelCosts] = useState<number | ''>('');
  
  // Fuel (Shidaal) fields
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [fuelQuantity, setFuelQuantity] = useState<number | ''>('');
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number | ''>('');
  const [fuelPurpose, setFuelPurpose] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [fuelReceiptNumber, setFuelReceiptNumber] = useState('');


  // Equipment Rental fields
  const [equipmentName, setEquipmentName] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState('');
  const [rentalFee, setRentalFee] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');

  // Consultancy fields
  const [consultantName, setConsultantName] = useState('');
  const [consultancyType, setConsultancyType] = useState('');
  const [consultancyFee, setConsultancyFee] = useState<number | ''>('');

  // Dynamic data from API
  const [projects, setProjects] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Fetch existing expense data to populate the form
  useEffect(() => {
    if (id) {
      const fetchExpense = async () => {
        setPageLoading(true);
        try {
          const res = await fetch(`/api/expenses/${id}`);
          if (!res.ok) throw new Error("Lama helin xogta kharashka");
          const data = await res.json();
          const expense = data.expense;

          // Populate common fields
          setCategory(expense.category);
          setPaidFrom(expense.paidFrom);
          setExpenseDate(new Date(expense.expenseDate || expense.date).toISOString().split('T')[0]);
          setNote(expense.note || '');
          setDescription(expense.description || '');
          setSelectedProject(expense.project?.id || '');
          setAmount(expense.amount);
          
          // Populate material date if available
          if (expense.materialDate) {
            setMaterialDate(new Date(expense.materialDate).toISOString().split('T')[0]);
          }

          // Determine expense type based on category
          if (expense.category === 'Company Expense') {
            setExpenseType('company');
            // Set company expense type based on description or other fields
            if (expense.description && expense.description.includes('Salary')) {
              setCompanyExpenseType('Salary');
              // Populate salary fields
              if (expense.employee?.id) setSelectedEmployeeForSalary(expense.employee.id);
              if (expense.amount) setSalaryPaymentAmount(expense.amount);
              if (expense.expenseDate) setSalaryPaymentDate(new Date(expense.expenseDate).toISOString().split('T')[0]);
            } else if (expense.description && expense.description.includes('Office Rent')) {
              setCompanyExpenseType('Office Rent');
            } else if (expense.description && expense.description.includes('Electricity')) {
              setCompanyExpenseType('Electricity');
            } else if (expense.description && expense.description.includes('Marketing')) {
              setCompanyExpenseType('Marketing');
            } else if (expense.description && expense.description.includes('Debt')) {
              setCompanyExpenseType('Debt Repayment');
            } else if (expense.description && expense.description.includes('Maintenance')) {
              setCompanyExpenseType('Maintenance');
            } else if (expense.description && expense.description.includes('Insurance')) {
              setCompanyExpenseType('Insurance');
            } else if (expense.description && expense.description.includes('Legal')) {
              setCompanyExpenseType('Legal');
            } else if (expense.description && expense.description.includes('Travel')) {
              setCompanyExpenseType('Travel');
            } else if (expense.description && expense.description.includes('Fuel')) {
              setCompanyExpenseType('Fuel');
            } else {
              setCompanyExpenseType('Other');
            }
          } else {
            setExpenseType('project');
          }

          // Populate category-specific fields based on expense data
          if (expense.materials && Array.isArray(expense.materials)) {
            setMaterials(expense.materials.map((m: any, i: number) => ({ id: i + 1, ...m })));
          }
          if (expense.transportType) setTransportType(expense.transportType);
          if (expense.consultantName) setConsultantName(expense.consultantName);
          if (expense.consultancyType) setConsultancyType(expense.consultancyType);
          if (expense.consultancyFee) setConsultancyFee(expense.consultancyFee);
          if (expense.equipmentName) setEquipmentName(expense.equipmentName);
          if (expense.rentalPeriod) setRentalPeriod(expense.rentalPeriod);
          if (expense.rentalFee) setRentalFee(expense.rentalFee);
          if (expense.supplierName) setSupplierName(expense.supplierName);
          if (expense.bankAccountId) setBankAccountId(expense.bankAccountId);

        } catch (error: any) {
          setToastMessage({ message: error.message, type: 'error' });
        } finally {
          setPageLoading(false);
        }
      };
      fetchExpense();
    }
  }, [id]);
  
  // Fetch options from API
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [projectsRes, accountsRes, employeesRes, customersRes, vendorsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/accounting/accounts'),
          fetch('/api/employees'),
          fetch('/api/customers'),
          fetch('/api/vendors')
        ]);
        const projectsData = await projectsRes.json();
        const accountsData = await accountsRes.json();
        const employeesData = await employeesRes.json();
        const customersData = await customersRes.json();
        const vendorsData = await vendorsRes.json();

        setProjects(projectsData.projects || []);
        setAccounts(accountsData.accounts || []);
        setEmployees(employeesData.employees || []);
        setCustomers(customersData.customers || []);
        setVendors(vendorsData.vendors || []);
      } catch (error) {
        console.error("Failed to fetch related data", error);
        setToastMessage({ message: "Cilad ayaa ka dhacday soo-gelinta xogta la xiriirta.", type: 'error' });
      }
    };
    fetchRelatedData();
  }, []);

  // Calculations & Handlers
  const totalMaterialCost = materials.reduce((sum, item) => {
    const qty = parseFloat(item.qty as string) || 0;
    const price = parseFloat(item.price as string) || 0;
    return sum + (qty * price);
  }, 0);

  const handleAddMaterial = () => setMaterials([...materials, { id: Date.now(), name: '', qty: '', price: '', unit: '' }]);
  const handleRemoveMaterial = (id: number) => setMaterials(materials.filter(mat => mat.id !== id));
  const handleMaterialChange = (id: number, field: string, value: string | number) => {
    setMaterials(materials.map(mat => mat.id === id ? { ...mat, [field]: value } : mat));
  };

  const validateForm = () => {
      const errors: { [key: string]: string } = {};
      if (!category) errors.category = "Category is required.";
    if (!amount || amount <= 0) errors.amount = "Amount is required and must be greater than 0.";
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!validateForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    // Build description based on category/subtype, matching add page logic
    let finalDescription = '';
    if (category === 'Labor') {
      finalDescription = workDescription.trim();
    } else if (category === 'Material') {
      finalDescription = `Material expense - ${expenseDate}`;
    } else if (category === 'Company Expense' && companyExpenseType === 'Salary') {
      const emp = employees.find(emp => emp.id === selectedEmployeeForSalary);
      finalDescription = `Salary payment${emp ? ' for ' + emp.fullName : ''} - ${expenseDate}`;
    } else if (category === 'Company Expense') {
      finalDescription = description.trim() || '';
    } else {
      finalDescription = description.trim() || category;
    }

    let expenseData: any = {
      category,
      paidFrom,
      expenseDate,
      note: note.trim() || undefined,
      projectId: expenseType === 'project' ? selectedProject : undefined,
      description: finalDescription,
      amount: category === 'Material' ? totalMaterialCost : amount,
      materials: category === 'Material' ? materials.map(({id, ...rest}) => rest) : undefined,
      materialDate: category === 'Material' ? materialDate : undefined,
      transportType: transportType || undefined,
      consultantName: consultantName || undefined,
      consultancyType: consultancyType || undefined,
      consultancyFee: consultancyFee || undefined,
      equipmentName: equipmentName || undefined,
      rentalPeriod: rentalPeriod || undefined,
      rentalFee: rentalFee || undefined,
      supplierName: supplierName || undefined,
      bankAccountId: bankAccountId || undefined,
      // Company Expense specific fields
      companyExpenseType: companyExpenseType || undefined,
      selectedEmployeeForSalary: selectedEmployeeForSalary || undefined,
      salaryPaymentAmount: salaryPaymentAmount || undefined,
      salaryPaymentDate: salaryPaymentDate || undefined,
    };

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Cusboonaysiinta kharashka way fashilantay');
      
      setToastMessage({ message: 'Kharashka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      router.push(`/expenses/${id}`);

    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} />
          <span>Soo raridda Foomka Wax-ka-beddelka...</span>
        </div>
      </Layout>
    );
  }
  
  const materialUnits = ['pcs', 'sq ft', 'sq m', 'Liter', 'kg', 'box', 'm'];
  const companyExpenseCategories = [
    { value: 'Salary', label: 'Mushahar', icon: Users },
    { value: 'Office Rent', label: 'Kirada Xafiiska', icon: Building },
    { value: 'Electricity', label: 'Koronto', icon: Info },
    { value: 'Fuel', label: 'Shidaal', icon: Truck },
    { value: 'Utilities', label: 'Adeegyada Guud', icon: Home },
    { value: 'Marketing', label: 'Suuqgeyn', icon: DollarSign },
    { value: 'Material', label: 'Alaab (Shirkadda)', icon: Package },
    { value: 'Debt', label: 'Deyn (La Qaatay)', icon: Coins },
    { value: 'Debt Repayment', label: 'Dib U Bixin Deynta', icon: Coins },
    { value: 'Other', label: 'Kale', icon: Info },
  ];

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100 flex items-center">
          <Link href={`/expenses/${id}`} className="p-2 rounded-full bg-lightGray dark:bg-gray-700 hover:bg-primary hover:text-white transition-colors duration-200 mr-4">
            <ArrowLeft size={28} />
          </Link>
          Wax Ka Beddel Kharashka
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 md:p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
        
          {/* Expense Type Display (Read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
              <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Kharashka</label>
              <div className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center">
                <Tag className="absolute left-3 text-mediumGray" size={20} />
                <span>{expenseType === 'company' ? 'Kharashka Shirkadda' : 'Kharashka Mashruuca'}</span>
              </div>
                </div>
            
            <div>
              <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qaybta Kharashka</label>
              <div className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center">
                <Tag className="absolute left-3 text-mediumGray" size={20} />
                <span>{category === 'Company Expense' ? 'Kharashka Shirkadda' : category}</span>
              </div>
            </div>
          </div>

          {/* Date and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label htmlFor="expenseDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda <span className="text-redError">*</span></label>
                 <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray" size={20} />
                <input type="date" id="expenseDate" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
              </div>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha (ETB) <span className="text-redError">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray" size={20} />
                <input type="number" id="amount" required value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || '')} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
                 </div>
              </div>
          </div>
          
          <hr className="dark:border-gray-600"/>

          {/* Material Form */}
          {category === 'Material' && (
             <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300">Faahfaahinta Alaabta</h3>
              
              {/* Material Date Section */}
              <div className="mb-4 p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="text-md font-semibold text-green-700 dark:text-green-300 mb-3">Taariikhda Alaabta</h4>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Taariikhda Alaabta La Qatay <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={materialDate} 
                    onChange={e => setMaterialDate(e.target.value)} 
                    className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary"
                    required 
                    title="Taariikhda Alaabta La Qatay"
                  />
                </div>
              </div>
              {materials.map((material, index) => (
                <div key={material.id} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-10 gap-3 items-end relative">
                  <div className="md:col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">Alaabta</label><input type="text" value={material.name} onChange={(e) => handleMaterialChange(material.id, 'name', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Magaca Alaabta"/></div>
                  <div className="md:col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">Tirada</label><input type="number" value={material.qty} onChange={(e) => handleMaterialChange(material.id, 'qty', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Tirada Alaabta"/></div>
                  <div className="md:col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">Qiimaha</label><input type="number" value={material.price} onChange={(e) => handleMaterialChange(material.id, 'price', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Qiimaha Alaabta"/></div>
                  <div className="md:col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">Cutubka</label><select value={material.unit} onChange={(e) => handleMaterialChange(material.id, 'unit', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none" title="Cutubka Alaabta"><option>Unit</option>{materialUnits.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
                  <div className="md:col-span-1"><button type="button" onClick={() => handleRemoveMaterial(material.id)} className="text-redError p-2" title="Tirtir Alaab"><MinusCircle size={20} /></button></div>
                </div>
              ))}
              <button type="button" onClick={handleAddMaterial} className="bg-primary/10 text-primary py-2 px-4 rounded-lg"><Plus size={18} className="mr-2 inline"/>Ku Dar</button>
              <div className="p-3 bg-primary/10 rounded-lg flex justify-between items-center"><span className="font-semibold">Wadarta:</span><span className="font-extrabold">{totalMaterialCost.toLocaleString()} ETB</span></div>
            </div>
          )}

          {/* Transport Form */}
          {category === 'Transport' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300">Faahfaahinta Gaadiidka</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="transportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nooca Gaadiidka</label>
                  <input type="text" id="transportType" value={transportType} onChange={(e) => setTransportType(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="e.g., Toyota Hilux" title="Nooca Gaadiidka"/>
                </div>
                <div>
                  <label htmlFor="transportAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qiimaha (ETB)</label>
                  <input type="number" id="transportAmount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || '')} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Qiimaha Gaadiidka"/>
                </div>
              </div>
            </div>
          )}

          {/* Consultancy Form */}
          {category === 'Consultancy' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300">Faahfaahinta La-taliinta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="consultantName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Magaca La-taliye</label>
                  <input type="text" id="consultantName" value={consultantName} onChange={(e) => setConsultantName(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Magaca La-taliye"/>
                </div>
                <div>
                  <label htmlFor="consultancyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nooca La-taliinta</label>
                  <input type="text" id="consultancyType" value={consultancyType} onChange={(e) => setConsultancyType(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Nooca La-taliinta"/>
                </div>
                <div>
                  <label htmlFor="consultancyFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qiimaha (ETB)</label>
                  <input type="number" id="consultancyFee" value={consultancyFee} onChange={(e) => setConsultancyFee(parseFloat(e.target.value) || '')} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Qiimaha La-taliinta"/>
                </div>
              </div>
            </div>
          )}

          {/* Equipment Rental Form */}
          {category === 'Equipment Rental' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300">Faahfaahinta Kirada Qalabka</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="equipmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Magaca Qalabka</label>
                  <input type="text" id="equipmentName" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Magaca Qalabka"/>
                </div>
                <div>
                  <label htmlFor="rentalPeriod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Muddada Kirada</label>
                  <input type="text" id="rentalPeriod" value={rentalPeriod} onChange={(e) => setRentalPeriod(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Muddada Kirada"/>
                </div>
                <div>
                  <label htmlFor="rentalFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qiimaha Kirada (ETB)</label>
                  <input type="number" id="rentalFee" value={rentalFee} onChange={(e) => setRentalFee(parseFloat(e.target.value) || '')} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Qiimaha Kirada"/>
                </div>
                <div>
                  <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Magaca Bixiyaha</label>
                  <input type="text" id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Magaca Bixiyaha"/>
                </div>
              </div>
            </div>
          )}

          {/* Company Expense Forms */}
          {category === 'Company Expense' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300">Nooca Kharashka Shirkadda</h3>
              
              {/* Company Expense Type Display (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Kharashka</label>
                <div className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center">
                  <span>{companyExpenseType || 'Kale'}</span>
                </div>
              </div>

              {/* Salary Specific Fields */}
              {companyExpenseType === 'Salary' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Mushaharka</h4>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="paidFrom_salary" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_salary"
                        required
                        value={paidFrom}
                        onChange={(e) => setPaidFrom(e.target.value)}
                        className="w-full p-2 pl-8 border rounded-lg bg-lightGray dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                      >
                        <option value="">-- Dooro Akoonka --</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} {acc.balance !== undefined ? `(${Number(acc.balance).toLocaleString()} ETB)` : ''}</option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="selectedEmployeeForSalary" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Dooro Shaqaale <span className="text-redError">*</span></label>
                    <select
                      id="selectedEmployeeForSalary"
                      required
                      value={selectedEmployeeForSalary}
                      onChange={(e) => setSelectedEmployeeForSalary(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-primary appearance-none"
                    >
                      <option value="">-- Dooro Shaqaale --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.fullName || emp.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="salaryPaymentAmount" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Lacagta La Bixinayo (ETB) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="salaryPaymentAmount"
                      required
                      value={salaryPaymentAmount}
                      onChange={(e) => setSalaryPaymentAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 500"
                      className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="salaryPaymentDate" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Taariikhda La Bixiyay <span className="text-redError">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <input
                        type="date"
                        id="salaryPaymentDate"
                        required
                        value={salaryPaymentDate}
                        onChange={(e) => setSalaryPaymentDate(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-lightGray dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Other Categories */}
          {category !== 'Material' && category !== 'Transport' && category !== 'Consultancy' && category !== 'Equipment Rental' && category !== 'Company Expense' && (
             <div>
              <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha (ETB)</label>
              <input type="number" id="amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || '')} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
            </div>
           )}

          <hr className="dark:border-gray-600"/>
          
          {/* Common Fields at the bottom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label htmlFor="paidFrom" className="block text-md font-medium text-darkGray dark:text-gray-300">Akoonka Laga Jarayo</label>
                <select id="paidFrom" required value={paidFrom} onChange={e => setPaidFrom(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">-- Dooro Akoonka --</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="selectedProject" className="block text-md font-medium text-darkGray dark:text-gray-300">Mashruuc La Xiriira (Ikhtiyaari)</label>
                <select id="selectedProject" value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">-- No Project --</option>
                  {projects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                </select>
              </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-md font-medium text-darkGray dark:text-gray-300">Sharaxaad</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
          </div>
          
          <div>
            <label htmlFor="note" className="block text-md font-medium text-darkGray dark:text-gray-300">Fiiro Gaar Ah (Ikhtiyaari)</label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
          </div>
          
          <button type="submit" className="w-full bg-secondary text-white py-3 rounded-lg font-bold text-lg hover:bg-green-600 flex items-center justify-center" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            {loading ? 'Cusboonaysiinaya...' : 'Kaydi Isbedelada'}
          </button>
        </form>
      </div>
      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
    </Layout>
  );
}
