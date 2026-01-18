'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileUp, CheckCircle, AlertCircle, X, Loader2, Download, Table } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

// Types for Imported Data
interface ImportedProduct {
    name: string;
    sku: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStock: number;
    description?: string;
    status: 'Valid' | 'Invalid';
    errors?: string[];
}

export default function BulkImportPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ImportedProduct[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [importStats, setImportStats] = useState({ total: 0, success: 0, failed: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- FILE HANDLING ---
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        const allowedExtensions = ['csv', 'xlsx', 'xls'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (!extension || !allowedExtensions.includes(extension)) {
            toast({
                title: 'Invalid File Type',
                description: 'Please upload a CSV or Excel file.',
                variant: 'destructive',
            });
            return;
        }

        setFile(file);
        parseFile(file);
    };

    const parseFile = async (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            let jsonData: any[] = [];

            try {
                if (file.name.endsWith('.csv')) {
                    // Simple CSV Parsing or use XLSX for CSV too
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                } else {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                }

                validateData(jsonData);
            } catch (error) {
                console.error("Error parsing file:", error);
                toast({
                    title: 'Parsing Error',
                    description: 'Failed to read file data. Ensure it is a valid Excel/CSV file.',
                    variant: 'destructive',
                });
            }
        };
        reader.readAsBinaryString(file);
    };

    const validateData = (data: any[]) => {
        const validated: ImportedProduct[] = data.map((row: any) => {
            const errors: string[] = [];

            // Map common column names
            const name = row['Name'] || row['Product Name'] || row['name'];
            const sku = row['SKU'] || row['sku'] || `GEN-${Math.floor(Math.random() * 100000)}`; // Auto-generate if missing (optional)
            const category = row['Category'] || row['category'] || 'General';
            const costPrice = parseFloat(row['Cost Price'] || row['Cost'] || row['costPrice'] || '0');
            const sellingPrice = parseFloat(row['Selling Price'] || row['Price'] || row['sellingPrice'] || '0');
            const stock = parseInt(row['Stock'] || row['Quantity'] || row['stock'] || '0');
            const minStock = parseInt(row['Min Stock'] || row['minStock'] || '5');
            const description = row['Description'] || row['description'] || '';

            if (!name) errors.push('Missing Name');
            if (sellingPrice <= 0) errors.push('Invalid Selling Price');
            if (stock < 0) errors.push('Invalid Stock');

            return {
                name, sku, category, costPrice, sellingPrice, stock, minStock, description,
                status: errors.length === 0 ? 'Valid' : 'Invalid',
                errors
            };
        });

        setPreviewData(validated);
        setStep('preview');
    };

    // --- IMPORT ACTION ---
    const handleImport = async () => {
        const validItems = previewData.filter(i => i.status === 'Valid');
        if (validItems.length === 0) {
            toast({ title: 'No valid items', description: 'Please fix errors before importing.', variant: 'destructive' });
            return;
        }

        setStep('importing');

        try {
            const response = await fetch('/api/shop/inventory/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: validItems }),
            });

            const result = await response.json();

            if (response.ok) {
                setImportStats({
                    total: validItems.length,
                    success: result.successCount,
                    failed: result.failedCount
                });
                setStep('success');
                toast({ title: 'Import Complete', description: `${result.successCount} products added successfully.` });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error(error);
            toast({ title: 'Import Failed', description: 'Server error during import.', variant: 'destructive' });
            setStep('preview'); // Go back
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'Valid') return <CheckCircle className="text-green-500" size={18} />;
        return <AlertCircle className="text-red-500" size={18} />;
    };

    // --- RENDER STEPS ---

    // 1. UPLOAD STEP
    if (step === 'upload') {
        return (
            <div className="min-h-screen animate-fade-in p-4 md:p-8 font-sans w-full max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mb-4 text-sm font-bold">
                        <X size={16} /> Cancel Import
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <FileUp size={32} />
                        </div>
                        Bulk Import Inventory
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">Upload a CSV or Excel file to add multiple products at once.</p>
                </div>

                {/* Upload Area */}
                <div
                    className={`border-3 border-dashed rounded-3xl p-16 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                        <Upload className="text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Drag & Drop your file here
                    </h3>
                    <p className="text-gray-400 mb-8">Supports CSV, XLSX, XLS. Max 5MB.</p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:shadow-xl transition-all hover:scale-105"
                    >
                        Browse Files
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleChange}
                    />
                </div>

                {/* Template Download */}
                <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                            <Table className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">Need a template?</h4>
                            <p className="text-sm text-gray-500">Download our pre-formatted Excel template to ensure smooth import.</p>
                        </div>
                    </div>
                    <a href="/api/shop/inventory/template" download className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2">
                        <Download size={18} /> Download
                    </a>
                </div>
            </div>
        );
    }

    // 2. PREVIEW STEP (Table)
    if (step === 'preview') {
        const validCount = previewData.filter(i => i.status === 'Valid').length;
        const invalidCount = previewData.length - validCount;

        return (
            <div className="min-h-screen animate-fade-in p-4 md:p-8 font-sans w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Preview Data</h1>
                        <p className="text-gray-500 text-sm mt-1">Review your data before importing. <span className="font-bold text-green-500">{validCount} Valid</span>, <span className="font-bold text-red-500">{invalidCount} Invalid</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep('upload')} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                            Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={validCount === 0}
                            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Import {validCount} Items
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-left">Product Name</th>
                                    <th className="px-6 py-4 text-left">Category</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                    <th className="px-6 py-4 text-right">Stock</th>
                                    <th className="px-6 py-4 text-left">Issues</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {previewData.map((item, idx) => (
                                    <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${item.status === 'Invalid' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center"><StatusIcon status={item.status} /></div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.name || <span className="text-red-400 italic">Missing</span>}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.category}</td>
                                        <td className="px-6 py-4 text-right font-medium">{item.sellingPrice.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-medium">{item.stock}</td>
                                        <td className="px-6 py-4 text-red-500 text-xs">
                                            {item.errors?.join(', ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // 3. IMPORTING / LOADING STEP
    if (step === 'importing') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 text-center max-w-sm w-full">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-6" size={48} />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Importing Products...</h2>
                    <p className="text-gray-500">Please wait while we process your inventory.</p>
                </div>
            </div>
        );
    }

    // 4. SUCCESS STEP
    if (step === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 text-center max-w-md w-full animate-scale-in">
                    <div className="bg-green-100 dark:bg-green-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Import Successful!</h2>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                            <span className="block text-3xl font-black text-green-500">{importStats.success}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase">Success</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                            <span className="block text-3xl font-black text-red-500">{importStats.failed}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase">Failed</span>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/shop/inventory')}
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition-all"
                    >
                        View Inventory
                    </button>
                    <button
                        onClick={() => { setStep('upload'); setFile(null); setPreviewData([]); }}
                        className="w-full py-4 mt-3 text-gray-500 font-bold hover:text-gray-700"
                    >
                        Import More
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
