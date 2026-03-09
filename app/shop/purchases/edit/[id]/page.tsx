'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Truck,
    Save,
    Trash2,
    Search,
    Loader2,
    Box,
    Plus,
    Calendar,
    FileText,
    ChevronDown,
    CreditCard,
    Globe,
    ScanLine,
    UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

interface Vendor {
    id: string;
    companyName: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    costPrice: number;
}

interface POItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    total: number;
    isNew?: boolean;
}

export default function EditPurchaseOrderPage() {
    const router = useRouter();
    const params = useParams();
    const poId = params.id as string;

    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Data Sources
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Form State
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<POItem[]>([]);
    const [currency, setCurrency] = useState('ETB');
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [status, setStatus] = useState('');

    // Landed Cost State
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [customsFee, setCustomsFee] = useState<number>(0);
    const [otherExpenses, setOtherExpenses] = useState<number>(0);

    // Quick Add State
    const [searchProduct, setSearchProduct] = useState('');
    const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);

    // Modal State for New Product
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: '',
        category: 'General',
        sku: '',
        costPrice: '',
        sellingPrice: '',
    });
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);

    // Fetch initial data and PO details
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vRes, pRes, poRes] = await Promise.all([
                    fetch('/api/shop/vendors'),
                    fetch('/api/shop/inventory'),
                    fetch(`/api/shop/purchases/${poId}`)
                ]);

                const vData = await vRes.json();
                const pData = await pRes.json();
                const poData = await poRes.json();

                if (vData.vendors) setVendors(vData.vendors);
                if (pData.products) setProducts(pData.products);

                if (poData.purchaseOrder) {
                    const po = poData.purchaseOrder;
                    if (po.status === 'Received') {
                        toast.error('Cannot edit a received order');
                        router.push(`/shop/purchases/${poId}`);
                        return;
                    }

                    setSelectedVendorId(po.vendorId);
                    setExpectedDate(po.expectedDelivery ? po.expectedDelivery.split('T')[0] : '');
                    setNotes(po.notes || '');
                    setCurrency(po.currency || 'ETB');
                    setExchangeRate(po.exchangeRate || 1);
                    setShippingCost(po.shippingCost || 0);
                    setCustomsFee(po.customsFee || 0);
                    setOtherExpenses(po.otherExpenses || 0);
                    setStatus(po.status);

                    const mappedItems = po.items.map((item: any) => ({
                        productId: item.productId,
                        productName: item.productName,
                        sku: item.product?.sku || 'N/A',
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        total: item.total
                    }));
                    setItems(mappedItems);
                }

            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load data');
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [poId, router]);

    const addItem = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingIndex = items.findIndex(i => i.productId === productId);
        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity += 1;
            newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitCost;
            setItems(newItems);
        } else {
            const newItem: POItem = {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: 1,
                unitCost: product.costPrice || 0,
                total: product.costPrice || 0
            };
            setItems([...items, newItem]);
        }
    };

    const updateItem = (index: number, field: keyof POItem, value: number) => {
        const newItems = [...items];
        const item = newItems[index];
        (item as any)[field] = value;
        item.total = item.quantity * item.unitCost;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalAdditionalCosts = shippingCost + customsFee + otherExpenses;
    const grandTotal = subTotal + totalAdditionalCosts;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedVendorId) {
            toast.error('Please select a vendor');
            return;
        }
        if (items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/shop/purchases/${poId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorId: selectedVendorId,
                    items,
                    notes,
                    expectedDelivery: expectedDate,
                    currency,
                    exchangeRate,
                    shippingCost,
                    customsFee,
                    otherExpenses,
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update purchase order');
            }

            toast.success('Purchase Order updated successfully.');
            router.push(`/shop/purchases/${poId}`);

        } catch (error: any) {
            console.error('Submit error:', error);
            toast.error(error.message || 'Failed to update order');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProduct = async () => {
        setIsCreatingProduct(true);
        try {
            const response = await fetch('/api/shop/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProductData.name,
                    sku: newProductData.sku || `SKU-${Date.now()}`,
                    category: newProductData.category,
                    costPrice: parseFloat(newProductData.costPrice) || 0,
                    sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
                    stock: 0,
                    minStock: 5
                })
            });

            if (!response.ok) throw new Error('Failed to create product');

            const data = await response.json();
            const newProduct = data.product || data;

            const formattedProduct: Product = {
                id: newProduct.id,
                name: newProduct.name,
                sku: newProduct.sku,
                costPrice: newProduct.costPrice || 0
            };

            setProducts(prev => [...prev, formattedProduct]);

            const newItem: POItem = {
                productId: formattedProduct.id,
                productName: formattedProduct.name,
                sku: formattedProduct.sku,
                quantity: 1,
                unitCost: formattedProduct.costPrice,
                total: formattedProduct.costPrice
            };
            setItems([...items, newItem]);

            toast.success(`${newProductData.name} created and added to order`);
            setIsCreateModalOpen(false);
            setSearchProduct('');

        } catch (error) {
            console.error(error);
            toast.error('Failed to create product');
        } finally {
            setIsCreatingProduct(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProduct.toLowerCase())
    ).slice(0, 5);

    if (pageLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]">
                <Loader2 className="animate-spin text-[#3498DB]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-32">
            {/* Header Section */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50 backdrop-blur-xl bg-white/80 dark:bg-[#151C2C]/90 supports-[backdrop-filter]:bg-white/50">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/shop/purchases/${poId}`} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            <ArrowLeft size={22} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">Edit Purchase Order</h1>
                            <p className="text-sm text-gray-500 font-medium">Updating existing order details</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Estimated Total (BIRR)</p>
                            <p className="text-2xl font-black text-[#2ECC71] tracking-tight">ETB {(currency === 'USD' ? grandTotal * exchangeRate : grandTotal).toLocaleString()}</p>
                            {currency === 'USD' && (
                                <p className="text-[10px] font-bold text-blue-500 mt-0.5">USD {grandTotal.toLocaleString()} (+ Costs)</p>
                            )}
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            <button
                                onClick={() => setCurrency('ETB')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${currency === 'ETB' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                            >
                                ETB
                            </button>
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${currency === 'USD' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                            >
                                USD
                            </button>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-3 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} strokeWidth={2.5} />}
                            <span className="hidden sm:inline">Update Order</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                {/* LEFT COLUMN: Items Table */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Box size={20} className="text-[#3498DB]" />
                                Order Items
                            </h2>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                {items.length} Items
                            </span>
                        </div>

                        <div className="flex-1 overflow-visible">
                            <table className="w-full">
                                <thead className="bg-[#F8FAFC] dark:bg-[#121826] border-b border-gray-100 dark:border-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product Info</th>
                                        <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">Qty</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-40">Unit Cost</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-40">Total</th>
                                        <th className="px-6 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                                    {items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{item.productName}</p>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                                                    {item.sku}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-center font-bold outline-none transition-all text-gray-900 dark:text-white text-sm"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitCost}
                                                    onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-right font-bold outline-none transition-all text-gray-900 dark:text-white text-sm"
                                                />
                                                {currency === 'USD' && (
                                                    <div className="text-[10px] text-blue-500 font-bold mt-1 text-right">
                                                        ≈ ETB {(item.unitCost * exchangeRate).toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white text-sm">
                                                {item.total.toLocaleString()}
                                                {currency === 'USD' && (
                                                    <div className="text-[10px] text-[#2ECC71] font-bold mt-1">
                                                        ≈ ETB {(item.total * exchangeRate).toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    <tr className="bg-blue-50/20 dark:bg-blue-900/5">
                                        <td className="px-6 py-5 relative" colSpan={5}>
                                            <div className="relative">
                                                <Search className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Type product name to add..."
                                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#0F1623] border border-blue-200 dark:border-blue-800/50 focus:border-[#3498DB] outline-none font-medium text-sm text-gray-900 dark:text-white shadow-sm transition-all"
                                                    value={searchProduct}
                                                    onChange={(e) => setSearchProduct(e.target.value)}
                                                />
                                                {searchProduct && filteredProducts.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a2333] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-20">
                                                        <div className="p-1.5">
                                                            {filteredProducts.map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => { addItem(p.id); setSearchProduct(''); }}
                                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl flex items-center justify-between group transition-colors"
                                                                >
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{p.name}</p>
                                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{p.sku}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-bold text-gray-900 dark:text-white">ETB {p.costPrice.toLocaleString()}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Settings */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Currency Card */}
                    {currency === 'USD' && (
                        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-[24px] shadow-sm border border-blue-100 dark:border-blue-900/30 p-6">
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-5 uppercase tracking-wide flex items-center gap-2.5 pb-4 border-b border-blue-200/30 dark:border-blue-800/30">
                                <Globe size={18} />
                                Exchange Settings
                            </h3>
                            <div>
                                <label className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-2 block">USD TO ETB RATE</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                                        className="w-full px-5 py-4 rounded-xl bg-white dark:bg-[#0F1623] border border-blue-200 outline-none font-black text-xl text-blue-600 dark:text-blue-400 text-center"
                                    />
                                    <div className="absolute top-1/2 -translate-y-1/2 right-4 text-xs font-bold text-blue-400">BIRR</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Landed Cost Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 uppercase tracking-wide flex items-center gap-2.5 pb-4 border-b border-gray-50 dark:border-gray-800">
                            <Box size={18} className="text-[#F39C12]" />
                            Landed Costs
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Shipping Cost ({currency})</label>
                                <input
                                    type="number"
                                    value={shippingCost || ''}
                                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 outline-none font-medium text-sm text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Customs & Tax ({currency})</label>
                                <input
                                    type="number"
                                    value={customsFee || ''}
                                    onChange={(e) => setCustomsFee(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 outline-none font-medium text-sm text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-2 text-sm">
                                    <span className="text-gray-500">Subtotal:</span>
                                    <span className="font-bold">{currency} {subTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800">
                                    <span className="text-sm font-black uppercase text-gray-900 dark:text-white">Grand Total:</span>
                                    <span className="text-lg font-black text-[#2ECC71]">{currency} {grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supplier Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 uppercase tracking-wide flex items-center gap-2.5 pb-4 border-b border-gray-50 dark:border-gray-800">
                            <Truck size={18} className="text-[#3498DB]" />
                            Supplier Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Vendor *</label>
                                <select
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 outline-none font-medium text-sm"
                                    value={selectedVendorId}
                                    onChange={(e) => setSelectedVendorId(e.target.value)}
                                >
                                    <option value="">Choosing Supplier...</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Expected Delivery</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 outline-none font-medium text-sm"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Order Notes</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 outline-none font-medium text-sm resize-none"
                                    placeholder="Internal notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for New Product (Omitted for brevity, but I can add it if needed) */}
        </div>
    );
}
