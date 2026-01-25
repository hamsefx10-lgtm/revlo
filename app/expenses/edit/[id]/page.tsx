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
import { MaterialExpenseForm } from '@/components/expenses/MaterialExpenseForm';
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
  const [receiptImage, setReceiptImage] = useState<File | null>(null);

  // Specific fields for different categories
  const [materials, setMaterials] = useState([{ id: 1, name: '', qty: '', price: '', unit: '' }]);
  // Material date tracking
  const [materialDate, setMaterialDate] = useState(new Date().toISOString().split('T')[0]);
  const [workDescription, setWorkDescription] = useState('');
  const [wage, setWage] = useState<number | ''>('');
  const [laborPaidAmount, setLaborPaidAmount] = useState<number | ''>('');
  const [transportType, setTransportType] = useState('');
  const [taxiXamaalType, setTaxiXamaalType] = useState(''); // 'Taxi' or 'Xamaal'

  // Vendor payment tracking fields
  const [selectedVendor, setSelectedVendor] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID'); // PAID, UNPAID
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Company Labor wage tracking
  const [previousWageInfo, setPreviousWageInfo] = useState<{
    agreedWage: number;
    totalPaid: number;
    remaining: number;
  } | null>(null);

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
  const [companyLabors, setCompanyLabors] = useState<any[]>([]);

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

          // Determine expense type based on projectId and category
          if (!expense.project?.id) {
            // Company expense (no project)
            setExpenseType('company');

            // Check if category is a direct company category (not "Company Expense")
            const directCompanyCategories = ['Taxi/Xamaal', 'Company Labor', 'Material', 'Salary'];
            if (directCompanyCategories.includes(expense.category)) {
              // For direct categories, set companyExpenseType to the category
              if (expense.category === 'Material') {
                setCompanyExpenseType('Material');
              } else if (expense.category === 'Company Labor') {
                setCompanyExpenseType('Company Labor');
                // Populate company labor fields
                if (expense.employee?.id) {
                  setSelectedEmployeeForSalary(expense.employee.id);
                  // Fetch company labor records to get wage info
                  fetch(`/api/company-labors`)
                    .then(res => res.json())
                    .then(data => {
                      const labors = data.companyLabors || [];
                      const employeeLabors = labors.filter((l: any) => l.employeeId === expense.employee.id);
                      if (employeeLabors.length > 0) {
                        const totalAgreedWage = employeeLabors.reduce((sum: number, record: any) => sum + (record.agreedWage || 0), 0);
                        const totalPaid = employeeLabors.reduce((sum: number, record: any) => sum + (record.paidAmount || 0), 0);
                        const remaining = totalAgreedWage - totalPaid;
                        setPreviousWageInfo({
                          agreedWage: totalAgreedWage,
                          totalPaid: totalPaid,
                          remaining: remaining
                        });
                        // Set wage and paid amount from the most recent record
                        const latestLabor = employeeLabors[0];
                        if (latestLabor.agreedWage) setWage(latestLabor.agreedWage);
                        if (latestLabor.paidAmount) setLaborPaidAmount(latestLabor.paidAmount);
                      }
                    })
                    .catch(err => console.error('Error fetching company labors:', err));
                }
                if (expense.description) setWorkDescription(expense.description);
                if (expense.amount) setLaborPaidAmount(expense.amount);
              } else if (expense.category === 'Taxi/Xamaal') {
                setCompanyExpenseType('Taxi/Xamaal');
                if (expense.transportType) {
                  // transportType will be "Taxi" or "Xamaal"
                  setTaxiXamaalType(expense.transportType);
                }
              } else if (expense.category === 'Salary') {
                setCompanyExpenseType('Salary');
                // Populate salary fields
                if (expense.employee?.id) setSelectedEmployeeForSalary(expense.employee.id);
                if (expense.amount) setSalaryPaymentAmount(expense.amount);
                if (expense.expenseDate) setSalaryPaymentDate(new Date(expense.expenseDate).toISOString().split('T')[0]);
              }
              // Set category to match
              setCategory(expense.category);
            } else if (expense.category === 'Company Expense') {
              // For "Company Expense" category, determine type from description or subCategory
              setCategory('Company Expense');
              const descriptionText = expense.description || '';
              const descriptionLower = descriptionText.toLowerCase();
              if (expense.subCategory === 'Salary') {
                setCompanyExpenseType('Salary');
                if (expense.employee?.id) setSelectedEmployeeForSalary(expense.employee.id);
                if (expense.amount) setSalaryPaymentAmount(expense.amount);
                if (expense.expenseDate) setSalaryPaymentDate(new Date(expense.expenseDate).toISOString().split('T')[0]);
              } else if (descriptionLower.includes('salary')) {
                setCompanyExpenseType('Salary');
                if (expense.employee?.id) setSelectedEmployeeForSalary(expense.employee.id);
                if (expense.amount) setSalaryPaymentAmount(expense.amount);
                if (expense.expenseDate) setSalaryPaymentDate(new Date(expense.expenseDate).toISOString().split('T')[0]);
              } else if (descriptionLower.includes('office rent') || expense.subCategory === 'Office Rent') {
                setCompanyExpenseType('Office Rent');
                setAmount(Number(expense.amount));
                // Try to extract period from description (e.g., "Office Rent - Monthly - 2024-01-01")
                const periodMatch = descriptionText.match(/Office Rent\s*-\s*(\w+)/i);
                if (periodMatch) {
                  setOfficeRentPeriod(periodMatch[1]);
                }
              } else if (descriptionLower.includes('electricity') || expense.subCategory === 'Electricity') {
                setCompanyExpenseType('Electricity');
                setAmount(Number(expense.amount));
                // Try to extract meter reading from description (e.g., "Electricity - Meter Reading: 12345 - 2024-01-01")
                const meterMatch = descriptionText.match(/Meter Reading:\s*([^\s-]+)/i);
                if (meterMatch) {
                  setElectricityMeterReading(meterMatch[1]);
                }
              } else if (descriptionLower.includes('marketing') || expense.subCategory === 'Marketing') {
                setCompanyExpenseType('Marketing');
                setAmount(Number(expense.amount));
                // Try to extract campaign name from description (e.g., "Marketing - Summer Sale - 2024-01-01")
                const campaignMatch = descriptionText.match(/Marketing\s*-\s*([^-]+?)(?:\s*-\s*\d{4})/i);
                if (campaignMatch) {
                  setMarketingCampaignName(campaignMatch[1].trim());
                }
              } else if (descriptionLower.includes('utilities') || expense.subCategory === 'Utilities') {
                setCompanyExpenseType('Utilities');
                setAmount(Number(expense.amount));
                // Extract description for Utilities
                const utilitiesMatch = descriptionText.match(/Utilities\s*-\s*(.+)/i);
                if (utilitiesMatch) {
                  setDescription(utilitiesMatch[1].trim());
                }
              } else if (descriptionLower.includes('debt') || expense.subCategory === 'Debt') {
                setCompanyExpenseType('Debt');
              } else if (descriptionLower.includes('maintenance') || expense.subCategory === 'Maintenance & Repairs') {
                setCompanyExpenseType('Maintenance & Repairs');
              } else if (
                descriptionLower.includes('travel') ||
                descriptionLower.includes('accommodation') ||
                expense.subCategory === 'Travel & Accommodation'
              ) {
                setCompanyExpenseType('Travel & Accommodation');
              } else if (descriptionLower.includes('insurance') || expense.subCategory === 'Insurance Premiums') {
                setCompanyExpenseType('Insurance Premiums');
              } else if (
                descriptionLower.includes('legal') ||
                descriptionLower.includes('compliance') ||
                expense.subCategory === 'Legal & Compliance'
              ) {
                setCompanyExpenseType('Legal & Compliance');
              } else if (
                descriptionLower.includes('fuel') ||
                descriptionLower.includes('shidaal') ||
                expense.subCategory === 'Fuel'
              ) {
                setCompanyExpenseType('Fuel');
              } else {
                setCompanyExpenseType(expense.subCategory || 'Other');
              }
            } else {
              // Other company categories
              setCategory(expense.category);
            }
          } else {
            // Project expense
            setExpenseType('project');
            setCategory(expense.category);
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
          if (expense.transportType) setTransportType(expense.transportType);
          if (expense.consultantName) setConsultantName(expense.consultantName);
          if (expense.consultancyType) setConsultancyType(expense.consultancyType);
          if (expense.consultancyFee) setConsultancyFee(expense.consultancyFee);
          if (expense.equipmentName) setEquipmentName(expense.equipmentName);
          if (expense.rentalPeriod) setRentalPeriod(expense.rentalPeriod);
          if (expense.rentalFee) setRentalFee(expense.rentalFee);
          if (expense.supplierName) setSupplierName(expense.supplierName);
          if (expense.bankAccountId) setBankAccountId(expense.bankAccountId);

          // Populate Vendor & Payment info for Material/Company Material
          if (expense.vendor?.id) setSelectedVendor(expense.vendor.id);
          if (expense.paymentStatus) setPaymentStatus(expense.paymentStatus);
          if (expense.invoiceNumber) setInvoiceNumber(expense.invoiceNumber);
          // Map backend paidAmount to local laborPaidAmount state (shared state for paid amount)
          if (expense.paidAmount !== undefined && expense.paidAmount !== null) {
            setLaborPaidAmount(expense.paidAmount);
          }

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
        const [projectsRes, accountsRes, employeesRes, customersRes, vendorsRes, companyLaborsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/accounting/accounts'),
          fetch('/api/employees'),
          fetch('/api/customers'),
          fetch('/api/vendors'),
          fetch('/api/company-labors')
        ]);
        const projectsData = await projectsRes.json();
        const accountsData = await accountsRes.json();
        const employeesData = await employeesRes.json();
        const customersData = await customersRes.json();
        const vendorsData = await vendorsRes.json();
        const companyLaborsData = await companyLaborsRes.json();

        setProjects(projectsData.projects || []);
        setAccounts(accountsData.accounts || []);
        setEmployees(employeesData.employees || []);
        setCustomers(customersData.customers || []);
        setVendors(vendorsData.vendors || []);
        setCompanyLabors(companyLaborsData.companyLabors || []);
      } catch (error) {
        console.error("Failed to fetch related data", error);
        setToastMessage({ message: "Cilad ayaa ka dhacday soo-gelinta xogta la xiriirta.", type: 'error' });
      }
    };
    fetchRelatedData();
  }, []);

  // Auto-fill wage information when employee is selected (for company labor)
  useEffect(() => {
    if (selectedEmployeeForSalary && expenseType === 'company' && (companyExpenseType === 'Company Labor' || category === 'Company Labor')) {
      // Find previous labor records for this employee
      const previousRecords = companyLabors.filter(labor =>
        labor.employeeId === selectedEmployeeForSalary
      );

      if (previousRecords.length > 0) {
        // Calculate total agreed wage and total paid
        const totalAgreedWage = previousRecords.reduce((sum, record) => sum + (record.agreedWage || 0), 0);
        const totalPaid = previousRecords.reduce((sum, record) => sum + (record.paidAmount || 0), 0);
        const remaining = totalAgreedWage - totalPaid;

        setPreviousWageInfo({
          agreedWage: totalAgreedWage,
          totalPaid: totalPaid,
          remaining: remaining
        });
      } else {
        // No previous records, clear wage info
        setPreviousWageInfo(null);
      }
    } else if (expenseType === 'company' && (companyExpenseType === 'Company Labor' || category === 'Company Labor')) {
      setPreviousWageInfo(null);
    }
  }, [selectedEmployeeForSalary, expenseType, companyExpenseType, category, companyLabors]);

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

    // Common validation
    if (!category) errors.category = "Category is required.";

    // Material & Vendor Validation
    if (category === 'Material' || (category === 'Company Expense' && companyExpenseType === 'Material')) {
      if (materials.length === 0) errors.materials = "Fadlan ku dar ugu yaraan hal alaab.";
      materials.forEach((mat, index) => {
        if (!mat.name.trim()) errors[`materialName_${index}`] = 'Magaca alaabta waa waajib.';
        if (typeof parseFloat(mat.qty as string) !== 'number' || parseFloat(mat.qty as string) <= 0) errors[`materialQty_${index}`] = 'Quantity waa inuu noqdaa nambar wanaagsan.';
        if (typeof parseFloat(mat.price as string) !== 'number' || parseFloat(mat.price as string) <= 0) errors[`materialPrice_${index}`] = 'Qiimaha waa inuu noqdaa nambar wanaagsan.';
      });

      // Vendor & Payment Validation
      if (expenseType === 'company' || category === 'Material') { // Valid for both Project & Company Material
        if (!selectedVendor) errors.selectedVendor = 'Iibiyaha waa waajib.';
        if (!paymentStatus) errors.paymentStatus = 'Xaaladda lacag bixinta waa waajib.';

        if (paymentStatus === 'PAID' && !paidFrom) errors.paidFrom = 'Akoonka lacagta laga jarayo waa waajib.';
        if (paymentStatus === 'PARTIAL') {
          if (!paidFrom) errors.paidFrom = 'Akoonka lacagta laga jarayo waa waajib.';
          if (!laborPaidAmount || laborPaidAmount <= 0) errors.paidAmount = 'Fadlan geli lacagta la bixiyay.';
        }
      }
    }

    if (!['Material', 'Company Expense'].includes(category)) {
      if (!amount || amount <= 0) errors.amount = "Amount is required and must be greater than 0.";
    }

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
    if (category === 'Labor' || (expenseType === 'company' && (companyExpenseType === 'Company Labor' || category === 'Company Labor'))) {
      finalDescription = workDescription.trim();
    } else if (category === 'Material') {
      finalDescription = description.trim() || `Material expense - ${expenseDate}`;
    } else if ((category === 'Company Expense' || category === 'Salary') && companyExpenseType === 'Salary') {
      const emp = employees.find(emp => emp.id === selectedEmployeeForSalary);
      finalDescription = `Salary payment${emp ? ' for ' + emp.fullName : ''} - ${expenseDate}`;
    } else if (category === 'Taxi/Xamaal' || companyExpenseType === 'Taxi/Xamaal') {
      finalDescription = description || `Taxi/Xamaal - ${taxiXamaalType}`;
    } else if (category === 'Company Expense' && companyExpenseType === 'Office Rent') {
      finalDescription = `Office Rent - ${officeRentPeriod || 'Monthly'} - ${expenseDate}`;
    } else if (category === 'Company Expense' && companyExpenseType === 'Electricity') {
      finalDescription = `Electricity - Meter Reading: ${electricityMeterReading || 'N/A'} - ${expenseDate}`;
    } else if (category === 'Company Expense' && companyExpenseType === 'Marketing') {
      finalDescription = `Marketing - ${marketingCampaignName || 'Campaign'} - ${expenseDate}`;
    } else if (category === 'Company Expense' && companyExpenseType === 'Utilities') {
      finalDescription = description.trim() || `Utilities - ${expenseDate}`;
    } else if (category === 'Company Expense') {
      finalDescription = description.trim() || '';
    } else {
      finalDescription = description.trim() || category;
    }

    let expenseData: any = {
      category: category || undefined,
      paidFrom: paidFrom || undefined,
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      note: note ? note.trim() : undefined,
      projectId: expenseType === 'project' ? (selectedProject || undefined) : undefined,
      description: finalDescription || undefined,
      amount: category === 'Material' ? totalMaterialCost : (category === 'Company Labor' || companyExpenseType === 'Company Labor' ? laborPaidAmount : amount),
      materials: category === 'Material' ? materials.map(({ id, ...rest }) => rest) : undefined,
      materialDate: category === 'Material' ? materialDate : undefined,
      transportType: (category === 'Taxi/Xamaal' || companyExpenseType === 'Taxi/Xamaal') ? taxiXamaalType : (transportType || undefined),
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
      // Company Labor fields
      employeeId: (companyExpenseType === 'Company Labor' || category === 'Company Labor') ? selectedEmployeeForSalary : undefined,
      agreedWage: (companyExpenseType === 'Company Labor' || category === 'Company Labor') ? wage : undefined,
      laborPaidAmount: (companyExpenseType === 'Company Labor' || category === 'Company Labor') ? laborPaidAmount : undefined,
      // Other company expense fields
      officeRentPeriod: companyExpenseType === 'Office Rent' ? officeRentPeriod : undefined,
      electricityMeterReading: companyExpenseType === 'Electricity' ? electricityMeterReading : undefined,
      marketingCampaignName: companyExpenseType === 'Marketing' ? marketingCampaignName : undefined,
      // Material fields
      selectedVendor: (companyExpenseType === 'Material' || category === 'Material') && expenseType === 'company' ? selectedVendor : undefined,
      paymentStatus: (companyExpenseType === 'Material' || category === 'Material') ? paymentStatus : undefined,
      invoiceNumber: (companyExpenseType === 'Material' || category === 'Material') ? invoiceNumber : undefined,
      vendorId: (companyExpenseType === 'Material' || category === 'Material') ? selectedVendor : undefined,
      paidAmount: (companyExpenseType === 'Material' || category === 'Material') ?
        (paymentStatus === 'PAID' ? totalMaterialCost : (paymentStatus === 'PARTIAL' ? laborPaidAmount : 0))
        : undefined,
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
    { value: 'Company Labor', label: 'Shaqaale (Shirkad)', icon: Users },
    { value: 'Office Rent', label: 'Kirada Xafiiska', icon: Building },
    { value: 'Electricity', label: 'Koronto', icon: Info },
    { value: 'Utilities', label: 'Adeegyada Guud', icon: Home },
    { value: 'Marketing', label: 'Suuqgeyn', icon: DollarSign },
    { value: 'Material', label: 'Alaab (Kharashka Shirkadda)', icon: Package },
    { value: 'Taxi/Xamaal', label: 'Taxi/Xamaal (Shirkad)', icon: Truck },
    { value: 'Maintenance & Repairs', label: 'Dayactirka iyo Hagaajinta', icon: Info },
    { value: 'Travel & Accommodation', label: 'Socodka iyo Hoyga', icon: Home },
    { value: 'Debt', label: 'Deyn (Macmiilka La Siiyay)', icon: Coins },
    { value: 'Other', label: 'Kale', icon: Info },
  ];

  // Helper to check if Company Labor form should be shown
  const showCompanyLaborForm = category === 'Company Labor' || (category === 'Company Expense' && companyExpenseType === 'Company Labor');

  // Helper to check if Taxi/Xamaal form should be shown
  const showTaxiXamaalForm = category === 'Taxi/Xamaal' || (category === 'Company Expense' && companyExpenseType === 'Taxi/Xamaal');

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
                <input type="date" id="expenseDate" required value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha (ETB) <span className="text-redError">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray" size={20} />
                <input type="number" id="amount" required value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || '')} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
              </div>
            </div>
          </div>

          <hr className="dark:border-gray-600" />

          {/* Material Form */}
          {category === 'Material' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300">Faahfaahinta Alaabta</h3>

              <MaterialExpenseForm
                materials={materials}
                setMaterials={setMaterials}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                paidAmount={typeof laborPaidAmount === 'number' ? laborPaidAmount : ''}
                setPaidAmount={(val) => setLaborPaidAmount(val)}
                expenseDate={materialDate}
                setExpenseDate={setMaterialDate}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
                totalAmount={totalMaterialCost}
                setTotalAmount={(val) => setAmount(val)}
                setReceiptImage={setReceiptImage}
                errors={validationErrors}
              />
            </div>
          )}

          {/* Transport Form */}
          {category === 'Transport' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300">Faahfaahinta Gaadiidka</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="transportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nooca Gaadiidka</label>
                  <input type="text" id="transportType" value={transportType} onChange={(e) => setTransportType(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="e.g., Toyota Hilux" title="Nooca Gaadiidka" />
                </div>
                <div>
                  <label htmlFor="transportAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qiimaha (ETB)</label>
                  <input type="number" id="transportAmount" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || '')} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Qiimaha Gaadiidka" />
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
                  <input type="text" id="consultantName" value={consultantName} onChange={(e) => setConsultantName(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Magaca La-taliye" />
                </div>
                <div>
                  <label htmlFor="consultancyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nooca La-taliinta</label>
                  <input type="text" id="consultancyType" value={consultancyType} onChange={(e) => setConsultancyType(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Nooca La-taliinta" />
                </div>
                <div>
                  <label htmlFor="consultancyFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qiimaha (ETB)</label>
                  <input type="number" id="consultancyFee" value={consultancyFee} onChange={(e) => setConsultancyFee(parseFloat(e.target.value) || '')} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Qiimaha La-taliinta" />
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
                  <input type="text" id="equipmentName" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Magaca Qalabka" />
                </div>
                <div>
                  <label htmlFor="rentalPeriod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Muddada Kirada</label>
                  <input type="text" id="rentalPeriod" value={rentalPeriod} onChange={(e) => setRentalPeriod(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Muddada Kirada" />
                </div>
                <div>
                  <label htmlFor="rentalFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qiimaha Kirada (ETB)</label>
                  <input type="number" id="rentalFee" value={rentalFee} onChange={(e) => setRentalFee(parseFloat(e.target.value) || '')} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Qiimaha Kirada" />
                </div>
                <div>
                  <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Magaca Bixiyaha</label>
                  <input type="text" id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" title="Magaca Bixiyaha" />
                </div>
              </div>
            </div>
          )}

          {/* Company Expense Forms - Only show selector if category is Company Expense, NOT for direct categories like Taxi/Xamaal */}
          {category === 'Company Expense' && expenseType === 'company' && companyExpenseType !== 'Taxi/Xamaal' && companyExpenseType !== 'Company Labor' && companyExpenseType !== 'Material' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Kharashka Shirkadda</h3>
              <div>
                <label htmlFor="companyExpenseType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Kharashka Shirkadda <span className="text-redError">*</span></label>
                <select
                  id="companyExpenseType"
                  required
                  value={companyExpenseType || ''}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    setCompanyExpenseType(selectedValue);
                  }}
                  className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.companyExpenseType ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Nooca Kharashka Shirkadda --</option>
                  {companyExpenseCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                {validationErrors.companyExpenseType && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{validationErrors.companyExpenseType}</p>}
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

              {/* Company Labor Specific Fields - Only show if inside Company Expense selector OR if category is directly Company Labor */}
              {showCompanyLaborForm && (
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                  <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Shaqaalaha Shirkadda</h3>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Shaqaale <span className="text-redError">*</span></label>
                    <select value={selectedEmployeeForSalary} onChange={e => setSelectedEmployeeForSalary(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required title="Dooro Shaqaale">
                      <option value="">-- Dooro Shaqaale --</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName || emp.name}</option>)}
                    </select>
                    {validationErrors.selectedEmployeeForSalary && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.selectedEmployeeForSalary}</p>}
                  </div>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mushaharka La Ogolaaday (Agreed)</label>
                    {previousWageInfo ? (
                      <>
                        <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-sm text-blue-800 dark:text-blue-300">
                            <div className="flex justify-between">
                              <span>Mushaharka Hore:</span>
                              <span className="font-medium">{previousWageInfo.agreedWage.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Lacagta La Bixiyay:</span>
                              <span className="font-medium">{previousWageInfo.totalPaid.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex justify-between border-t border-blue-300 dark:border-blue-700 pt-1 mt-1">
                              <span className="font-medium">Inta Dhiman (Remaining):</span>
                              <span className="font-bold text-red-600 dark:text-red-400">{previousWageInfo.remaining.toLocaleString()} ETB</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-mediumGray dark:text-gray-400 mb-1">Agreed (readonly)</label>
                            <input type="number" value={previousWageInfo.agreedWage} readOnly className="w-full p-3 border rounded-lg bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-gray-300 border-lightGray dark:border-gray-700" />
                          </div>
                          <div>
                            <label className="block text-sm text-mediumGray dark:text-gray-400 mb-1">Remaining (before payment)</label>
                            <input type="number" value={previousWageInfo.remaining} readOnly className="w-full p-3 border rounded-lg bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-gray-300 border-lightGray dark:border-gray-700" />
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Heshiis jira ayaa la bixinayaa; mushaharka lama beddeli karo halkan.</p>
                        {previousWageInfo && (
                          <div className="mt-3 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                            <label className="inline-flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                              <input
                                type="checkbox"
                                checked={Boolean((window as any)._startNewAgreement || false)}
                                onChange={e => {
                                  (window as any)._startNewAgreement = e.target.checked;
                                  if (e.target.checked) {
                                    setWage('');
                                  }
                                  setLaborPaidAmount(laborPaidAmount as any);
                                }}
                              />
                              Bilow heshiis cusub shirkadan (enter Agreed hoose)
                            </label>
                            {Boolean((window as any)._startNewAgreement || false) && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Agreed cusub (ETB) <span className="text-redError">*</span></label>
                                <input
                                  type="number"
                                  value={wage}
                                  onChange={e => setWage(parseFloat(e.target.value) || '')}
                                  className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 ${validationErrors.wage ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                                  placeholder="Geli mushaharka la isku raacay"
                                  min={0}
                                  step="any"
                                  required
                                />
                                <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">Heshiis cusub ayaa la abuurayaa—kan hore waa la dhammeeyay.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={wage}
                          onChange={e => setWage(parseFloat(e.target.value) || '')}
                          className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 ${validationErrors.wage ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                          required
                          placeholder="Mushaharka (Agreed Wage)"
                          min={0}
                          step="any"
                        />
                        <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">Tani waxay abuurtaa heshiis cusub haddii uusan jirin mid hore.</p>
                      </>
                    )}
                    {validationErrors.wage && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.wage}</p>}
                  </div>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Lacagta Hadda La Bixiyay ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      value={laborPaidAmount}
                      onChange={e => setLaborPaidAmount(parseFloat(e.target.value) || '')}
                      className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 ${validationErrors.laborPaidAmount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                      required
                      placeholder="Lacagta la bixiyay"
                      min={0}
                      step="any"
                      {...(previousWageInfo && !(window as any)._startNewAgreement ? { max: previousWageInfo.remaining } : {})}
                    />
                    {previousWageInfo && typeof laborPaidAmount === 'number' && (
                      <p className="text-xs mt-1 text-mediumGray dark:text-gray-400">
                        Ka dib bixintan: <span className="font-semibold">{Math.max(0, previousWageInfo.remaining - (laborPaidAmount || 0)).toLocaleString()} ETB</span> ayaa hadhay.
                      </p>
                    )}
                    {validationErrors.laborPaidAmount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.laborPaidAmount}</p>}
                  </div>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sharaxaadda Shaqada</label>
                    <input type="text" value={workDescription} onChange={e => setWorkDescription(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" placeholder="Sharaxaadda Shaqada" title="Sharaxaadda Shaqada" />
                    {validationErrors.workDescription && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.workDescription}</p>}
                  </div>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Shaqada</label>
                    <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" title="Taariikhda Shaqada" />
                  </div>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <select value={paidFrom} onChange={e => setPaidFrom(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required title="Dooro Akoonka">
                      <option value="">-- Dooro Akoonka --</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                    {validationErrors.paidFrom && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.paidFrom}</p>}
                  </div>
                </div>
              )}

              {/* Taxi/Xamaal Form - Only show if inside Company Expense selector OR if category is directly Taxi/Xamaal */}
              {showTaxiXamaalForm && (
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                  <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">
                    {(expenseType as 'project' | 'company') === 'project' ? 'Faahfaahinta Taxi/Xamaal Mashruuca' : 'Faahfaahinta Taxi/Xamaal Shirkadda'}
                  </h3>

                  <div className="mb-4">
                    <label htmlFor="taxiXamaalType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca *</label>
                    <select
                      id="taxiXamaalType"
                      value={taxiXamaalType}
                      onChange={e => setTaxiXamaalType(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">-- Dooro Taxi ama Xamaal --</option>
                      <option value="Taxi">Taxi</option>
                      <option value="Xamaal">Xamaal</option>
                    </select>
                    {validationErrors.taxiXamaalType && (
                      <span className="text-red-500 text-sm mt-1 block">{validationErrors.taxiXamaalType}</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="amount_taxi" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha ($) *</label>
                    <input
                      type="number"
                      id="amount_taxi"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Tusaale: 50.00"
                      required
                      min={0}
                      step="any"
                    />
                    {validationErrors.amount && (
                      <span className="text-red-500 text-sm mt-1 block">{validationErrors.amount}</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description_taxi" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Faahfaahinta (Optional)</label>
                    <input
                      type="text"
                      id="description_taxi"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Tusaale: Socodka goobta alaabta"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="paidFrom_taxi" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Akoonka Laga Jarayo *</label>
                    <select
                      id="paidFrom_taxi"
                      value={paidFrom}
                      onChange={e => setPaidFrom(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">-- Dooro Akoonka --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                    {validationErrors.paidFrom && (
                      <span className="text-red-500 text-sm mt-1 block">{validationErrors.paidFrom}</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="expenseDate_taxi" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Kharashka *</label>
                    <input
                      type="date"
                      id="expenseDate_taxi"
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    {validationErrors.expenseDate && (
                      <span className="text-red-500 text-sm mt-1 block">{validationErrors.expenseDate}</span>
                    )}
                  </div>

                  {(expenseType as 'project' | 'company') === 'project' && (
                    <div className="mb-4">
                      <label htmlFor="selectedProject_taxi" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuca La Xiriira (Optional)</label>
                      <select
                        id="selectedProject_taxi"
                        value={selectedProject}
                        onChange={e => setSelectedProject(e.target.value)}
                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Dooro Mashruuc (Optional) --</option>
                        {projects.map(proj => (
                          <option key={proj.id} value={proj.id}>{proj.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="note_taxi" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
                    <textarea
                      id="note_taxi"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={2}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Wixii faahfaahin dheeraad ah..."
                    />
                  </div>
                </div>
              )}

              {/* Office Rent Specific Fields */}
              {companyExpenseType === 'Office Rent' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Kirada Xafiiska</h4>
                  {/* PaidFrom field inside Office Rent */}
                  <div className="md:col-span-2">
                    <label htmlFor="paidFrom_officerent" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_officerent"
                        required
                        value={paidFrom}
                        onChange={(e) => setPaidFrom(e.target.value)}
                        className={`w-full p-2 pl-8 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.paidFrom ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                      >
                        <option value="">-- Dooro Akoonka --</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} {acc.balance !== undefined ? `($${Number(acc.balance).toLocaleString()})` : ''}</option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                    </div>
                    {validationErrors.paidFrom && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.paidFrom}</p>}
                  </div>
                  <div>
                    <label htmlFor="officeRentAmount" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha Kirada ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="officeRentAmount"
                      required
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 1500"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
                  </div>
                  <div>
                    <label htmlFor="officeRentPeriod" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Muddada Kirada <span className="text-redError">*</span></label>
                    <select
                      id="officeRentPeriod"
                      required
                      value={officeRentPeriod}
                      onChange={(e) => setOfficeRentPeriod(e.target.value)}
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${validationErrors.officeRentPeriod ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    >
                      <option value="">-- Dooro Muddada --</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                    {validationErrors.officeRentPeriod && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.officeRentPeriod}</p>}
                  </div>
                </div>
              )}

              {/* Electricity Specific Fields */}
              {companyExpenseType === 'Electricity' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Korontada</h4>
                  {/* PaidFrom field inside Electricity */}
                  <div className="md:col-span-2">
                    <label htmlFor="paidFrom_electricity" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_electricity"
                        required
                        value={paidFrom}
                        onChange={(e) => setPaidFrom(e.target.value)}
                        className={`w-full p-2 pl-8 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.paidFrom ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                      >
                        <option value="">-- Dooro Akoonka --</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} {acc.balance !== undefined ? `($${Number(acc.balance).toLocaleString()})` : ''}</option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                    </div>
                    {validationErrors.paidFrom && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.paidFrom}</p>}
                  </div>
                  <div>
                    <label htmlFor="electricityAmount" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha Korontada ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="electricityAmount"
                      required
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 500"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
                  </div>
                  <div>
                    <label htmlFor="electricityMeterReading" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akhriska Mitirka <span className="text-redError">*</span></label>
                    <input
                      type="text"
                      id="electricityMeterReading"
                      required
                      value={electricityMeterReading}
                      onChange={(e) => setElectricityMeterReading(e.target.value)}
                      placeholder="Tusaale: 12345"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.electricityMeterReading ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.electricityMeterReading && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.electricityMeterReading}</p>}
                  </div>
                </div>
              )}

              {/* Marketing Specific Fields */}
              {companyExpenseType === 'Marketing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Suuqgeynta</h4>
                  {/* PaidFrom field inside Marketing */}
                  <div className="md:col-span-2">
                    <label htmlFor="paidFrom_marketing" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_marketing"
                        required
                        value={paidFrom}
                        onChange={(e) => setPaidFrom(e.target.value)}
                        className={`w-full p-2 pl-8 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.paidFrom ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                      >
                        <option value="">-- Dooro Akoonka --</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} {acc.balance !== undefined ? `($${Number(acc.balance).toLocaleString()})` : ''}</option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                    </div>
                    {validationErrors.paidFrom && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.paidFrom}</p>}
                  </div>
                  <div>
                    <label htmlFor="marketingCampaignName" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Magaca Ololaha <span className="text-redError">*</span></label>
                    <input
                      type="text"
                      id="marketingCampaignName"
                      required
                      value={marketingCampaignName}
                      onChange={(e) => setMarketingCampaignName(e.target.value)}
                      placeholder="Tusaale: Summer Sale Campaign"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.marketingCampaignName ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.marketingCampaignName && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.marketingCampaignName}</p>}
                  </div>
                  <div>
                    <label htmlFor="marketingAmount" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha Ololaha ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="marketingAmount"
                      required
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 1000"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
                  </div>
                </div>
              )}

              {/* Utilities (Adeegyada Guud) General Service Form */}
              {companyExpenseType === 'Utilities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Adeegyada Guud</h4>
                  <div className="md:col-span-2">
                    <label htmlFor="paidFrom_utilities" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_utilities"
                        required
                        value={paidFrom}
                        onChange={(e) => setPaidFrom(e.target.value)}
                        className={`w-full p-2 pl-8 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.paidFrom ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                      >
                        <option value="">-- Dooro Akoonka --</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} {acc.balance !== undefined ? `($${Number(acc.balance).toLocaleString()})` : ''}</option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                    </div>
                    {validationErrors.paidFrom && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.paidFrom}</p>}
                  </div>
                  <div>
                    <label htmlFor="utilitiesAmount" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha Adeegga ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="utilitiesAmount"
                      required
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 100"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="utilitiesDescription" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Faahfaahinta Adeegga <span className="text-redError">*</span></label>
                    <input
                      type="text"
                      id="utilitiesDescription"
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Tusaale: Internet, Biyaha, Telefoon, iwm"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.description ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.description && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.description}</p>}
                  </div>
                  <div>
                    <label htmlFor="utilitiesDate" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Taariikhda Kharashka <span className="text-redError">*</span></label>
                    <input
                      type="date"
                      id="utilitiesDate"
                      required
                      value={expenseDate}
                      onChange={e => setExpenseDate(e.target.value)}
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.expenseDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.expenseDate && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.expenseDate}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="utilitiesNote" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Fiiro Gaar Ah (Optional)</label>
                    <textarea
                      id="utilitiesNote"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={2}
                      placeholder="Wixii faahfaahin dheeraad ah ee adeegga..."
                      className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Categories */}
          {category !== 'Material' && category !== 'Transport' && category !== 'Consultancy' && category !== 'Equipment Rental' && category !== 'Company Expense' && category !== 'Company Labor' && category !== 'Taxi/Xamaal' && (
            <div>
              <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha (ETB)</label>
              <input type="number" id="amount" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || '')} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
          )}

          <hr className="dark:border-gray-600" />

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
