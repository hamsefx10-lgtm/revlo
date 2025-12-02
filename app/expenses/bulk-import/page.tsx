// app/expenses/bulk-import/page.tsx - Bulk Import Expenses Page
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import { 
  ArrowLeft, Upload, FileSpreadsheet, Download, CheckCircle, XCircle, 
  Loader2, Info, ChevronRight, Building, Briefcase, Package, Users, 
  Truck, Home, CreditCard, AlertCircle, Tag
} from 'lucide-react';
import Toast from '@/components/common/Toast';

type ExpenseType = 'company' | 'project';
type SubCategory = 'Material' | 'Labor' | 'Company Labor' | 'Transport' | 'Rental' | 'Consultancy' | 'Fuel' | 'Other';

interface MaterialRow {
  name: string;
  qty: string;
  price: string;
  unit: string;
  description?: string;
  expenseDate: string;
  paidFrom: string;
  note?: string;
}

interface LaborRow {
  employeeName: string;
  wage: string;
  workDescription: string;
  expenseDate: string;
  paidFrom: string;
  note?: string;
}

export default function BulkImportExpensesPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Type, 2: Subcategory, 3: Template, 4: Upload, 5: Preview, 6: Results
  const [expenseType, setExpenseType] = useState<ExpenseType | ''>('');
  const [subCategory, setSubCategory] = useState<SubCategory | ''>('');
  const [selectedProject, setSelectedProject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch projects for project expenses
  React.useEffect(() => {
    if (expenseType === 'project') {
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => setProjects(data.projects || []))
        .catch(err => console.error('Error fetching projects:', err));
    }
  }, [expenseType]);

  // Subcategories based on expense type
  const companySubCategories: SubCategory[] = ['Material', 'Company Labor', 'Transport', 'Rental', 'Consultancy', 'Fuel', 'Other'];
  const projectSubCategories: SubCategory[] = ['Material', 'Labor', 'Transport', 'Rental', 'Consultancy', 'Fuel', 'Other'];

  const getSubCategories = () => {
    return expenseType === 'company' ? companySubCategories : projectSubCategories;
  };

  // Generate template based on subcategory
  const generateTemplate = () => {
    if (!subCategory) return;

    let headers: string[] = [];
    let sampleRow: any = {};

    switch (subCategory) {
      case 'Material':
        headers = ['Name', 'Quantity', 'Price', 'Unit', 'Description', 'ExpenseDate', 'PaidFrom', 'Note'];
        sampleRow = {
          Name: 'Cement',
          Quantity: '50',
          Price: '500',
          Unit: 'bag',
          Description: 'Cement for construction',
          ExpenseDate: new Date().toISOString().split('T')[0],
          PaidFrom: 'Cash',
          Note: 'Purchased from supplier'
        };
        break;
      case 'Labor':
      case 'Company Labor':
        headers = ['EmployeeName', 'Wage', 'WorkDescription', 'ExpenseDate', 'PaidFrom', 'Note'];
        sampleRow = {
          EmployeeName: 'Ahmed Hassan',
          Wage: '5000',
          WorkDescription: 'Construction work',
          ExpenseDate: new Date().toISOString().split('T')[0],
          PaidFrom: 'Cash',
          Note: 'Monthly salary'
        };
        break;
      case 'Transport':
        headers = ['Description', 'Amount', 'TransportType', 'ExpenseDate', 'PaidFrom', 'Note'];
        sampleRow = {
          Description: 'Taxi fare',
          Amount: '200',
          TransportType: 'Taxi',
          ExpenseDate: new Date().toISOString().split('T')[0],
          PaidFrom: 'Cash',
          Note: 'Client visit'
        };
        break;
      default:
        headers = ['Description', 'Amount', 'ExpenseDate', 'PaidFrom', 'Note'];
        sampleRow = {
          Description: 'Office supplies',
          Amount: '1000',
          ExpenseDate: new Date().toISOString().split('T')[0],
          PaidFrom: 'Cash',
          Note: 'Monthly purchase'
        };
    }

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      headers.map(h => sampleRow[h] || '').join(',')
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_template_${subCategory.toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({ message: 'Template waa la soo dejiyay!', type: 'success' });
    setStep(4); // Move to upload step
  };

  // Parse uploaded file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      let text = '';
      
      // Handle CSV files
      if (uploadedFile.name.endsWith('.csv')) {
        text = await uploadedFile.text();
      } 
      // Handle Excel files - convert to text (basic implementation)
      else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        setToastMessage({ 
          message: 'Fadlan isticmaal CSV file. Excel files waa la taageerayaa, laakiin CSV ayaa ugu fiican.', 
          type: 'info' 
        });
        // For now, ask user to convert to CSV
        setLoading(false);
        return;
      }

      // Parse CSV (handle quoted values)
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setToastMessage({ message: 'File-ka ma buuxsan yahay', type: 'error' });
        setLoading(false);
        return;
      }

      // Parse headers
      const headerLine = lines[0];
      const headers: string[] = [];
      let currentHeader = '';
      let inQuotes = false;
      
      for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(currentHeader.trim());
          currentHeader = '';
        } else {
          currentHeader += char;
        }
      }
      headers.push(currentHeader.trim());

      // Parse rows
      const rows: any[] = [];
      for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const values: string[] = [];
        let currentValue = '';
        let inQuotesRow = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotesRow = !inQuotesRow;
          } else if (char === ',' && !inQuotesRow) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }

      // Validate rows
      const errors: any[] = [];
      rows.forEach((row, index) => {
        const rowErrors: string[] = [];
        
        if (subCategory === 'Material' || subCategory === 'Company Material') {
          if (!row.Name) rowErrors.push('Name is required');
          if (!row.Quantity || isNaN(Number(row.Quantity))) rowErrors.push('Valid Quantity is required');
          if (!row.Price || isNaN(Number(row.Price))) rowErrors.push('Valid Price is required');
          if (!row.Unit) rowErrors.push('Unit is required');
        } else if (subCategory === 'Labor' || subCategory === 'Company Labor') {
          if (!row.EmployeeName) rowErrors.push('EmployeeName is required');
          if (!row.Wage || isNaN(Number(row.Wage))) rowErrors.push('Valid Wage is required');
          if (!row.WorkDescription) rowErrors.push('WorkDescription is required');
        } else {
          if (!row.Description) rowErrors.push('Description is required');
          if (!row.Amount || isNaN(Number(row.Amount))) rowErrors.push('Valid Amount is required');
        }
        
        if (!row.ExpenseDate) rowErrors.push('ExpenseDate is required');
        if (!row.PaidFrom) rowErrors.push('PaidFrom is required');

        if (rowErrors.length > 0) {
          errors.push({ row: index + 2, errors: rowErrors });
        }
      });

      setValidationErrors(errors);
      setParsedData(rows);
      setStep(5); // Move to preview step
    } catch (error) {
      console.error('Error parsing file:', error);
      setToastMessage({ message: 'Cilad ayaa dhacday marka file-ka la akhrinayay', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Import expenses
  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/expenses/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseType,
          subCategory,
          projectId: expenseType === 'project' ? selectedProject : null,
          expenses: parsedData
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportResults(result);
        setStep(6); // Move to results step
        setToastMessage({ message: `Guul! ${result.created} kharash ayaa la soo geliyay`, type: 'success' });
      } else {
        setToastMessage({ message: result.message || 'Cilad ayaa dhacday', type: 'error' });
      }
    } catch (error) {
      console.error('Error importing expenses:', error);
      setToastMessage({ message: 'Cilad server ayaa dhacday', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/expenses" className="flex items-center text-primary hover:text-blue-700 mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Dib ugu noqo Expenses
          </Link>
          <h1 className="text-3xl font-bold text-darkGray dark:text-gray-100 mb-2">
            Bulk Import Expenses
          </h1>
          <p className="text-mediumGray dark:text-gray-400">
            Soo geli kharashyada badan hal mar adigoo Excel/CSV isticmaalaya
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between max-w-3xl">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s 
                  ? 'bg-primary border-primary text-white' 
                  : 'border-lightGray dark:border-gray-700 text-mediumGray dark:text-gray-400'
              }`}>
                {step > s ? <CheckCircle size={20} /> : s}
              </div>
              {s < 6 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-primary' : 'bg-lightGray dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Expense Type */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              Dooro Nooca Kharashka
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  setExpenseType('company');
                  setStep(2);
                }}
                className="p-6 border-2 border-lightGray dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <Building size={32} className="text-primary mb-3" />
                <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-2">
                  Company Expense
                </h3>
                <p className="text-mediumGray dark:text-gray-400">
                  Kharashyada shirkadda
                </p>
              </button>
              <button
                onClick={() => {
                  setExpenseType('project');
                  setStep(2);
                }}
                className="p-6 border-2 border-lightGray dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <Briefcase size={32} className="text-primary mb-3" />
                <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-2">
                  Project Expense
                </h3>
                <p className="text-mediumGray dark:text-gray-400">
                  Kharashyada mashaariicda
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Subcategory */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              Dooro Subcategory
            </h2>
            {expenseType === 'project' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                  Dooro Mashruuca <span className="text-redError">*</span>
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100"
                >
                  <option value="">-- Dooro Mashruuca --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {getSubCategories().map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSubCategory(cat);
                    setStep(3);
                  }}
                  className="p-4 border-2 border-lightGray dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                >
                  <Tag size={24} className="text-primary mx-auto mb-2" />
                  <span className="text-darkGray dark:text-gray-100 font-medium">{cat}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-6 text-primary hover:text-blue-700"
            >
              ← Dib ugu noqo
            </button>
          </div>
        )}

        {/* Step 3: Download Template */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              Soo Deji Template
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <Info size={24} className="text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Tilmaamaha Template-ka
                  </h3>
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    Template-ka CSV ah ayaa la soo dejin doonaa. Buuxi dhammaan beeraha, 
                    kadib soo geli file-ka marka aad buuxisay.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={generateTemplate}
              className="w-full bg-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center"
            >
              <Download size={20} className="mr-2" />
              Soo Deji Template-ka CSV
            </button>
            <button
              onClick={() => setStep(2)}
              className="mt-4 text-primary hover:text-blue-700"
            >
              ← Dib ugu noqo
            </button>
          </div>
        )}

        {/* Step 4: Upload File */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              Soo Geli File-ka
            </h2>
            <div className="border-2 border-dashed border-lightGray dark:border-gray-700 rounded-lg p-12 text-center hover:border-primary transition-colors">
              <FileSpreadsheet size={48} className="text-primary mx-auto mb-4" />
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition duration-200 inline-block mb-4"
              >
                <Upload size={20} className="inline mr-2" />
                Dooro File-ka
              </label>
              {file && (
                <p className="text-mediumGray dark:text-gray-400 mt-4">
                  {file.name}
                </p>
              )}
            </div>
            {loading && (
              <div className="mt-6 text-center">
                <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                <p className="text-mediumGray dark:text-gray-400 mt-2">File-ka la akhrinayaa...</p>
              </div>
            )}
            <button
              onClick={() => setStep(3)}
              className="mt-6 text-primary hover:text-blue-700"
            >
              ← Dib ugu noqo
            </button>
          </div>
        )}

        {/* Step 5: Preview */}
        {step === 5 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              Dib u eeg Kharashyada ({parsedData.length} kharash)
            </h2>
            {validationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-redError mr-2 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-redError mb-2">
                      Cilado Validation ({validationErrors.length})
                    </h3>
                    {validationErrors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-700 dark:text-red-300">
                        Row {err.row}: {err.errors.join(', ')}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full">
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    {Object.keys(parsedData[0] || {}).map((key) => (
                      <th key={key} className="px-4 py-3 text-left text-sm font-semibold text-darkGray dark:text-gray-100">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                  {parsedData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className={validationErrors.some(e => e.row === idx + 2) ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      {Object.values(row).map((val: any, i) => (
                        <td key={i} className="px-4 py-3 text-sm text-mediumGray dark:text-gray-300">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <p className="text-center text-mediumGray dark:text-gray-400 mt-4">
                  ... iyo {parsedData.length - 10} kharash oo kale
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleImport}
                disabled={loading || validationErrors.length > 0}
                className="flex-1 bg-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    La soo gelinayaa...
                  </>
                ) : (
                  <>
                    <Upload size={20} className="mr-2" />
                    Soo Geli Kharashyada
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-4 border border-lightGray dark:border-gray-700 rounded-lg text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700"
              >
                Dib ugu noqo
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Results */}
        {step === 6 && importResults && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6">
              Natijada Soo Gelinta
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-300">
                      {importResults.created} kharash ayaa si guul leh loo soo geliyay
                    </h3>
                  </div>
                </div>
              </div>
              {importResults.skipped > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <div className="flex items-center">
                    <AlertCircle size={24} className="text-yellow-600 dark:text-yellow-400 mr-3" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">
                        {importResults.skipped} kharash ayaa la iska dhaafay
                      </h3>
                    </div>
                  </div>
                </div>
              )}
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <div className="flex items-start">
                    <XCircle size={24} className="text-redError mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-redError mb-2">
                        {importResults.errors.length} Cilado
                      </h3>
                      {importResults.errors.map((err: any, idx: number) => (
                        <p key={idx} className="text-sm text-red-700 dark:text-red-300">
                          {err.message}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => router.push('/expenses')}
                className="flex-1 bg-primary text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md"
              >
                Eeg Kharashyada
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setExpenseType('');
                  setSubCategory('');
                  setFile(null);
                  setParsedData([]);
                  setImportResults(null);
                }}
                className="px-6 py-4 border border-lightGray dark:border-gray-700 rounded-lg text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700"
              >
                Soo Geli Kharash Kale
              </button>
            </div>
          </div>
        )}

        {toastMessage && (
          <Toast
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    </Layout>
  );
}

