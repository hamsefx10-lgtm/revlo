// app/expenses/import/page.tsx - Expenses Bulk Import Page (10000% Design)
'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { 
  ArrowLeft, UploadCloud, Download, FileText, CheckCircle, XCircle, Loader2, 
  ChevronRight, ChevronLeft, Table, Columns, CheckSquare, Info, List
} from 'lucide-react';
import Toast from '@/components/common/Toast'; // Reuse Toast component

// Dummy data for expected columns and sample data
const expectedColumns = [
  { key: 'date', label: 'Taariikhda', required: true, example: '2025-07-25' },
  { key: 'description', label: 'Sharaxaad', required: true, example: 'Office Supplies' },
  { key: 'amount', label: 'Qiimaha', required: true, example: '150.00' },
  { key: 'category', label: 'Nooca', required: true, example: 'Office Supplies' },
  { key: 'project', label: 'Mashruuc (Optional)', required: false, example: 'Furniture Project A' },
  { key: 'paidFrom', label: 'Laga Bixiyay', required: true, example: 'CBE' },
  { key: 'note', label: 'Fiiro Gaar Ah (Optional)', required: false, example: 'Pens and paper' },
];

export default function ExpensesImportPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({}); // RevloKey: CsvHeader
  const [importErrors, setImportErrors] = useState<any[]>([]); // Errors during import process
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Get companyId from user context (if available)
  let companyId = '';
  try {
    companyId = require('../../../components/providers/UserProvider').useUser().user?.companyId || '';
  } catch {}

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCsvFile(file);
      setParsedData([]);
      setHeaders([]);
      setColumnMapping({});
      setImportErrors([]);
      setSheetNames([]);
      setSelectedSheet('');

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        try {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheets = workbook.SheetNames;
          setSheetNames(sheets);
          if (sheets.length > 0) {
            setSelectedSheet(sheets[0]);
            // Parse first sheet by default
            parseSheet(workbook, sheets[0]);
          }
        } catch (parseError: any) {
          setToastMessage({ message: 'Cilad ayaa dhacday marka faylka la baarayay: ' + parseError.message, type: 'error' });
          setCsvFile(null);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const parseSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!json || json.length === 0) {
      setToastMessage({ message: 'Sheet-ku waa madhan yahay.', type: 'error' });
      return;
    }
    const fileHeaders = (json[0] as string[]).map(h => h.trim());
    setHeaders(fileHeaders);
    // Smart auto-mapping: try to match by label, key, and synonyms
    const initialMap: { [key: string]: string } = {};
    expectedColumns.forEach(expCol => {
      // Try to match by key, label, or close match
      let matchedHeader = fileHeaders.find(fh => fh.toLowerCase() === expCol.key.toLowerCase());
      if (!matchedHeader) {
        matchedHeader = fileHeaders.find(fh => fh.toLowerCase() === expCol.label.toLowerCase());
      }
      if (!matchedHeader) {
        // Try to match by common synonyms (e.g. 'project' vs 'mashruuc')
        if (expCol.key === 'project') {
          matchedHeader = fileHeaders.find(fh => fh.toLowerCase().includes('project') || fh.toLowerCase().includes('mashruuc'));
        }
        if (expCol.key === 'category') {
          matchedHeader = fileHeaders.find(fh => fh.toLowerCase().includes('category') || fh.toLowerCase().includes('nooca'));
        }
        if (expCol.key === 'paidFrom') {
          matchedHeader = fileHeaders.find(fh => fh.toLowerCase().includes('account') || fh.toLowerCase().includes('akoonka') || fh.toLowerCase().includes('laga bixiyay'));
        }
      }
      if (matchedHeader) {
        initialMap[expCol.key] = matchedHeader;
      }
    });
    setColumnMapping(initialMap);
    // Parse data rows
    const fileData = json.slice(1).map((row: unknown) => {
      const arr = row as unknown[];
      const obj: { [key: string]: string } = {};
      fileHeaders.forEach((header, idx) => {
        obj[header] = arr[idx] ? String(arr[idx]).trim() : '';
      });
      return obj;
    });
    setParsedData(fileData);
    setToastMessage({ message: 'Sheet-ka si guul leh ayaa loo shubay!', type: 'success' });
    setCurrentStep(2);
  };

  const handleColumnMapChange = (revloKey: string, csvHeader: string) => {
    setColumnMapping(prev => ({ ...prev, [revloKey]: csvHeader }));
  };

  const validateMapping = () => {
    const errors: string[] = [];
    expectedColumns.filter(col => col.required).forEach(col => {
      if (!columnMapping[col.key] || columnMapping[col.key] === '') {
        errors.push(`Column-ka waajibka ah '${col.label}' lama dooran.`);
      }
    });
    if (errors.length > 0) {
      setToastMessage({ message: errors.join(' '), type: 'error' });
      return false;
    }
    return true;
  };

  const handleImportData = async () => {
    if (!validateMapping()) return;

    setLoading(true);
    setImportErrors([]);

    const recordsToImport = parsedData.map((row, rowIndex) => {
      const record: { [key: string]: any } = {};
      let isValidRow = true;
      const rowErrors: string[] = [];

      expectedColumns.forEach(expCol => {
        const csvHeader = columnMapping[expCol.key];
        const value = row[csvHeader];
        if (expCol.required && (!value || value.trim() === '')) {
          isValidRow = false;
          rowErrors.push(`Column-ka '${expCol.label}' waa waajib.`);
        }
        record[expCol.key] = value; // Assign mapped value
      });
      // Add companyId to each record
      record.companyId = companyId;
      if (!isValidRow) {
        return { row: rowIndex + 1, message: rowErrors.join(', ') };
      }
      return record;
    });
    // Filter out invalid rows for import
    const validRecords = recordsToImport.filter(rec => !rec.message);
    const errorRecords = recordsToImport.filter(rec => rec.message);
    setImportErrors(errorRecords);

    console.log('Records to import:', recordsToImport);

    // --- API Integration ---
    try {
      // Prepare JSON for FormData (for large bulk import)
      const formData = new FormData();
      formData.append('expenses', JSON.stringify(validRecords));

      const response = await fetch('/api/expenses/bulk-import', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to import expenses');
      }

      setToastMessage({ message: data.message || `Si guul leh ayaa loo dhoofiyay ${validRecords.length} kharash!`, type: 'success' });
      setCurrentStep(3); // Move to success step
      if (data.errors) setImportErrors(data.errors);
    } catch (error: any) {
      console.error('Bulk import error:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka la dhoofinayay kharashyada.', type: 'error' });
      setImportErrors(prev => [...prev, { row: 'API', message: error.message || 'Unknown API error' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = expectedColumns.map(col => col.key).join(',');
    const exampleRow = expectedColumns.map(col => col.example).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + '\n' + exampleRow);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'revlo_expenses_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage({ message: 'Template-ka waa la soo dejiyay!', type: 'success' });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6 animate-fade-in">
            <UploadCloud size={64} className="text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">Tallaabada 1: Soo Shub Faylkaaga Kharashyada</h3>
            <p className="text-mediumGray dark:text-gray-400 max-w-md mx-auto">
              Fadlan soo shub faylkaaga CSV ama Excel oo ay ku jiraan kharashyadaada. Waxaanu ku hagaynaa habka dhoofinta.
            </p>
            <input 
              type="file" 
              id="file-upload" // Added ID for label
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={handleFileChange} 
              ref={fileInputRef}
              className="hidden"
            />
            <label htmlFor="file-upload" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-blue-700 cursor-pointer transition-colors duration-200">
              <UploadCloud size={20} className="mr-2" /> Dooro Faylka
            </label>
            <button onClick={handleDownloadTemplate} className="ml-4 inline-flex items-center px-6 py-3 border border-primary text-base font-medium rounded-full text-primary bg-white hover:bg-lightGray dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <Download size={20} className="mr-2" /> Soo Deji Template
            </button>
            {sheetNames.length > 1 && (
              <div className="mt-6">
                <label htmlFor="sheet-select" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Dooro Sheet-ka Xogta</label>
                <select
                  id="sheet-select"
                  value={selectedSheet}
                  onChange={e => {
                    setSelectedSheet(e.target.value);
                    const reader = new FileReader();
                    if (csvFile) {
                      reader.onload = (ev) => {
                        const data = ev.target?.result;
                        const workbook = XLSX.read(data, { type: 'binary' });
                        parseSheet(workbook, e.target.value);
                      };
                      reader.readAsBinaryString(csvFile);
                    }
                  }}
                  className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                >
                  {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <Columns size={64} className="text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 text-center">Tallaabada 2: Isku Xir Columns-ka</h3>
            <p className="text-mediumGray dark:text-gray-400 text-center max-w-md mx-auto">
              Fadlan isku xir columns-ka faylkaaga iyo beeraha Revlo.
            </p>
            <div className="overflow-x-auto bg-lightGray dark:bg-gray-700 p-4 rounded-lg shadow-inner">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                <thead className="bg-gray-200 dark:bg-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-darkGray dark:text-gray-100 uppercase">Revlo Field</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-darkGray dark:text-gray-100 uppercase">CSV Column</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-darkGray dark:text-gray-100 uppercase">Waajib Ah</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-darkGray dark:text-gray-100 uppercase">Tusaale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {expectedColumns.map((col) => (
                    <tr key={col.key}>
                      <td className="px-4 py-2 text-darkGray dark:text-gray-100 font-medium">{col.label}</td>
                      <td className="px-4 py-2">
                        <select 
                          value={columnMapping[col.key] || ''} 
                          onChange={(e) => handleColumnMapChange(col.key, e.target.value)}
                          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-primary"
                          title={`Dooro column-ka CSV ee la xirinayo beerta '${col.label}'`}
                        >
                          <option value="">-- Dooro Column --</option>
                          {headers.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {col.required ? <CheckCircle size={20} className="text-secondary mx-auto" /> : <XCircle size={20} className="text-mediumGray mx-auto" />}
                      </td>
                      <td className="px-4 py-2 text-mediumGray dark:text-gray-300 text-sm">{col.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Data Preview */}
            {parsedData.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-3">Xogta Hordhaca ah (5 Saf oo Ugu Horreeya)</h4>
                    <div className="overflow-x-auto bg-lightGray dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                            <thead className="bg-gray-200 dark:bg-gray-600">
                                <tr>
                                    {headers.map(header => <th key={header} className="px-4 py-2 text-left text-xs font-medium text-darkGray dark:text-gray-100 uppercase">{header}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {parsedData.slice(0, 5).map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {headers.map(header => <td key={header} className="px-4 py-2 text-darkGray dark:text-gray-100 text-sm">{row[header]}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-8">
              <button onClick={() => setCurrentStep(1)} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center">
                <ChevronLeft size={20} className="mr-2" /> Dib U Noqo
              </button>
              <button onClick={handleImportData} className="bg-secondary text-white py-2 px-4 rounded-lg font-bold hover:bg-green-600 transition flex items-center" disabled={loading}>
                {loading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <CheckSquare size={20} className="mr-2" />} Dhoofi Kharashyada
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center space-y-6 animate-fade-in">
            <CheckCircle size={64} className="text-secondary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">Si Guul Leh Ayaa Loo Dhoofiyay!</h3>
            <p className="text-mediumGray dark:text-gray-400 max-w-md mx-auto">
              Kharashyadaada si guul leh ayaa loo diiwaan geliyay. Waxaad hadda ka arki kartaa bogga kharashyada.
            </p>
            {importErrors.length > 0 && (
                <div className="bg-redError/10 border border-redError text-redError p-4 rounded-lg text-left">
                    <h4 className="font-bold mb-2">Khaladaad Inta La Dhoofinayay:</h4>
                    <ul className="list-disc list-inside">
                        {importErrors.map((err, index) => (
                            <li key={index}>Saf # {err.row}: {err.message}</li> //* Changed err.errors.join(', ') to err.message */}
                        ))}
                    </ul>
                </div>
            )}
            <Link href="/expenses" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-blue-700 cursor-pointer transition-colors duration-200">
              <List size={20} className="mr-2" /> Fiiri Kharashyada
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">Dhoofinta Kharashyada</h1>
        <Link href="/expenses" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 flex items-center space-x-2">
          <ArrowLeft size={20} /> <span>Jooji</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md min-h-[500px] flex flex-col justify-center animate-fade-in-up">
        {renderStepContent()}
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
