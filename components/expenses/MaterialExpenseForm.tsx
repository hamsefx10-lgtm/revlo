
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Package, AlertCircle, ScanLine, Loader2, UploadCloud } from 'lucide-react';
import { VendorSelect } from './VendorSelect';
import { toast } from 'sonner';

// Interface for Material Item
export interface MaterialItem {
    id: number;
    name: string;
    qty: number | '';
    price: number | ''; // Unit Price
    unit: string;
}

interface MaterialExpenseFormProps {
    materials: MaterialItem[];
    setMaterials: (materials: MaterialItem[]) => void;
    selectedVendor: string;
    setSelectedVendor: (vendor: string) => void;
    paymentStatus: string;
    setPaymentStatus: (status: string) => void;
    paidAmount: number | string;
    setPaidAmount: (amount: number | string) => void;
    expenseDate: string;
    setExpenseDate: (date: string) => void;
    invoiceNumber: string;
    setInvoiceNumber: (invoice: string) => void;
    totalAmount: number;
    setTotalAmount: (amount: number) => void;
    setReceiptImage: (file: File | null) => void;
    errors?: { [key: string]: string };
}

export function MaterialExpenseForm({
    materials,
    setMaterials,
    selectedVendor,
    setSelectedVendor,
    paymentStatus,
    setPaymentStatus,
    paidAmount,
    setPaidAmount,
    expenseDate,
    setExpenseDate,
    invoiceNumber,
    setInvoiceNumber,
    totalAmount,
    setTotalAmount,
    setReceiptImage,
    errors = {}
}: MaterialExpenseFormProps) {

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Calculate total whenever materials change
    useEffect(() => {
        // Only auto-calc if NOT currently analyzing (to avoid overriding AI total momentarily)
        if (!isAnalyzing) {
            const total = materials.reduce((sum, item) => {
                const qty = Number(item.qty) || 0;
                const price = Number(item.price) || 0;
                return sum + (qty * price);
            }, 0);
            if (total !== totalAmount) {
                setTotalAmount(total);
                // If status is PAID, auto-update paid amount to match new total
                if (paymentStatus === 'PAID') {
                    setPaidAmount(total);
                }
            }
        }
    }, [materials, setTotalAmount, isAnalyzing, totalAmount, paymentStatus, setPaidAmount]);

    // Handle adding a new material row
    const addMaterial = () => {
        setMaterials([
            ...materials,
            { id: Date.now(), name: '', qty: '', price: '', unit: 'pcs' }
        ]);
    };

    // Handle removing a material row
    const removeMaterial = (id: number) => {
        if (materials.length > 1) {
            setMaterials(materials.filter(m => m.id !== id));
        }
    };

    // Handle updating a material row
    const updateMaterial = (id: number, field: keyof MaterialItem, value: string | number) => {
        setMaterials(materials.map(m => {
            if (m.id === id) {
                return { ...m, [field]: value };
            }
            return m;
        }));
    };

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Set the file for final submission
        setReceiptImage(file);

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/analyze-receipt', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const data = await response.json();

            // Populate form with AI data
            if (data.items && Array.isArray(data.items)) {
                const newMaterials = data.items.map((item: any) => ({
                    id: Date.now() + Math.random(),
                    name: item.name || '',
                    qty: item.qty || 1,
                    price: item.price || 0,
                    unit: item.unit || 'pcs'
                }));
                setMaterials(newMaterials);
            }

            if (data.totalAmount) {
                setTotalAmount(Number(data.totalAmount));
            }

            // User requested to NOT fill Expense Date or Vendor automatically.
            // Keeping only Items and Total Amount.

            toast.success('Rasiidka si guul leh ayaa loo akhriyay (Alaabta kaliya)!');

        } catch (error: any) {
            console.error('Error analyzing receipt:', error);
            toast.error(`Cilad: ${error.message || 'Lama akhrin karo'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const materialUnits = ['pcs', 'kg', 'm', 'cm', 'l', 'm²', 'm³', 'ton', 'box', 'set', 'bag', 'roll', 'sheet'];

    return (
        <div className="space-y-6">

            {/* AI Receipt Upload Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                        <ScanLine className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">Smart Receipt Scan</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-300">Soo geli sawirka rasiidka, AI ayaa si toos ah u buuxinaysa foomka.</p>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        id="aiReceiptUpload"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                        disabled={isAnalyzing}
                    />
                    <label
                        htmlFor="aiReceiptUpload"
                        className={`group cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {isAnalyzing ? (
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                            <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {isAnalyzing ? 'Analyzing...' : 'Upload Receipt'}
                        </span>
                    </label>
                </div>
            </div>

            {/* 1. Vendor & Invoice Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                    <VendorSelect
                        value={selectedVendor}
                        onChange={setSelectedVendor}
                        error={errors.selectedVendor}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Invoice No. (Haddii ay jirto)
                    </label>
                    <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="e.g. INV-001"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Taariikhda
                    </label>
                    <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* 2. Materials List */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Liiska Alaabta
                    </h3>
                    <button
                        type="button"
                        onClick={addMaterial}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Ku dar Alaab
                    </button>
                </div>

                <div className="space-y-3">
                    {materials.map((item, index) => (
                        <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-400 font-mono hidden md:inline-block w-6">#{index + 1}</span>

                            {/* Name */}
                            <div className="flex-1 w-full">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateMaterial(item.id, 'name', e.target.value)}
                                    placeholder="Magaca Alaabta"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>

                            {/* Qty */}
                            <div className="w-full md:w-24">
                                <input
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => updateMaterial(item.id, 'qty', e.target.value)}
                                    placeholder="Qty"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>

                            {/* Unit */}
                            <div className="w-full md:w-28">
                                <select
                                    value={item.unit}
                                    onChange={(e) => updateMaterial(item.id, 'unit', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                >
                                    {materialUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            {/* Price */}
                            <div className="w-full md:w-32 relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">$</span>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateMaterial(item.id, 'price', e.target.value)}
                                    placeholder="Unit Price"
                                    className="w-full pl-6 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>

                            {/* Total for Row */}
                            <div className="w-full md:w-24 text-right font-medium text-gray-700 dark:text-gray-300 text-sm">
                                ${((Number(item.qty) || 0) * (Number(item.price) || 0)).toFixed(2)}
                            </div>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() => removeMaterial(item.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                disabled={materials.length === 1}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Grand Total Display */}
                <div className="flex justify-end mt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                        <span className="text-sm text-blue-800 dark:text-blue-300 mr-2">Total Amount:</span>
                        <span className="text-lg font-bold text-blue-700 dark:text-blue-200">${totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* 3. Payment Details (Partial Payment Logic) */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payment Details (Lacag bixinta)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Status
                        </label>
                        <div className="flex gap-2">
                            {['PAID', 'PARTIAL', 'UNPAID'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                        setPaymentStatus(status);
                                        if (status === 'PAID') {
                                            setPaidAmount(totalAmount);
                                        } else if (status === 'UNPAID') {
                                            setPaidAmount(0);
                                        }
                                    }}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg border ${paymentStatus === status
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {status === 'PARTIAL' ? 'Qayb' : status === 'UNPAID' ? 'Deyn' : 'Wada Bixin'}
                                </button>
                            ))}
                        </div>
                        {errors.paymentStatus && <p className="text-red-500 text-xs mt-1">{errors.paymentStatus}</p>}
                    </div>

                    {paymentStatus !== 'UNPAID' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Amount Paid (Inta la bixiyay)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    max={totalAmount}
                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            {paymentStatus === 'PARTIAL' && (
                                <p className="text-xs text-red-500 mt-1 font-medium">
                                    Remaining (Deyn noqonaysa): ${(totalAmount - (Number(paidAmount) || 0)).toFixed(2)}
                                </p>
                            )}
                            {errors.paidAmount && <p className="text-red-500 text-xs mt-1">{errors.paidAmount}</p>}
                            {errors.paidFrom && paymentStatus !== 'UNPAID' && <p className="text-red-500 text-xs mt-1">{errors.paidFrom}</p>}
                        </div>
                    )}
                </div>

                {paymentStatus === 'UNPAID' && (
                    <div className="mt-3 flex items-center text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        Warning: This entire amount (${totalAmount.toFixed(2)}) will be recorded as Debt (Deyn) on the vendor.
                    </div>
                )}
            </div>
        </div>
    );
}
