// app/expenses/add/page.tsx - Add Expense Page (10000% Design with Dynamic Forms & OCR Placeholder)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  X, DollarSign, Tag, Calendar, MessageSquare, FileUp, Camera, Upload,
  Info, ReceiptText, Briefcase, Users, HardHat, Truck, Home, CreditCard, Clock, Plus, Loader2, CheckCircle, XCircle, ChevronRight, ArrowLeft,
  Package, MinusCircle, Building, User, Coins // Added new icons for Company Expense types
} from 'lucide-react';
import Toast from '@/components/common/Toast'; // Reuse Toast component
import { calculateEmployeeSalary } from '@/lib/utils';
import { MaterialExpenseForm, MaterialItem } from '@/components/expenses/MaterialExpenseForm';


function AddExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Expense type: 'project' or 'company'
  // Description field for company material expense
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState<'project' | 'company'>('company');
  const [category, setCategory] = useState(''); // For project expense
  // Subcategory for project expenses (Labor, etc)
  const [subCategory, setSubCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Common fields for all expense types
  const [amount, setAmount] = useState<number | ''>(''); // This will be conditionally rendered/calculated
  const [paidFrom, setPaidFrom] = useState('Cash');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Specific fields for different categories
  const [materials, setMaterials] = useState<MaterialItem[]>([{ id: 1, name: '', qty: '', price: '', unit: 'pcs' }]);
  // Material date tracking
  const [materialDate, setMaterialDate] = useState(new Date().toISOString().split('T')[0]);
  // REMOVED: employeeName, use selectedEmployeeForSalary for project labor
  const [workDescription, setWorkDescription] = useState('');

  // NEW: Vendor payment tracking fields
  const [selectedVendor, setSelectedVendor] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID'); // PAID, UNPAID
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [wage, setWage] = useState<number | ''>('');
  const [laborPaidAmount, setLaborPaidAmount] = useState<number | ''>('');
  const [transportType, setTransportType] = useState('');
  const [taxiXamaalType, setTaxiXamaalType] = useState(''); // 'Taxi' or 'Xamaal' 

  // Company Expense specific fields (now includes Debt/Repayment)
  const [companyExpenseType, setCompanyExpenseType] = useState('');
  // Salary specific fields
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState('');
  const [salaryPaymentAmount, setSalaryPaymentAmount] = useState<number | ''>('');
  const [partialPaidAmount, setPartialPaidAmount] = useState<number | string>(''); // Support string for decimal typing
  const [salaryPaymentDate, setSalaryPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Project labor wage tracking
  const [previousWageInfo, setPreviousWageInfo] = useState<{
    agreedWage: number;
    totalPaid: number;
    remaining: number;
  } | null>(null);
  // Office Rent specific fields
  const [officeRentPeriod, setOfficeRentPeriod] = useState(''); // e.g., 'Monthly', 'Quarterly'
  // Electricity specific fields
  const [electricityMeterReading, setElectricityMeterReading] = useState('');
  // Marketing specific fields
  const [marketingCampaignName, setMarketingCampaignName] = useState('');
  // Debt specific fields (now under Company Expense)
  const [lenderName, setLenderName] = useState('');
  const [loanDate, setLoanDate] = useState('');


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
  const [fuelStation, setFuelStation] = useState('');
  const [odometerReading, setOdometerReading] = useState<number | ''>('');
  const [fuelPurpose, setFuelPurpose] = useState('');

  const [receiptImage, setReceiptImage] = useState<File | null>(null);

  // Dynamic data from API
  const [projects, setProjects] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]); // All customers for Debt (lending)
  const [vendors, setVendors] = useState<any[]>([]); // NEW: For vendor payment tracking
  const [projectLabors, setProjectLabors] = useState<any[]>([]);
  const [companyLabors, setCompanyLabors] = useState<any[]>([]);
  const paidFromOptions = ['Cash', 'CBE', 'Ebirr'];

  // Fetch project labor records for wage tracking
  const fetchProjectLabors = async () => {
    try {
      const res = await fetch('/api/project-labors');
      if (res.ok) {
        const data = await res.json();
        setProjectLabors(data.projectLabors || []);
      }
    } catch (error) {
      console.error('Error fetching project labors:', error);
    }
  };

  // Fetch company labor records for wage tracking
  const fetchCompanyLabors = async () => {
    try {
      const res = await fetch('/api/company-labors');
      if (res.ok) {
        const data = await res.json();
        setCompanyLabors(data.companyLabors || []);
      }
    } catch (error) {
      console.error('Error fetching company labors:', error);
    }
  };
  // Project expense categories: used when expenseType === 'project'
  const projectExpenseCategories = [
    { value: '', label: '-- Dooro Nooca Kharashka Mashruuca --' },
    { value: 'Material', label: 'Alaab (Mashruuc)' },
    { value: 'Labor', label: 'Shaqaale (Mashruuc)' },
    { value: 'Transport', label: 'Transport (Mashruuc)' },
    { value: 'Taxi/Xamaal', label: 'Taxi/Xamaal (Mashruuc)' },
    { value: 'Consultancy', label: 'La-talin (Mashruuc)' },
    { value: 'Equipment Rental', label: 'Kirada Qalabka (Mashruuc)' },
    { value: 'Utilities', label: 'Adeegyada Guud (Mashruuc)' },
  ];
  // Equipment Rental fields
  const [equipmentName, setEquipmentName] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState('');
  const [rentalFee, setRentalFee] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');

  // Consultancy fields
  const [consultantName, setConsultantName] = useState('');
  const [consultancyType, setConsultancyType] = useState('');
  const [consultancyFee, setConsultancyFee] = useState('');
  // Company expense categories: used when expenseType === 'company'
  const companyExpenseCategories = [
    { value: '', label: '-- Dooro Nooca Kharashka Shirkadda --' },
    { value: 'Salary', label: 'Mushahar' },
    { value: 'Company Labor', label: 'Shaqaale (Shirkad)' },
    { value: 'Office Rent', label: 'Kirada Xafiiska' },
    { value: 'Electricity', label: 'Koronto' },
    { value: 'Utilities', label: 'Adeegyada Guud' },
    { value: 'Marketing', label: 'Suuqgeyn' },
    { value: 'Material', label: 'Alaab (Kharashka Shirkadda)' },
    { value: 'Taxi/Xamaal', label: 'Taxi/Xamaal (Shirkad)' },
    { value: 'Maintenance & Repairs', label: 'Dayactirka iyo Hagaajinta' },
    { value: 'Travel & Accommodation', label: 'Socodka iyo Hoyga' },
    { value: 'Debt', label: 'Deyn (Macmiilka La Siiyay)' },
    { value: 'Other', label: 'Kale' },
  ];
  const materialUnits = ['pcs', 'sq ft', 'sq m', 'Liter', 'kg', 'box', 'm'];
  const officeRentPeriods = ['Monthly', 'Quarterly', 'Annually'];

  // Dropdown options for new subcategories
  const repairTypes = [
    { value: '', label: '-- Dooro Nooca Dayactirka --' },
    { value: 'Preventive', label: 'Dayactirka Hore' },
    { value: 'Corrective', label: 'Dayactirka Hagaajinta' },
    { value: 'Emergency', label: 'Dayactirka Degdegga ah' },
    { value: 'Upgrade', label: 'Horumar' },
    { value: 'Other', label: 'Kale' }
  ];

  const insuranceTypes = [
    { value: '', label: '-- Dooro Nooca Kafsan --' },
    { value: 'Liability', label: 'Mas\'uliyadda' },
    { value: 'Property', label: 'Hantida' },
    { value: 'Health', label: 'Caafimaadka' },
    { value: 'Vehicle', label: 'Gaadiidka' },
    { value: 'Professional', label: 'Xirfadeed' },
    { value: 'Other', label: 'Kale' }
  ];

  const legalServiceTypes = [
    { value: '', label: '-- Dooro Nooca Adeegga Sharciga --' },
    { value: 'Contracts', label: 'Qandaraasyada' },
    { value: 'Compliance', label: 'Raacista' },
    { value: 'Litigation', label: 'Dacwadaha' },
    { value: 'Corporate', label: 'Shirkadda' },
    { value: 'Employment', label: 'Shaqaalaha' },
    { value: 'Other', label: 'Kale' }
  ];

  const travelPurposes = [
    { value: '', label: '-- Dooro Ujeedka Socodka --' },
    { value: 'Business Meeting', label: 'Kulanka Ganacsiga' },
    { value: 'Conference', label: 'Shirka' },
    { value: 'Training', label: 'Tababarka' },
    { value: 'Client Visit', label: 'Boogashada Macmiilka' },
    { value: 'Site Inspection', label: 'Baaritaanka Goobta' },
    { value: 'Other', label: 'Kale' }
  ];

  // Vehicle and Fuel options
  const vehicleOptions = [
    { value: '', label: '-- Dooro Gaadhiga --' },
    { value: 'company_car_1', label: 'Gaadhiga Shirkadda 1' },
    { value: 'company_car_2', label: 'Gaadhiga Shirkadda 2' },
    { value: 'delivery_van', label: 'Baabuurka Gaarsiinta' },
    { value: 'truck', label: 'Baabuurka Weyn' },
    { value: 'motorcycle', label: 'Baaskiilka' },
    { value: 'other', label: 'Kale' }
  ];

  const fuelTypes = [
    { value: '', label: '-- Dooro Nooca Shidaalka --' },
    { value: 'Petrol', label: 'Petrol' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Gas', label: 'Gas' },
    { value: 'Electric', label: 'Koronto' },
    { value: 'Hybrid', label: 'Isdhexgalka' }
  ];

  const fuelPurposes = [
    { value: '', label: '-- Dooro Ujeedka Shidaalka --' },
    { value: 'Business Travel', label: 'Socodka Ganacsiga' },
    { value: 'Delivery', label: 'Gaarsiinta' },
    { value: 'Site Visit', label: 'Boogashada Goobta' },
    { value: 'Client Meeting', label: 'Kulanka Macmiilka' },
    { value: 'Maintenance', label: 'Dayactirka' },
    { value: 'Other', label: 'Kale' }
  ];

  // Read query parameters and set initial values
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    const categoryParam = searchParams.get('category');
    const employeeId = searchParams.get('employeeId');

    if (projectId) {
      setSelectedProject(projectId);
      setExpenseType('project');
    }

    if (categoryParam) {
      setCategory(categoryParam);
    }

    if (employeeId && categoryParam === 'Labor') {
      setSelectedEmployeeForSalary(employeeId);
    }
  }, [searchParams]);

  // Fetch options from API
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects || []));
    fetch('/api/accounting/accounts')
      .then(res => res.json())
      .then(data => setAccounts(data.accounts || []));
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data.employees || []));
    // Fetch all customers for Debt
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        console.log('Customers fetched:', data);
        // For Debt (lending), use all customers
        setAllCustomers(data.customers || []);
      })
      .catch(error => {
        console.error('Error fetching customers:', error);
      });

    // Fetch vendors for Material expenses
    fetch('/api/vendors')
      .then(res => res.json())
      .then(data => {
        console.log('Vendors fetched:', data);
        setVendors(data.vendors || []);
      })
      .catch(error => {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      });
    fetchProjectLabors();
    fetchCompanyLabors();
  }, []);

  // --- Calculations ---
  const totalMaterialCost = materials.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    return sum + (qty * price);
  }, 0);

  // Auto-fill wage information when employee and project are selected (for project labor)
  useEffect(() => {
    if (selectedEmployeeForSalary && selectedProject && category === 'Labor') {
      // Find previous labor records for this employee and project
      const previousRecords = projectLabors.filter(labor =>
        labor.employeeId === selectedEmployeeForSalary &&
        labor.projectId === selectedProject
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

        // Auto-fill the wage field with remaining amount
        if (remaining > 0) {
          setWage(remaining);
        } else {
          setWage('');
        }
      } else {
        // No previous records, clear wage info
        setPreviousWageInfo(null);
        setWage('');
      }
    } else {
      setPreviousWageInfo(null);
    }
  }, [selectedEmployeeForSalary, selectedProject, category, projectLabors]);

  // Auto-fill wage information when employee is selected (for company labor)
  useEffect(() => {
    if (selectedEmployeeForSalary && expenseType === 'company' && companyExpenseType === 'Company Labor') {
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

        // Auto-fill the wage field with remaining amount
        if (remaining > 0) {
          setWage(remaining);
        } else {
          setWage('');
        }
      } else {
        // No previous records, clear wage info
        setPreviousWageInfo(null);
        setWage('');
      }
    } else if (expenseType === 'company' && companyExpenseType === 'Company Labor') {
      setPreviousWageInfo(null);
    }
  }, [selectedEmployeeForSalary, expenseType, companyExpenseType, companyLabors]);

  const laborRemainingAmount = (typeof wage === 'number' ? wage : 0) - (typeof laborPaidAmount === 'number' ? laborPaidAmount : 0);

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployeeForSalary);

  // Calculate total salary owed based on months worked up to the payment date
  const salaryCalculation = selectedEmployeeData && selectedEmployeeData.monthlySalary ?
    calculateEmployeeSalary(
      Number(selectedEmployeeData.monthlySalary),
      selectedEmployeeData.startDate,
      salaryPaymentDate, // Use the salary payment date as the calculation date
      Number(selectedEmployeeData.salaryPaidThisMonth || 0)
    ) : null;

  const currentSalaryRemaining = salaryCalculation ? salaryCalculation.remainingSalary : 0;
  const newSalaryRemaining = currentSalaryRemaining - (typeof salaryPaymentAmount === 'number' ? salaryPaymentAmount : 0);

  // Calculations for new subcategories
  const totalPartsCost = partsUsed.reduce((sum, part) => {
    const cost = parseFloat(part.cost as string) || 0;
    return sum + cost;
  }, 0);

  const totalLaborCost = (typeof laborHours === 'number' ? laborHours : 0) * (typeof hourlyRate === 'number' ? hourlyRate : 0);
  const totalMaintenanceCost = totalPartsCost + totalLaborCost;

  const totalLegalCost = (typeof hoursBilled === 'number' ? hoursBilled : 0) * (typeof legalHourlyRate === 'number' ? legalHourlyRate : 0) + (typeof additionalCosts === 'number' ? additionalCosts : 0);

  const totalTravelCost = (typeof transportationCost === 'number' ? transportationCost : 0) +
    (typeof accommodationCost === 'number' ? accommodationCost : 0) +
    (typeof mealsCost === 'number' ? mealsCost : 0) +
    (typeof otherTravelCosts === 'number' ? otherTravelCosts : 0);

  // Fuel cost calculation
  const totalFuelCost = (typeof fuelQuantity === 'number' ? fuelQuantity : 0) * (typeof fuelPricePerLiter === 'number' ? fuelPricePerLiter : 0);


  // --- Validation Logic ---
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!category || typeof category !== 'string' || category.trim() === '') {
      errors.category = 'Fadlan dooro nooca kharashka.';
    } else if (expenseType === 'project' && category === 'Labor' && category !== 'Labor') {
      errors.category = 'Nooca kharashka waa inuu noqdaa Labor.';
    }

    if (!paidFrom) errors.paidFrom = 'Akoonka lacagta laga bixiyay waa waajib.';
    if (!expenseDate) errors.expenseDate = 'Taariikhda kharashka waa waajib.';
    // Project expenseType: projectId is required
    if (expenseType === 'project' && (!selectedProject || selectedProject === '')) {
      errors.selectedProject = 'Fadlan dooro mashruuca.';
    }

    // Amount validation: only for categories that require it directly
    if (category === 'Consultancy') {
      if (typeof consultancyFee !== 'string' || isNaN(Number(consultancyFee)) || Number(consultancyFee) <= 0) {
        errors.consultancyFee = 'Qiimaha la-talin waa inuu noqdaa nambar wanaagsan.';
      }
    } else if (category === 'Equipment Rental') {
      if (!equipmentName.trim()) errors.equipmentName = 'Magaca qalabka waa waajib.';
      if (!rentalPeriod.trim()) errors.rentalPeriod = 'Muddada kirada waa waajib.';
      if (typeof rentalFee !== 'string' || isNaN(Number(rentalFee)) || Number(rentalFee) <= 0) errors.rentalFee = 'Lacagta kirada waa inuu noqdaa nambar wanaagsan.';
      if (!supplierName.trim()) errors.supplierName = 'Magaca kiriyaha waa waajib.';
      if (!selectedProject) errors.selectedProject = 'Mashruuca waa waajib.';
      if (!selectedBankAccount) errors.selectedBankAccount = 'Bank account waa waajib.';
    } else if (category === 'Utilities' && expenseType === 'project') {
      if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
      if (!description.trim()) errors.description = 'Faahfaahinta adeegga waa waajib.';
    } else {
      const requiresCommonAmount = !['Material', 'Labor', 'Company Expense', 'Company Labor', 'Taxi/Xamaal'].includes(category);
      if (requiresCommonAmount && (typeof amount !== 'number' || amount <= 0)) {
        errors.amount = 'Qiimaha waa inuu noqdaa nambar wanaagsan.';
      }
    }

    switch (category) {
      case 'Material':
        if (materials.length === 0) { errors.materials = 'Fadlan ku dar ugu yaraan hal alaab.'; }
        materials.forEach((mat, index) => {
          if (!mat.name.trim()) errors[`materialName_${index}`] = 'Magaca alaabta waa waajib.';
          if (typeof parseFloat(mat.qty as string) !== 'number' || parseFloat(mat.qty as string) <= 0) errors[`materialQty_${index}`] = 'Quantity waa inuu noqdaa nambar wanaagsan.';
          if (typeof parseFloat(mat.price as string) !== 'number' || parseFloat(mat.price as string) <= 0) errors[`materialPrice_${index}`] = 'Qiimaha waa inuu noqdaa nambar wanaagsan.';
          if (!mat.unit) errors[`materialUnit_${index}`] = 'Unit waa waajib.';
        });
        // Material date validation
        if (!materialDate) errors.materialDate = 'Taariikhda alaabta waa waajib.';
        // NEW: Vendor payment validation
        if (!selectedVendor) errors.selectedVendor = 'Iibiyaha waa waajib.';
        if (!paymentStatus) errors.paymentStatus = 'Xaaladda lacag bixinta waa waajib.';
        if (paymentStatus === 'PAID' && !paidFrom) errors.paidFrom = 'Akoonka lacagta laga jarayo waa waajib.';
        if (paymentStatus === 'PARTIAL') {
          if (!paidFrom) errors.paidFrom = 'Akoonka lacagta laga jarayo waa waajib.';
          if (!partialPaidAmount || parseFloat(partialPaidAmount.toString()) <= 0) errors.paidAmount = 'Fadlan geli lacagta la bixiyay.';
        }
        if (paymentStatus === 'PARTIAL' && !paidFrom) errors.paidFrom = 'Akoonka lacagta laga jarayo waa waajib marka lacagta qayb la bixiyay.';
        break;
      case 'Labor':
        if (!selectedEmployeeForSalary) errors.selectedEmployeeForSalary = 'Shaqaale waa waajib.';
        if (!workDescription.trim()) errors.workDescription = 'Sharaxaadda shaqada waa waajib.';
        // Wage validation: allow readonly wage from previous contract
        const selectedEmp = employees.find(emp => emp.id === selectedEmployeeForSalary);
        const lastContract = selectedEmp?.laborRecords?.length ? selectedEmp.laborRecords[selectedEmp.laborRecords.length - 1] : null;
        if (lastContract && lastContract.agreedWage != null) {
          // Wage is readonly and valid
        } else {
          if (typeof wage !== 'number' || wage <= 0) errors.wage = 'Mushaharku waa inuu noqdaa nambar wanaagsan.';
        }
        if (typeof laborPaidAmount !== 'number' || laborPaidAmount < 0) errors.laborPaidAmount = 'Lacagta la bixiyay waa inuu noqdaa nambar wanaagsan.';
        if (typeof laborPaidAmount === 'number' && typeof wage === 'number' && laborPaidAmount > wage) errors.laborPaidAmount = 'Lacagta la bixiyay ma dhaafi karto mushaharka.';
        break;
      case 'Transport':
        if (!transportType.trim()) errors.transportType = 'Nooca gaadiidka waa waajib.';
        break;
      case 'Taxi/Xamaal':
        if (!taxiXamaalType.trim()) errors.taxiXamaalType = 'Fadlan dooro Taxi ama Xamaal.';
        if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
        break;
      case 'Company Expense':
        if (!companyExpenseType) errors.companyExpenseType = 'Nooca kharashka shirkadda waa waajib.';
        switch (companyExpenseType) {
          case 'Salary':
            if (!selectedEmployeeForSalary) errors.selectedEmployeeForSalary = 'Fadlan dooro shaqaale.';
            if (typeof salaryPaymentAmount !== 'number' || salaryPaymentAmount <= 0) errors.salaryPaymentAmount = 'Qiimaha mushaharka waa waajib.';
            // Removed validation: Allow overpayment - system will calculate negative remaining balance
            if (!salaryPaymentDate) errors.salaryPaymentDate = 'Taariikhda bixinta mushaharka waa waajib.';
            break;
          case 'Company Labor':
            if (!selectedEmployeeForSalary) errors.selectedEmployeeForSalary = 'Shaqaale waa waajib.';
            if (!workDescription.trim()) errors.workDescription = 'Sharaxaadda shaqada waa waajib.';
            // Wage validation: allow readonly wage from previous contract
            const selectedEmpCompany = employees.find(emp => emp.id === selectedEmployeeForSalary);
            const lastCompanyContract = selectedEmpCompany?.companyLaborRecords?.length ? selectedEmpCompany.companyLaborRecords[selectedEmpCompany.companyLaborRecords.length - 1] : null;
            if (lastCompanyContract && lastCompanyContract.agreedWage != null) {
              // Wage is readonly and valid
            } else {
              if (typeof wage !== 'number' || wage <= 0) errors.wage = 'Mushaharku waa inuu noqdaa nambar wanaagsan.';
            }
            if (typeof laborPaidAmount !== 'number' || laborPaidAmount < 0) errors.laborPaidAmount = 'Lacagta la bixiyay waa inuu noqdaa nambar wanaagsan.';
            if (typeof laborPaidAmount === 'number' && typeof wage === 'number' && laborPaidAmount > wage) errors.laborPaidAmount = 'Lacagta la bixiyay ma dhaafi karto mushaharka.';
            break;
          case 'Office Rent':
            if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
            if (!officeRentPeriod) errors.officeRentPeriod = 'Muddada kirada waa waajib.';
            break;
          case 'Electricity':
            if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
            if (!electricityMeterReading.trim()) errors.electricityMeterReading = 'Akhriska mitirka waa waajib.';
            break;
          case 'Marketing':
            if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
            if (!marketingCampaignName.trim()) errors.marketingCampaignName = 'Magaca ololaha waa waajib.';
            break;
          case 'Material':
            if (materials.length === 0) { errors.materials = 'Fadlan ku dar ugu yaraan hal alaab.'; }
            materials.forEach((mat, index) => {
              if (!mat.name.trim()) errors[`materialName_${index}`] = 'Magaca alaabta waa waajib.';
              if (typeof parseFloat(mat.qty as string) !== 'number' || parseFloat(mat.qty as string) <= 0) errors[`materialQty_${index}`] = 'Quantity waa inuu noqdaa nambar wanaagsan.';
              if (typeof parseFloat(mat.price as string) !== 'number' || parseFloat(mat.price as string) <= 0) errors[`materialPrice_${index}`] = 'Qiimaha waa inuu noqdaa nambar wanaagsan.';
              if (!mat.unit) errors[`materialUnit_${index}`] = 'Unit waa waajib.';
            });
            // NEW: Vendor payment validation for Company Expense
            if (!selectedVendor) errors.selectedVendor = 'Iibiyaha waa waajib.';
            if (!paymentStatus) errors.paymentStatus = 'Xaaladda lacag bixinta waa waajib.';
            if (paymentStatus === 'PAID' && !paidFrom) errors.paidFrom = 'Akoonka lacagta laga jarayo waa waajib marka lacagta la bixiyay.';
            if (paymentStatus === 'PARTIAL' && !paidFrom) errors.paidFrom = 'Akoonka lacagta laga jarayo waa waajib marka lacagta qayb la bixiyay.';
            break;
          case 'Debt':
            if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
            if (!lenderName) errors.lenderName = 'Fadlan dooro macmiilka.';
            if (!loanDate) errors.loanDate = 'Taariikhda deynta waa waajib.';
            break;
          case 'Maintenance & Repairs':
            if (!assetName.trim()) errors.assetName = 'Magaca hantida waa waajib.';
            if (!repairType) errors.repairType = 'Nooca dayactirka waa waajib.';
            if (!serviceProvider.trim()) errors.serviceProvider = 'Magaca adeeg bixiyaha waa waajib.';
            if (partsUsed.length === 0) errors.partsUsed = 'Fadlan ku dar ugu yaraan hal qayb.';
            partsUsed.forEach((part, index) => {
              if (!part.name.trim()) errors[`partName_${index}`] = 'Magaca qaybta waa waajib.';
              if (typeof parseFloat(part.cost as string) !== 'number' || parseFloat(part.cost as string) <= 0) errors[`partCost_${index}`] = 'Qiimaha qaybta waa inuu noqdaa nambar wanaagsan.';
            });
            if (typeof laborHours !== 'number' || laborHours <= 0) errors.laborHours = 'Saacadaha shaqada waa waajib.';
            if (typeof hourlyRate !== 'number' || hourlyRate <= 0) errors.hourlyRate = 'Qiimaha saacadda waa waajib.';
            if (!paidFrom) errors.paidFrom = 'Akoonka lacagta laga bixiyay waa waajib.';
            break;
          case 'Insurance Premiums':
            if (!insuranceType) errors.insuranceType = 'Nooca kafsan waa waajib.';
            if (!policyNumber.trim()) errors.policyNumber = 'Lambarka siyaasadka waa waajib.';
            if (!coverageStartDate) errors.coverageStartDate = 'Taariikhda bilowga waa waajib.';
            if (!coverageEndDate) errors.coverageEndDate = 'Taariikhda dhammaadka waa waajib.';
            if (typeof premiumAmount !== 'number' || premiumAmount <= 0) errors.premiumAmount = 'Qiimaha kafsan waa waajib.';
            if (!insuranceCompany.trim()) errors.insuranceCompany = 'Magaca shirkadda kafsan waa waajib.';
            break;
          case 'Legal & Compliance':
            if (!legalServiceType) errors.legalServiceType = 'Nooca adeegga sharciga waa waajib.';
            if (!lawyerName.trim()) errors.lawyerName = 'Magaca qareenka waa waajib.';
            if (!caseReference.trim()) errors.caseReference = 'Tixraaca dacwadda waa waajib.';
            if (typeof hoursBilled !== 'number' || hoursBilled <= 0) errors.hoursBilled = 'Saacadaha la qoray waa waajib.';
            if (typeof legalHourlyRate !== 'number' || legalHourlyRate <= 0) errors.legalHourlyRate = 'Qiimaha saacadda waa waajib.';
            break;
          case 'Travel & Accommodation':
            if (!travelPurpose) errors.travelPurpose = 'Ujeedka socodka waa waajib.';
            if (!destination.trim()) errors.destination = 'Goobta socodka waa waajib.';
            if (!departureDate) errors.departureDate = 'Taariikhda ka baxista waa waajib.';
            if (!returnDate) errors.returnDate = 'Taariikhda soo noqoshada waa waajib.';
            if (typeof transportationCost !== 'number' || transportationCost <= 0) errors.transportationCost = 'Lacagta gaadiidka waa waajib.';
            if (typeof accommodationCost !== 'number' || accommodationCost <= 0) errors.accommodationCost = 'Lacagta hoyga waa waajib.';
            break;
          case 'Fuel':
            if (!selectedVehicle) errors.selectedVehicle = 'Gaadhiga waa waajib.';
            if (selectedVehicle === 'other' && !vehicleName.trim()) errors.vehicleName = 'Magaca gaadhiga waa waajib.';
            if (!fuelType) errors.fuelType = 'Nooca shidaalka waa waajib.';
            if (typeof fuelQuantity !== 'number' || fuelQuantity <= 0) errors.fuelQuantity = 'Miisaanka shidaalka waa waajib.';
            if (typeof fuelPricePerLiter !== 'number' || fuelPricePerLiter <= 0) errors.fuelPricePerLiter = 'Qiimaha litirka waa waajib.';
            if (!fuelStation.trim()) errors.fuelStation = 'Magaca saldhiga shidaalka waa waajib.';
            if (!fuelPurpose) errors.fuelPurpose = 'Ujeedka shidaalka waa waajib.';
            break;
          case 'Other':
            if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
            break;
        }
        break;
      case 'Other':
        if (typeof amount !== 'number' || amount <= 0) errors.amount = 'Qiimaha waa waajib.';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Helper Functions ---
  const addPart = () => {
    setPartsUsed([...partsUsed, { id: partsUsed.length + 1, name: '', cost: '' }]);
  };

  const removePart = (id: number) => {
    setPartsUsed(partsUsed.filter(part => part.id !== id));
  };

  const updatePart = (id: number, field: 'name' | 'cost', value: string) => {
    setPartsUsed(partsUsed.map(part =>
      part.id === id ? { ...part, [field]: value } : part
    ));
  };

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptImage(file);
      setToastMessage({ message: 'Rasiidka waxaanu u baaraynaa si aanu u buuxino foomka...', type: 'info' });
      setTimeout(() => {
        setAmount(Math.floor(Math.random() * 500) + 50);
        setNote('Alaabta xafiiska');
        setExpenseDate('2025-07-24');
        setCategory('Company Expense');
        setCompanyExpenseType('Office Rent');
        setToastMessage({ message: 'Rasiidka waa la baaray foomkuna waa la buuxiyay!', type: 'success' });
      }, 1500);
    }
  };

  const handleAddMaterial = () => {
    setMaterials([...materials, { id: materials.length + 1, name: '', qty: '', price: '', unit: '' }]);
  };

  const handleRemoveMaterial = (id: number) => {
    setMaterials(materials.filter(mat => mat.id !== id));
  };

  const handleMaterialChange = (id: number, field: string, value: string | number) => {
    setMaterials(materials.map(mat =>
      mat.id === id ? { ...mat, [field]: value } : mat
    ));
  };

  // Sync amount with total material cost
  useEffect(() => {
    if (category === 'Material' || (category === 'Company Expense' && companyExpenseType === 'Material')) {
      setAmount(totalMaterialCost);
    }
  }, [totalMaterialCost, category, companyExpenseType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setValidationErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    // Build description based on category/subtype
    // Use a unique name to avoid shadowing the state variable "description"
    let submissionDescription = description.trim();

    if (category === 'Labor' || (expenseType === 'company' && companyExpenseType === 'Company Labor')) {
      submissionDescription = workDescription.trim();
    } else if (category === 'Material') {
      // Allow user override if provided, otherwise default
      submissionDescription = description && description.trim() !== '' ? description.trim() : `Material expense - ${expenseDate}`;
    } else if (category === 'Company Expense' && companyExpenseType === 'Salary') {
      const emp = employees.find(emp => emp.id === selectedEmployeeForSalary);
      submissionDescription = `Salary payment${emp ? ' for ' + emp.fullName : ''} - ${expenseDate}`;
    } else if (category === 'Taxi/Xamaal') {
      submissionDescription = description.trim() || `Taxi/Xamaal - ${taxiXamaalType}`;
    }

    const expenseData: any = {
      paidFrom: category === 'Equipment Rental' && expenseType === 'project' ? selectedBankAccount : paidFrom,
      expenseDate: category === 'Material' ? materialDate : expenseDate, // Use materialDate for Material expenses
      note: note.trim() === '' ? undefined : note,
      projectId: expenseType === 'project' ? selectedProject : undefined,
      category: category,
      description: submissionDescription || undefined,
      amount: amount // Default assignment, overridden in switch if needed
    };

    // Normalize category for company Material so it follows the same flow as project Material
    const categoryForSwitch = (expenseType === 'company' && companyExpenseType === 'Material') ? 'Material' : category;

    // Set main amount based on category and sub-category
    switch (categoryForSwitch) {
      case 'Material':
        expenseData.amount = totalMaterialCost;
        expenseData.materials = materials.map(m => ({ name: m.name, qty: parseFloat(m.qty as string), price: parseFloat(m.price as string), unit: m.unit }));
        // NEW: Add vendor payment tracking fields
        expenseData.vendorId = selectedVendor;
        expenseData.paymentStatus = paymentStatus;
        // Handle Paid Amount for Partial/Full payments
        if (paymentStatus === 'PAID') {
          expenseData.paidAmount = totalMaterialCost;
        } else if (paymentStatus === 'PARTIAL') {
          expenseData.paidAmount = laborPaidAmount || 0;
        } else {
          expenseData.paidAmount = 0;
        }

        expenseData.invoiceNumber = invoiceNumber || null;
        expenseData.paymentDate = (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') ? new Date().toISOString() : null;
        // Material date tracking
        expenseData.materialDate = materialDate;
        // For project UNPAID material, do not send paidFrom to backend (avoids invalid FK)
        if (expenseType === 'project' && paymentStatus === 'UNPAID') {
          delete expenseData.paidFrom;
        }
        // If company expense, force projectId to null and add required fields
        if (expenseType === 'company') {
          expenseData.projectId = null;
          expenseData.category = 'Material';
          expenseData.expenseDate = materialDate; // Use materialDate instead of expenseDate for Material expenses
          expenseData.paidFrom = (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') ? paidFrom : null; // Only set if paid or partial
          expenseData.note = note.trim() === '' ? undefined : note;
        }
        break;
      case 'Labor':
        // For Labor, send fields matching new ProjectLabor model
        expenseData.projectId = selectedProject;
        expenseData.employeeId = selectedEmployeeForSalary;
        expenseData.agreedWage = wage;
        expenseData.paidAmount = laborPaidAmount;
        expenseData.previousPaidAmount = employees.find(emp => emp.id === selectedEmployeeForSalary)?.paidThisMonth || 0;
        expenseData.remainingWage = typeof wage === 'number' && typeof laborPaidAmount === 'number' ? wage - laborPaidAmount : 0;
        expenseData.description = workDescription;
        expenseData.paidFrom = paidFrom;
        expenseData.dateWorked = expenseDate;
        // Validation: show exactly which fields are missing
        const laborRequiredFields: Record<string, any> = {
          'Mashruuca (projectId)': expenseData.projectId,
          'Shaqaale (employeeId)': expenseData.employeeId,
          'Sharaxaadda shaqada (description)': expenseData.description,
          'Mushaharka la ogolaaday (agreedWage)': expenseData.agreedWage,
          'Lacagta la bixiyay (paidAmount)': expenseData.paidAmount,
          'Taariikhda shaqada (dateWorked)': expenseData.dateWorked,
          'Akoonka laga jarayo (paidFrom)': expenseData.paidFrom,
        };
        const missingFields = Object.entries(laborRequiredFields)
          .filter(([_, value]) => value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value)))
          .map(([key]) => key);
        if (missingFields.length > 0) {
          setLoading(false);
          setToastMessage({ message: `Foomka shaqaalaha mashruuca: Xogaha waajibka ah ee maqan: ${missingFields.join(', ')}`, type: 'error' });
          console.error('Labor expense missing fields:', missingFields, laborRequiredFields);
          return;
        }
        break;
      case 'Transport':
        expenseData.amount = amount;
        expenseData.transportType = transportType;
        // Ensure paidFrom is preserved
        expenseData.paidFrom = paidFrom;
        break;
      case 'Taxi/Xamaal':
        expenseData.amount = amount;
        expenseData.transportType = taxiXamaalType; // Reuse transportType field in backend
        // Ensure paidFrom is preserved
        expenseData.paidFrom = paidFrom;
        break;
      case 'Consultancy':
        expenseData.amount = consultancyFee ? Number(consultancyFee) : 0;
        expenseData.consultantName = consultantName;
        expenseData.consultancyType = consultancyType;
        expenseData.consultancyFee = consultancyFee ? Number(consultancyFee) : 0;
        // Ensure paidFrom is preserved
        expenseData.paidFrom = paidFrom;
        break;
      case 'Equipment Rental':
        expenseData.amount = rentalFee ? Number(rentalFee) : 0;
        expenseData.equipmentName = equipmentName;
        expenseData.rentalPeriod = rentalPeriod;
        expenseData.rentalFee = rentalFee ? Number(rentalFee) : 0;
        expenseData.supplierName = supplierName;
        expenseData.projectId = selectedProject;
        expenseData.bankAccountId = selectedBankAccount;
        // Equipment Rental uses bankAccountId, but also preserve paidFrom for fallback
        expenseData.paidFrom = selectedBankAccount || paidFrom;
        break;
      case 'Utilities':
        expenseData.amount = amount;
        expenseData.category = 'Utilities';
        expenseData.projectId = expenseType === 'project' ? selectedProject : undefined;
        expenseData.companyExpenseType = expenseType === 'company' ? 'Utilities' : undefined;
        // Ensure paidFrom is preserved
        expenseData.paidFrom = paidFrom;
        break;
      case 'Company Expense':
        expenseData.category = 'Company Expense';
        expenseData.companyExpenseType = companyExpenseType;
        const shouldPersistSubCategory = companyExpenseType && !['Company Labor', 'Material'].includes(companyExpenseType);
        if (shouldPersistSubCategory) {
          expenseData.subCategory = companyExpenseType;
        } else {
          delete expenseData.subCategory;
        }
        switch (companyExpenseType) {
          case 'Salary':
            expenseData.amount = salaryPaymentAmount;
            expenseData.employeeId = selectedEmployeeForSalary;
            expenseData.subCategory = 'Salary';
            expenseData.expenseDate = salaryPaymentDate; // Use the salary payment date
            break;
          case 'Company Labor':
            // For Company Labor, send fields matching CompanyLabor model
            expenseData.category = 'Company Labor';
            expenseData.employeeId = selectedEmployeeForSalary;
            expenseData.agreedWage = wage;
            expenseData.laborPaidAmount = laborPaidAmount;
            expenseData.description = workDescription;
            expenseData.paidFrom = paidFrom;
            expenseData.expenseDate = expenseDate;
            break;
          case 'Office Rent':
            expenseData.amount = amount;
            expenseData.officeRentPeriod = officeRentPeriod;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
          case 'Electricity':
            expenseData.amount = amount;
            expenseData.electricityMeterReading = electricityMeterReading;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
          case 'Marketing':
            expenseData.amount = amount;
            expenseData.marketingCampaignName = marketingCampaignName;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
          case 'Utilities':
            expenseData.amount = amount;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
          case 'Material':
            // For company Material expense, send as category: 'Material', projectId: null
            expenseData.amount = totalMaterialCost;
            expenseData.materials = materials.map(m => ({ name: m.name, qty: parseFloat(m.qty as string), price: parseFloat(m.price as string), unit: m.unit }));
            expenseData.category = 'Material';
            expenseData.projectId = null;
            expenseData.expenseDate = materialDate; // Use materialDate instead of expenseDate for Material expenses

            // NEW: Vendor payment tracking fields for Company Material Expense
            expenseData.vendorId = selectedVendor;
            expenseData.paymentStatus = paymentStatus;

            // Handle Paid Amount for Partial/Full payments
            if (paymentStatus === 'PAID') {
              expenseData.paidAmount = totalMaterialCost;
            } else if (paymentStatus === 'PARTIAL') {
              expenseData.paidAmount = partialPaidAmount ? parseFloat(partialPaidAmount.toString()) : 0;
            } else {
              expenseData.paidAmount = 0;
            }

            expenseData.invoiceNumber = invoiceNumber || null;
            expenseData.paymentDate = (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') ? new Date().toISOString() : null;

            // Material date tracking
            expenseData.materialDate = materialDate;
            expenseData.paidFrom = (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') ? paidFrom : null; // Only set if paid or partial
            break;
          case 'Debt':
            expenseData.amount = amount;
            expenseData.subCategory = 'Debt';
            expenseData.lenderName = lenderName;
            expenseData.loanDate = loanDate;
            expenseData.expenseDate = loanDate; // Use loanDate as expenseDate for Debt expenses
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            if (lenderName) {
              expenseData.customerId = lenderName;
              // Also store customer name for display
              const customer = allCustomers.find(c => c.id === lenderName);
              if (customer) {
                expenseData.lenderName = customer.name;
              }
            }
            break;
          case 'Maintenance & Repairs':
            expenseData.amount = totalMaintenanceCost;
            expenseData.subCategory = 'Maintenance & Repairs';
            expenseData.assetName = assetName;
            expenseData.repairType = repairType;
            expenseData.serviceProvider = serviceProvider;
            expenseData.partsUsed = partsUsed.map(part => ({ name: part.name, cost: parseFloat(part.cost as string) || 0 }));
            expenseData.laborHours = laborHours;
            expenseData.hourlyRate = hourlyRate;
            expenseData.totalPartsCost = totalPartsCost;
            expenseData.totalLaborCost = totalLaborCost;
            expenseData.paidFrom = paidFrom;
            expenseData.expenseDate = expenseDate;
            expenseData.note = note.trim() === '' ? undefined : note;
            break;
          case 'Insurance Premiums':
            expenseData.amount = premiumAmount;
            expenseData.subCategory = 'Insurance Premiums';
            expenseData.insuranceType = insuranceType;
            expenseData.policyNumber = policyNumber;
            expenseData.coverageStartDate = coverageStartDate;
            expenseData.coverageEndDate = coverageEndDate;
            expenseData.deductible = deductible;
            expenseData.insuranceCompany = insuranceCompany;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
          case 'Legal & Compliance':
            expenseData.amount = totalLegalCost;
            expenseData.subCategory = 'Legal & Compliance';
            expenseData.legalServiceType = legalServiceType;
            expenseData.lawyerName = lawyerName;
            expenseData.caseReference = caseReference;
            expenseData.hoursBilled = hoursBilled;
            expenseData.legalHourlyRate = legalHourlyRate;
            expenseData.additionalCosts = additionalCosts;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
          case 'Travel & Accommodation':
            expenseData.amount = totalTravelCost;
            expenseData.subCategory = 'Travel & Accommodation';
            expenseData.travelPurpose = travelPurpose;
            expenseData.destination = destination;
            expenseData.departureDate = departureDate;
            expenseData.returnDate = returnDate;
            expenseData.transportationCost = transportationCost;
            expenseData.accommodationCost = accommodationCost;
            expenseData.mealsCost = mealsCost;
            expenseData.otherTravelCosts = otherTravelCosts;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
          default:
            expenseData.amount = amount;
            // Ensure paidFrom is preserved
            expenseData.paidFrom = paidFrom;
            break;
        }
        break;
      default:
        expenseData.amount = amount;
        // Ensure paidFrom is preserved
        expenseData.paidFrom = paidFrom;
        break;
    }

    // Handle receipt image upload if exists (requires FormData for API)
    let receiptUrl = null;
    if (receiptImage) {
      // For now, we'll store the receipt image as a base64 string
      // In production, you would upload to a cloud storage service
      receiptUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(receiptImage);
      });
    }

    // Add debug log for Labor project expense submission
    if (category === 'Labor' && expenseType === 'project') {
      console.log('Labor Project Expense Submission:', {
        projectId: expenseData.projectId,
        employeeId: expenseData.employeeId,
        agreedWage: expenseData.agreedWage,
        paidAmount: expenseData.paidAmount,
        previousPaidAmount: expenseData.previousPaidAmount,
        remainingWage: expenseData.remainingWage,
        description: expenseData.description,
        paidFrom: expenseData.paidFrom,
        dateWorked: expenseData.dateWorked
      });
    }
    console.log('Submitting Expense Data:', expenseData);

    // --- API Integration ---
    try {
      // If Labor and project expense, submit to /api/expenses/project with all required backend fields
      if (category === 'Labor' && expenseType === 'project') {
        const laborPayload = {
          projectId: expenseData.projectId,
          employeeId: expenseData.employeeId,
          agreedWage: expenseData.agreedWage,
          paidAmount: expenseData.paidAmount,
          previousPaidAmount: expenseData.previousPaidAmount,
          remainingWage: expenseData.remainingWage,
          description: expenseData.description,
          paidFrom: expenseData.paidFrom,
          expenseDate: expenseData.dateWorked, // required by backend
          category: 'Labor', // required by backend
          amount: expenseData.paidAmount, // required by backend
          laborPaidAmount: expenseData.paidAmount, // required by backend
          note: expenseData.note || '', // Add note to labor payload
          receiptUrl: receiptUrl, // Add receipt URL to labor payload
          startNewAgreement: Boolean((window as any)._startNewAgreement || false),
        };
        // Submit to /api/expenses/project (this creates both ProjectLabor and Expense records)
        const expenseRes = await fetch('/api/expenses/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(laborPayload),
        });
        const expenseDataRes = await expenseRes.json();
        if (!expenseRes.ok) {
          const errorMsg = expenseDataRes.message || (typeof expenseDataRes === 'string' ? expenseDataRes : JSON.stringify(expenseDataRes)) || 'Failed to record expense';
          console.error('Backend error response (expense):', expenseDataRes);
          setToastMessage({ message: errorMsg, type: 'error' });
          setLoading(false);
          return;
        }
        setToastMessage({ message: 'Shaqaale mashruuc iyo kharashkiisa si guul leh ayaa loo diiwaan geliyay!', type: 'success' });
        // Clear form
        setCategory(''); setAmount(''); setPaidFrom('Cash'); setExpenseDate(new Date().toISOString().split('T')[0]); setNote(''); setSelectedProject('');
        setMaterials([{ id: 1, name: '', qty: '', price: '', unit: '' }]);
        setSelectedEmployeeForSalary(''); setWorkDescription(''); setWage(''); setLaborPaidAmount(''); setTransportType(''); setTaxiXamaalType('');
        setCompanyExpenseType(''); setLenderName(''); setLoanDate(''); setReceiptImage(null);
        setSelectedEmployeeForSalary(''); setSalaryPaymentAmount('');
        setOfficeRentPeriod(''); setElectricityMeterReading(''); setMarketingCampaignName('');
        setSelectedVehicle(''); setVehicleName(''); setFuelType(''); setFuelQuantity(''); setFuelPricePerLiter(''); setFuelStation(''); setOdometerReading(''); setFuelPurpose('');
        // NEW: Clear vendor payment fields
        setSelectedVendor(''); setPaymentStatus('UNPAID'); setInvoiceNumber('');
        setAllCustomers([]);
        setValidationErrors({});
        const projectId = searchParams.get('projectId');
        if (projectId) {
          router.push(`/projects/${projectId}`);
        } else {
          router.push('/expenses');
        }
        return;
      }
      // If Company Labor, submit to /api/expenses/company with all required backend fields
      if (expenseType === 'company' && companyExpenseType === 'Company Labor') {
        const companyLaborPayload = {
          employeeId: expenseData.employeeId,
          agreedWage: expenseData.agreedWage,
          laborPaidAmount: expenseData.laborPaidAmount,
          description: expenseData.description,
          paidFrom: expenseData.paidFrom,
          expenseDate: expenseData.expenseDate,
          category: 'Company Labor',
          amount: expenseData.laborPaidAmount,
          note: expenseData.note || '',
          receiptUrl: receiptUrl,
          startNewAgreement: Boolean((window as any)._startNewAgreement || false),
        };
        // Submit to /api/expenses/company (this creates both CompanyLabor and Expense records)
        const expenseRes = await fetch('/api/expenses/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyLaborPayload),
        });
        const expenseDataRes = await expenseRes.json();
        if (!expenseRes.ok) {
          const errorMsg = expenseDataRes.message || (typeof expenseDataRes === 'string' ? expenseDataRes : JSON.stringify(expenseDataRes)) || 'Failed to record expense';
          console.error('Backend error response (expense):', expenseDataRes);
          setToastMessage({ message: errorMsg, type: 'error' });
          setLoading(false);
          return;
        }
        setToastMessage({ message: 'Shaqaale shirkad iyo kharashkiisa si guul leh ayaa loo diiwaan geliyay!', type: 'success' });
        // Clear form
        setCategory(''); setAmount(''); setPaidFrom('Cash'); setExpenseDate(new Date().toISOString().split('T')[0]); setNote(''); setSelectedProject('');
        setMaterials([{ id: 1, name: '', qty: '', price: '', unit: '' }]);
        setSelectedEmployeeForSalary(''); setWorkDescription(''); setWage(''); setLaborPaidAmount(''); setTransportType(''); setTaxiXamaalType('');
        setCompanyExpenseType(''); setLenderName(''); setLoanDate(''); setReceiptImage(null);
        setSelectedEmployeeForSalary(''); setSalaryPaymentAmount('');
        setOfficeRentPeriod(''); setElectricityMeterReading(''); setMarketingCampaignName('');
        setSelectedVehicle(''); setVehicleName(''); setFuelType(''); setFuelQuantity(''); setFuelPricePerLiter(''); setFuelStation(''); setOdometerReading(''); setFuelPurpose('');
        setSelectedVendor(''); setPaymentStatus('UNPAID'); setInvoiceNumber('');
        setAllCustomers([]);
        setValidationErrors({});
        const projectId = searchParams.get('projectId');
        if (projectId) {
          router.push(`/projects/${projectId}`);
        } else {
          router.push('/expenses');
        }
        return;
      }
      // Otherwise, submit as normal
      const endpoint = expenseType === 'project' ? '/api/expenses/project' : '/api/expenses/company';

      // Add receipt URL to expense data
      const finalExpenseData = {
        ...expenseData,
        receiptUrl: receiptUrl,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalExpenseData),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.message || (typeof data === 'string' ? data : JSON.stringify(data)) || 'Failed to record expense';
        console.error('Backend error response:', data);
        setToastMessage({ message: errorMsg, type: 'error' });
        setLoading(false);
        return;
      }
      setToastMessage({ message: data.message || 'Kharashka si guul leh ayaa loo diiwaan geliyay!', type: 'success' });

      // Notify customer pages about expense creation for real-time updates
      if (expenseData.customerId) {
        const transactionType = (expenseData.category === 'Company Expense' && expenseData.subCategory === 'Debt') ? 'DEBT_TAKEN' : 'EXPENSE';

        localStorage.setItem('transactionCreated', JSON.stringify({
          customerId: expenseData.customerId,
          type: transactionType,
          amount: expenseData.amount,
          timestamp: Date.now()
        }));
        // Trigger storage event for same-tab listeners
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'transactionCreated',
          newValue: JSON.stringify({
            customerId: expenseData.customerId,
            type: transactionType,
            amount: expenseData.amount,
            timestamp: Date.now()
          })
        }));

        // Also notify about debt creation specifically
        if (transactionType === 'DEBT_TAKEN') {
          localStorage.setItem('debtRepaymentMade', JSON.stringify({
            customerId: expenseData.customerId,
            type: 'DEBT_TAKEN',
            amount: expenseData.amount,
            timestamp: Date.now()
          }));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'debtRepaymentMade',
            newValue: JSON.stringify({
              customerId: expenseData.customerId,
              type: 'DEBT_TAKEN',
              amount: expenseData.amount,
              timestamp: Date.now()
            })
          }));
        }
      }

      // Clear form
      setCategory(''); setAmount(''); setPaidFrom('Cash'); setExpenseDate(new Date().toISOString().split('T')[0]); setNote(''); setSelectedProject('');
      setMaterials([{ id: 1, name: '', qty: '', price: '', unit: '' }]);
      setSelectedEmployeeForSalary(''); setWorkDescription(''); setWage(''); setLaborPaidAmount(''); setTransportType('');
      setCompanyExpenseType(''); setLenderName(''); setLoanDate(''); setReceiptImage(null);
      setSelectedEmployeeForSalary(''); setSalaryPaymentAmount('');
      setOfficeRentPeriod(''); setElectricityMeterReading(''); setMarketingCampaignName('');
      setSelectedVehicle(''); setVehicleName(''); setFuelType(''); setFuelQuantity(''); setFuelPricePerLiter(''); setFuelStation(''); setOdometerReading(''); setFuelPurpose('');
      // NEW: Clear vendor payment fields
      setSelectedVendor(''); setPaymentStatus('UNPAID'); setInvoiceNumber('');
      setAllCustomers([]);
      setValidationErrors({});
      const projectId = searchParams.get('projectId');
      if (projectId) {
        router.push(`/projects/${projectId}`);
      } else {
        router.push('/expenses');
      }
    } catch (error: any) {
      console.error('Expense submission error:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka kharashka la diiwaan gelinayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/expenses" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Ku Dar Kharash Cusub
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Type Toggle Buttons */}
          <div className="flex space-x-3 mb-6">
            <button
              type="button"
              className={`flex items-center px-6 py-2 rounded-lg font-bold text-lg border transition-colors duration-200 ${expenseType === 'project' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700'}`}
              onClick={() => { setExpenseType('project'); setCategory(''); setCompanyExpenseType(''); }}
            >
              <Briefcase className="mr-2" size={20} /> project-Exp
            </button>
            <button
              type="button"
              className={`flex items-center px-6 py-2 rounded-lg font-bold text-lg border transition-colors duration-200 ${expenseType === 'company' ? 'bg-primary text-white border-primary' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 border-lightGray dark:border-gray-700'}`}
              onClick={() => { setExpenseType('company'); setCategory(''); setCompanyExpenseType(''); }}
            >
              <Building className="mr-2" size={20} /> Company-Exp
            </button>
          </div>
          {/* Expense Category Select (depends on expenseType) */}
          <div>
            {expenseType === 'company' && (
              <select
                className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 mb-4"
                value={companyExpenseType}
                onChange={e => {
                  const selectedValue = e.target.value;
                  setCompanyExpenseType(selectedValue);
                  // Taxi/Xamaal works directly, not under Company Expense
                  if (selectedValue === 'Taxi/Xamaal') {
                    setCategory('Taxi/Xamaal');
                  } else {
                    setCategory(selectedValue ? 'Company Expense' : '');
                  }
                }}
                title="Dooro Nooca Kharashka Shirkadda"
              >
                {companyExpenseCategories.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {expenseType === 'project' && (
              <select
                className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 mb-4"
                value={category}
                onChange={e => setCategory(e.target.value)}
                title="Dooro Nooca Kharashka Mashruuca"
              >
                {projectExpenseCategories.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Dynamic Fields based on Category */}
          {expenseType === 'project' && category === 'Consultancy' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta La-talin Mashruuca</h3>
              <div className="mb-4">
                <label htmlFor="consultantName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca La-taliyaha <span className="text-redError">*</span></label>
                <input
                  type="text"
                  id="consultantName"
                  value={consultantName}
                  onChange={e => setConsultantName(e.target.value)}
                  placeholder="Tusaale: Dr. Ahmed"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="consultancyType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca La-talin <span className="text-redError">*</span></label>
                <input
                  type="text"
                  id="consultancyType"
                  value={consultancyType}
                  onChange={e => setConsultancyType(e.target.value)}
                  placeholder="Tusaale: Injineernimo, Maamul, iwm"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="consultancyFee" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Lacagta La-talin ($) <span className="text-redError">*</span></label>
                <input
                  type="number"
                  id="consultancyFee"
                  value={consultancyFee}
                  onChange={e => setConsultancyFee(e.target.value)}
                  placeholder="Tusaale: 500"
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="selectedProject" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuca La Xiriira *</label>
                <select
                  id="selectedProject"
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- No Project --</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="paidFrom" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Akoonka Laga Jarayo *</label>
                <select
                  id="paidFrom"
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
              </div>
            </div>
          )}
          {((expenseType === 'project' && category === 'Material') || (expenseType === 'company' && companyExpenseType === 'Material')) && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-4">Faahfaahinta Alaabta</h3>

              {/* Project Selection for Project Expenses */}
              {expenseType === 'project' && (
                <div className="mb-6">
                  <label htmlFor="selectedProject_mat" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuca <span className="text-redError">*</span></label>
                  <select
                    id="selectedProject_mat"
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100"
                    required
                  >
                    <option value="">-- Dooro Mashruuca --</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                  {validationErrors.selectedProject && <p className="text-redError text-xs mt-1">{validationErrors.selectedProject}</p>}
                </div>
              )}

              <MaterialExpenseForm
                materials={materials}
                setMaterials={setMaterials}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                paidAmount={partialPaidAmount}
                setPaidAmount={setPartialPaidAmount}
                expenseDate={materialDate}
                setExpenseDate={setMaterialDate}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
                totalAmount={totalMaterialCost}
                setTotalAmount={(val) => setAmount(val)}
                setReceiptImage={setReceiptImage}
                errors={validationErrors}
              />

              {/* Note field */}
              <div className="mt-4">
                <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Wixi faahfaahin dheeraad ah..."
                  rows={2}
                />
              </div>

              {/* Paid From Field */}
              {paymentStatus !== 'UNPAID' && (
                <div className="mt-4">
                  <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Akoonka Laga Jarayo *</label>
                  <select
                    value={paidFrom}
                    onChange={e => setPaidFrom(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">-- Dooro Akoonka --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} {acc.balance !== undefined ? `($${Number(acc.balance).toLocaleString()})` : ''}</option>
                    ))}
                  </select>
                  {validationErrors.paidFrom && <p className="text-redError text-xs mt-1">{validationErrors.paidFrom}</p>}
                </div>
              )}
            </div>
          )}

          {/* Project Expense: Add new categories and forms */}
          {expenseType === 'project' && category === 'Transport' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Transport-ka Mashruuca</h3>
              <div className="mb-4">
                <label htmlFor="transportType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Gaadiidka *</label>
                <input
                  type="text"
                  id="transportType"
                  value={transportType}
                  onChange={e => setTransportType(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tusaale: Delivery Truck"
                  required
                />
                {validationErrors.transportType && (
                  <span className="text-red-500 text-sm">{validationErrors.transportType}</span>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha ($) *</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tusaale: 100.00"
                  required
                />
                {validationErrors.amount && (
                  <span className="text-red-500 text-sm">{validationErrors.amount}</span>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="paidFrom" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Akoonka Laga Jarayo *</label>
                <select
                  id="paidFrom"
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
                  <span className="text-red-500 text-sm">{validationErrors.paidFrom}</span>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="expenseDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Kharashka *</label>
                <input
                  type="date"
                  id="expenseDate"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                {validationErrors.expenseDate && (
                  <span className="text-red-500 text-sm">{validationErrors.expenseDate}</span>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="selectedProject" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuca La Xiriira (Optional)</label>
                <select
                  id="selectedProject"
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- No Project --</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
                {validationErrors.selectedProject && (
                  <span className="text-red-500 text-sm">{validationErrors.selectedProject}</span>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="note" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Wixi faahfaahin dheeraad ah ee kharashka..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Taxi/Xamaal Form - Simplified transport form without vehicle selection */}
          {((expenseType === 'project' && category === 'Taxi/Xamaal') || (expenseType === 'company' && category === 'Taxi/Xamaal')) && (
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
                    <option value="">-- No Project --</option>
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
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Wixi faahfaahin dheeraad ah ee kharashka..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Project Expense: Add new categories (example: Equipment, Subcontract, Miscellaneous) */}
          {category === 'Equipment' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Qalabka</h3>
              <div>
                <label htmlFor="equipmentName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Qalabka <span className="text-redError">*</span></label>
                <input
                  type="text"
                  id="equipmentName"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Tusaale: Generator"
                  className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100"
                />
              </div>
            </div>
          )}
          {category === 'Subcontract' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Qandaraaslaha</h3>
              <div>
                <label htmlFor="subcontractorName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Qandaraaslaha <span className="text-redError">*</span></label>
                <input
                  type="text"
                  id="subcontractorName"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Tusaale: ABC Construction"
                  className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100"
                />
              </div>
            </div>
          )}
          {category === 'Miscellaneous' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Kharashyada Kale</h3>
              <div>
                <label htmlFor="miscNote" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Faahfaahin <span className="text-redError">*</span></label>
                <input
                  type="text"
                  id="miscNote"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Tusaale: Kharash kale oo aan kor ku xusin"
                  className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {category === 'Labor' && expenseType === 'project' && (
            <>
              {/* Subcategory dropdown for Labor */}
              <div className="mb-4">
                <label htmlFor="subCategory" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Shaqaalaha *</label>
                <select
                  id="subCategory"
                  value={subCategory}
                  onChange={e => setSubCategory(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- Dooro Nooca Shaqaalaha --</option>
                  <option value="Labor">Shaqaale Mashruuc</option>
                  {/* Add more subcategories here if needed */}
                </select>
              </div>
              {subCategory === 'Labor' && (
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                  <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Shaqaalaha Mashruuca</h3>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuca <span className="text-redError">*</span></label>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required title="Dooro Mashruuca">
                      <option value="">-- Dooro Mashruuca --</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {validationErrors.selectedProject && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.selectedProject}</p>}
                  </div>
                  <div>
                    <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Shaqaale <span className="text-redError">*</span></label>
                    <select value={selectedEmployeeForSalary} onChange={e => setSelectedEmployeeForSalary(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required title="Dooro Shaqaale">
                      <option value="">-- Dooro Shaqaale --</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
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
                                  // use a minimal local flag without adding more state noise
                                  (window as any)._startNewAgreement = e.target.checked;
                                  if (e.target.checked) {
                                    // enable user to type a fresh agreed wage
                                    setWage('');
                                  }
                                  // force refresh by setting laborPaidAmount to itself
                                  setLaborPaidAmount(laborPaidAmount as any);
                                }}
                              />
                              Bilow heshiis cusub mashruucan (enter Agreed hoose)
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
            </>
          )}

          {category === 'Equipment Rental' && expenseType === 'project' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Kirada Qalabka</h3>
              <div>
                <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Qalabka <span className="text-redError">*</span></label>
                <input type="text" value={equipmentName} onChange={e => setEquipmentName(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required placeholder="Magaca Qalabka" title="Magaca Qalabka" />
              </div>
              <div>
                <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Muddada Kirada <span className="text-redError">*</span></label>
                <input type="text" value={rentalPeriod} onChange={e => setRentalPeriod(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required placeholder="Muddada Kirada" title="Muddada Kirada" />
              </div>
              <div>
                <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Lacagta Kirada <span className="text-redError">*</span></label>
                <input type="number" value={rentalFee} onChange={e => setRentalFee(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required placeholder="Lacagta Kirada" title="Lacagta Kirada" />
              </div>
              <div>
                <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Kiriyaha <span className="text-redError">*</span></label>
                <input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required placeholder="Magaca Kiriyaha" title="Magaca Kiriyaha" />
              </div>
              <div>
                <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuca loo kireeyay <span className="text-redError">*</span></label>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required title="Dooro Mashruuca">
                  <option value="">Dooro Mashruuca</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Bankiga laga jari doono <span className="text-redError">*</span></label>
                <select value={selectedBankAccount} onChange={e => setSelectedBankAccount(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required title="Dooro Bank Account">
                  <option value="">Dooro Bank Account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Utilities form for project expenses */}
          {expenseType === 'project' && category === 'Utilities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
              <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Adeegyada Guud (Mashruuc)</h4>
              <div className="md:col-span-2">
                <label htmlFor="selectedProject_utilities" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Mashruuca <span className="text-redError">*</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                  <select
                    id="selectedProject_utilities"
                    required
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className={`w-full p-2 pl-8 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.selectedProject ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Mashruuca --</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={18} />
                </div>
                {validationErrors.selectedProject && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.selectedProject}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="paidFrom_utilities_project" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                  <select
                    id="paidFrom_utilities_project"
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
                <label htmlFor="utilitiesAmount_project" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha Adeegga ($) <span className="text-redError">*</span></label>
                <input
                  type="number"
                  id="utilitiesAmount_project"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 100"
                  className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
                {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="utilitiesDescription_project" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Faahfaahinta Adeegga <span className="text-redError">*</span></label>
                <input
                  type="text"
                  id="utilitiesDescription_project"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tusaale: Internet, Biyaha, Telefoon, iwm"
                  className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.description ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
                {validationErrors.description && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.description}</p>}
              </div>
              <div>
                <label htmlFor="utilitiesDate_project" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Taariikhda Kharashka <span className="text-redError">*</span></label>
                <input
                  type="date"
                  id="utilitiesDate_project"
                  required
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.expenseDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
                {validationErrors.expenseDate && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.expenseDate}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="utilitiesNote_project" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Fiiro Gaar Ah (Optional)</label>
                <textarea
                  id="utilitiesNote_project"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  placeholder="Wixii faahfaahin dheeraad ah ee adeegga..."
                  className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary"
                ></textarea>
              </div>
            </div>
          )}

          {/* Transport form only shown for project expenses, not duplicated */}

          {category === 'Company Expense' && companyExpenseType !== 'Material' && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Kharashka Shirkadda</h3>
              <div>
                <label htmlFor="companyExpenseType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Kharashka Shirkadda <span className="text-redError">*</span></label>
                <select
                  id="companyExpenseType"
                  required
                  value={companyExpenseType}
                  onChange={(e) => setCompanyExpenseType(e.target.value)}
                  className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.companyExpenseType ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Nooca Kharashka Shirkadda --</option>
                  {companyExpenseCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                {validationErrors.companyExpenseType && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{validationErrors.companyExpenseType}</p>}
              </div>



              {/* NEW: Salary Specific Fields */}
              {companyExpenseType === 'Salary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Mushaharka</h4>
                  {/* PaidFrom field inside Salary */}
                  <div className="md:col-span-2">
                    <label htmlFor="paidFrom_salary" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_salary"
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
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="selectedEmployeeForSalary" className="block text-sm font-medium text-darkGray dark:text-gray-300">Dooro Shaqaale <span className="text-redError">*</span></label>
                      <Link
                        href="/employees/add"
                        className="text-primary hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition"
                      >
                        <Plus size={16} />
                        Add New
                      </Link>
                    </div>
                    <select
                      id="selectedEmployeeForSalary"
                      required
                      value={selectedEmployeeForSalary}
                      onChange={(e) => setSelectedEmployeeForSalary(e.target.value)}
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${validationErrors.selectedEmployeeForSalary ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    >
                      <option value="">-- Dooro Shaqaale --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.fullName || emp.name}</option>
                      ))}
                    </select>
                    {validationErrors.selectedEmployeeForSalary && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.selectedEmployeeForSalary}</p>}
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
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.salaryPaymentAmount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.salaryPaymentAmount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.salaryPaymentAmount}</p>}
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
                        className={`w-full p-2 pl-10 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.salaryPaymentDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                      />
                    </div>
                    {validationErrors.salaryPaymentDate && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.salaryPaymentDate}</p>}
                  </div>
                  {selectedEmployeeData && salaryCalculation && (
                    <div className="col-span-full space-y-3">
                      {/* Salary Summary */}
                      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                        <h5 className="text-sm font-bold text-primary dark:text-blue-300 mb-2">Xisaabinta Mushahaarka</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="text-center">
                            <div className="text-mediumGray dark:text-gray-400">Bilaha La Shaqeeyay</div>
                            <div className="font-bold text-primary dark:text-blue-300">{salaryCalculation.totalMonths}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-mediumGray dark:text-gray-400">Mushahaar/Bil</div>
                            <div className="font-bold text-primary dark:text-blue-300">{salaryCalculation.monthlySalary.toLocaleString()} ETB</div>
                          </div>
                          <div className="text-center">
                            <div className="text-mediumGray dark:text-gray-400">Wadarta Mushahaarka</div>
                            <div className="font-bold text-primary dark:text-blue-300">{salaryCalculation.totalSalaryOwed.toLocaleString()} ETB</div>
                          </div>
                          <div className="text-center">
                            <div className="text-mediumGray dark:text-gray-400">Hore La Bixiyay</div>
                            <div className="font-bold text-primary dark:text-blue-300">{salaryCalculation.salaryPaidThisMonth.toLocaleString()} ETB</div>
                          </div>
                        </div>
                      </div>

                      {/* Remaining Amount */}
                      {(() => {
                        const isOverpayment = newSalaryRemaining < 0;
                        const bgColor = isOverpayment ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20';
                        const borderColor = isOverpayment ? 'border-orange-200 dark:border-orange-700' : 'border-green-200 dark:border-green-700';
                        const textColor = isOverpayment ? 'text-orange-800 dark:text-orange-300' : 'text-green-800 dark:text-green-300';
                        const amountColor = isOverpayment ? 'text-orange-900 dark:text-orange-200' : 'text-green-900 dark:text-green-200';

                        return (
                          <div className={`p-3 ${bgColor} rounded-lg border ${borderColor}`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${textColor}`}>Lacagta Hadhay:</span>
                              <span className={`text-lg font-bold ${amountColor}`}>{currentSalaryRemaining.toLocaleString()} ETB</span>
                            </div>
                            {typeof salaryPaymentAmount === 'number' && salaryPaymentAmount > 0 && (
                              <div className={`flex justify-between items-center mt-2 pt-2 border-t ${borderColor}`}>
                                <span className={`text-sm font-medium ${textColor}`}>
                                  {isOverpayment ? 'Kadib Bixinta (Overpayment):' : 'Kadib Bixinta:'}
                                </span>
                                <span className={`text-lg font-bold ${amountColor}`}>
                                  {newSalaryRemaining.toLocaleString()} ETB
                                  {isOverpayment && (
                                    <span className="text-xs ml-1 text-orange-600 dark:text-orange-400">(Waa ka badan)</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Company Labor Specific Fields */}
              {companyExpenseType === 'Company Labor' && (
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                  <h3 className="text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Shaqaalaha Shirkadda</h3>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-md font-medium text-darkGray dark:text-gray-300">Shaqaale <span className="text-redError">*</span></label>
                      <Link
                        href="/employees/add"
                        className="text-primary hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition"
                      >
                        <Plus size={16} />
                        Add New
                      </Link>
                    </div>
                    <select value={selectedEmployeeForSalary} onChange={e => setSelectedEmployeeForSalary(e.target.value)} className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100" required title="Dooro Shaqaale">
                      <option value="">-- Dooro Shaqaale --</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
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

              {/* NEW: Office Rent Specific Fields */}
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
                      value={amount} // Re-use common amount
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
                      {officeRentPeriods.map(period => <option key={period} value={period}>{period}</option>)}
                    </select>
                    {validationErrors.officeRentPeriod && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.officeRentPeriod}</p>}
                  </div>
                </div>
              )}

              {/* NEW: Utilities (Adeegyada Guud) General Service Form */}
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


              {/* NEW: Marketing Specific Fields */}
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
                      value={amount} // Re-use common amount
                      onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 1000"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
                  </div>
                </div>
              )}



              {/* NEW: Debt Specific Fields (Moved from Top-Level) */}
              {companyExpenseType === 'Debt' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Deynta (Macmiil dayn u qatay )</h4>
                  {/* PaidFrom field inside Debt */}
                  <div className="md:col-span-2">
                    <label htmlFor="paidFrom_debt" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_debt"
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
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="selectedCustomerDebt" className="block text-sm font-medium text-darkGray dark:text-gray-300">Dooro Macmiilka (Dayn La Siinay) <span className="text-redError">*</span></label>
                      <Link
                        href="/customers/add"
                        className="text-primary hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition"
                      >
                        <Plus size={16} />
                        Add New
                      </Link>
                    </div>
                    <select
                      id="selectedCustomerDebt"
                      required
                      value={lenderName}
                      onChange={(e) => setLenderName(e.target.value)}
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${validationErrors.lenderName ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    >
                      <option value="">-- Dooro Macmiilka (Dayn La Siinay) --</option>
                      {allCustomers && allCustomers.length > 0 ? allCustomers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - Dayn dhan: ${customer.outstandingDebt?.toLocaleString() || 0}
                        </option>
                      )) : (
                        <option value="" disabled>Lagu heli karo customers-ka</option>
                      )}
                    </select>
                    {(lenderName && allCustomers && allCustomers.length > 0) && (() => {
                      const cust = allCustomers.find(c => c.id === lenderName);
                      if (!cust) return null;
                      return (
                        <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                          <Link href={`/customers/${cust.id}`} className="underline text-primary hover:text-blue-700" target="_blank">Eeg Macmiilkan</Link>
                          <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                            Dayn dhan (La Siinay): ${cust.outstandingDebt?.toLocaleString() || 0}
                          </span>
                        </div>
                      );
                    })()}
                    {validationErrors.lenderName && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.lenderName}</p>}
                    {(!allCustomers || allCustomers.length === 0) && (
                      <p className="text-orange-600 text-xs mt-1 flex items-center">
                        <Info size={14} className="inline mr-1" />
                        Ma jiraan customers-ka. <Link href="/customers/add" className="underline text-primary hover:text-blue-700">Ku dar customer cusub</Link>
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="loanDate" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Taariikhda Deynta (La Siinay) <span className="text-redError">*</span></label>
                    <input type="date" id="loanDate" required value={loanDate} onChange={(e) => setLoanDate(e.target.value)} className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.loanDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
                    {validationErrors.loanDate && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.loanDate}</p>}
                  </div>
                  <div>
                    <label htmlFor="debtAmount" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha Deynta (Macmiilka La Siinay) ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="debtAmount"
                      required
                      value={amount} // Re-use common amount
                      onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 5000"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
                  </div>
                </div>
              )}



              {/* NEW: Other Company Expense (General) */}
              {companyExpenseType === 'Other' && (
                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahin Kale</h4>
                  {/* PaidFrom field inside Other */}
                  <div className="mb-4">
                    <label htmlFor="paidFrom_other" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_other"
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
                    <label htmlFor="otherCompanyExpenseAmount" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="otherCompanyExpenseAmount"
                      required
                      value={amount} // Re-use common amount
                      onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 100"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.amount && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.amount}</p>}
                  </div>
                </div>
              )}

              {/* NEW: Maintenance & Repairs */}
              {companyExpenseType === 'Maintenance & Repairs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 animate-fade-in">
                  <h4 className="col-span-full text-base font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Dayactirka iyo Hagaajinta</h4>

                  <div>
                    <label htmlFor="assetName" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Magaca Hantida <span className="text-redError">*</span></label>
                    <input
                      type="text"
                      id="assetName"
                      required
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      placeholder="Tusaale: Computer, Printer, iwm"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.assetName ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.assetName && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.assetName}</p>}
                  </div>

                  <div>
                    <label htmlFor="repairType" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Nooca Dayactirka <span className="text-redError">*</span></label>
                    <select
                      id="repairType"
                      required
                      value={repairType}
                      onChange={(e) => setRepairType(e.target.value)}
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${validationErrors.repairType ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    >
                      {repairTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {validationErrors.repairType && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.repairType}</p>}
                  </div>

                  <div>
                    <label htmlFor="serviceProvider" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Magaca Adeeg Bixiyaha <span className="text-redError">*</span></label>
                    <input
                      type="text"
                      id="serviceProvider"
                      required
                      value={serviceProvider}
                      onChange={(e) => setServiceProvider(e.target.value)}
                      placeholder="Tusaale: Tech Solutions, iwm"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.serviceProvider ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.serviceProvider && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.serviceProvider}</p>}
                  </div>

                  <div>
                    <label htmlFor="laborHours" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Saacadaha Shaqada <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="laborHours"
                      required
                      value={laborHours}
                      onChange={(e) => setLaborHours(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 2.5"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.laborHours ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.laborHours && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.laborHours}</p>}
                  </div>

                  <div>
                    <label htmlFor="hourlyRate" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Qiimaha Saacadda ($) <span className="text-redError">*</span></label>
                    <input
                      type="number"
                      id="hourlyRate"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || '')}
                      placeholder="Tusaale: 25.00"
                      className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors.hourlyRate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                    />
                    {validationErrors.hourlyRate && <p className="text-redError text-xs mt-1 flex items-center"><Info size={14} className="inline mr-1" />{validationErrors.hourlyRate}</p>}
                  </div>

                  <div className="col-span-full">
                    <label htmlFor="paidFrom_maintenance" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Akoonka Laga Jarayo <span className="text-redError">*</span></label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                      <select
                        id="paidFrom_maintenance"
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

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Qaybaha La Isticmaalo <span className="text-redError">*</span></label>
                    <div className="space-y-3">
                      {partsUsed.map((part, index) => (
                        <div key={part.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                          <div>
                            <label htmlFor={`partName_${part.id}`} className="sr-only">Magaca Qaybta</label>
                            <input
                              type="text"
                              id={`partName_${part.id}`}
                              value={part.name}
                              onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                              placeholder="Magaca qaybta"
                              className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors[`partName_${index}`] ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                            />
                            {validationErrors[`partName_${index}`] && <p className="text-redError text-xs mt-1"><Info size={14} className="inline mr-1" />{validationErrors[`partName_${index}`]}</p>}
                          </div>
                          <div>
                            <label htmlFor={`partCost_${part.id}`} className="sr-only">Qiimaha Qaybta</label>
                            <input
                              type="number"
                              id={`partCost_${part.id}`}
                              value={part.cost}
                              onChange={(e) => updatePart(part.id, 'cost', e.target.value)}
                              placeholder="Qiimaha"
                              className={`w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${validationErrors[`partCost_${index}`] ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                            />
                            {validationErrors[`partCost_${index}`] && <p className="text-redError text-xs mt-1"><Info size={14} className="inline mr-1" />{validationErrors[`partCost_${index}`]}</p>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-darkGray dark:text-gray-100">
                              ${(parseFloat(part.cost as string) || 0).toLocaleString()}
                            </span>
                            {partsUsed.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePart(part.id)}
                                className="text-redError hover:text-red-700 p-1"
                                title="Ka saar qaybta"
                              >
                                <MinusCircle size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addPart}
                        className="bg-primary/10 text-primary py-2 px-4 rounded-lg font-semibold flex items-center hover:bg-primary hover:text-white transition-colors duration-200"
                      >
                        <Plus size={18} className="mr-2" /> Ku Dar Qayb Kale
                      </button>
                    </div>
                    {validationErrors.partsUsed && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{validationErrors.partsUsed}</p>}
                  </div>

                  <div className="col-span-full">
                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <span className="text-sm text-mediumGray dark:text-gray-400">Wadarta Qaybaha:</span>
                          <p className="text-lg font-bold text-primary dark:text-blue-300">${totalPartsCost.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-mediumGray dark:text-gray-400">Lacagta Shaqada:</span>
                          <p className="text-lg font-bold text-primary dark:text-blue-300">${totalLaborCost.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-mediumGray dark:text-gray-400">Wadarta Guud:</span>
                          <p className="text-xl font-extrabold text-primary dark:text-blue-300">${totalMaintenanceCost.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}



            </div>
          )}

          {/* General Notes */}
          <div>
            <label htmlFor="note" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Wixii faahfaahin dheeraad ah ee kharashka..."
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-secondary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Plus className="mr-2" size={20} />
            )}
            {loading ? 'Diiwaan Gelinaya Kharashka...' : 'Diiwaan Geli Kharashka'}
          </button>
        </form>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}

export default function AddExpensePage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    }>
      <AddExpenseContent />
    </React.Suspense>
  );
}


