'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Save, Calendar, DollarSign, Tag as TagIcon, Building, Landmark, Info as InfoIcon, Loader2, Plus, Trash2, ScanLine, UploadCloud, Package } from 'lucide-react';
import Toast from '@/components/common/Toast';
import { toast } from 'sonner';

interface Account { id: string; name: string; type: string; balance: number; }
interface Vendor { id: string; name: string; }

interface AssetItem {
  id: string;
  name: string;
  type: string;
  value: number | '';
  depreciationRate: number | '';
  assignedTo: string;
  purchaseDate: string;
}

export default function AddFixedAssetPage() {
  // Global settings for all assets in this batch
  const [accountId, setAccountId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [note, setNote] = useState('');
  const [purchaseDateGlobal, setPurchaseDateGlobal] = useState(new Date().toISOString().split('T')[0]);

  // List of assets
  const [assets, setAssets] = useState<AssetItem[]>([
    { id: '1', name: '', type: 'Equipment', value: '', depreciationRate: '', assignedTo: '', purchaseDate: new Date().toISOString().split('T')[0] }
  ]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, venRes] = await Promise.all([
          fetch('/api/projects/accounting/accounts'),
          fetch('/api/projects/vendors'),
        ]);
        const accData = await accRes.json();
        const venData = await venRes.json();
        setAccounts(accData.accounts || []);
        setVendors(venData.vendors || []);
      } catch (e: any) {
        console.error('Fetch error:', e);
        setToastMessage({ message: 'Cilad ayaa dhacday marka xogta la soo gelinayay. Fadlan dib u tijaabi.', type: 'error' });
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, []);

  const addAsset = () => {
    setAssets([
      ...assets,
      { id: Date.now().toString(), name: '', type: 'Equipment', value: '', depreciationRate: '', assignedTo: '', purchaseDate: purchaseDateGlobal }
    ]);
  };

  const removeAsset = (id: string) => {
    if (assets.length > 1) {
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  const updateAsset = (id: string, field: keyof AssetItem, value: any) => {
    setAssets(assets.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  // AI Receipt Analysis
  const processReceiptFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Fadlan sawir kaliya soo geli!');
      return;
    }

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

      if (data.items && Array.isArray(data.items)) {
        const newAssets = data.items.map((item: any) => ({
          id: (Date.now() + Math.random()).toString(),
          name: item.name || '',
          type: 'Equipment', // Default to equipment, user can change
          value: item.price || 0,
          depreciationRate: 0.1, // Default
          assignedTo: '',
          purchaseDate: purchaseDateGlobal
        }));
        setAssets(newAssets);
        toast.success('Rasiidka si guul leh ayaa loo akhriyay!');
      } else {
        toast.info('Wax hanti ah lagama helin rasiidka.');
      }
    } catch (error: any) {
      console.error('Error analyzing receipt:', error);
      toast.error(`Cilad AI: ${error.message || 'Lama akhrin karo'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processReceiptFile(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    assets.forEach((asset, index) => {
      if (!asset.name.trim()) newErrors[`name_${index}`] = 'Magaca waa waajib.';
      if (asset.value === '' || Number(asset.value) <= 0) newErrors[`value_${index}`] = 'Qiimaha sax geli.';
    });
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/settings/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets: assets.map(a => ({
            ...a,
            value: Number(a.value),
            depreciationRate: a.depreciationRate === '' ? undefined : Number(a.depreciationRate),
            purchaseDate: a.purchaseDate || purchaseDateGlobal
          })),
          accountId: accountId || undefined,
          vendorId: vendorId || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cilad ayaa dhacday.');
      
      setToastMessage({ message: data.message || 'Hantida si guul leh ayaa loo diiwaan geliyay.', type: 'success' });
      setAssets([{ id: '1', name: '', type: 'Equipment', value: '', depreciationRate: '', assignedTo: '', purchaseDate: purchaseDateGlobal }]);
      setNote('');
    } catch (e: any) {
      console.error('Submit error:', e);
      setToastMessage({ message: e?.message || 'Waa lala xiriiri waayay server-ka.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = assets.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-[300px] flex items-center justify-center text-mediumGray">
          <Loader2 className="animate-spin mr-2" /> Loading...
        </div>
      </Layout>
    );
  }

  const assetTypes = ['Equipment', 'Vehicle', 'Furniture', 'Building', 'IT Hardware', 'Other'];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/settings" className="text-mediumGray hover:text-primary mr-3"><ArrowLeft size={22} /></Link>
          <h1 className="text-2xl md:text-3xl font-bold text-darkGray">Ku dar Hanti Go'an (Bulk)</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Smart Scan Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
              <ScanLine className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">Smart Asset Scan</h4>
              <p className="text-xs text-blue-600 dark:text-blue-300">Cidhibtir rasiidka hantida si AI-gu ugu soo saaro xogta.</p>
            </div>
          </div>
          <div className="relative">
            <input type="file" id="aiScan" accept="image/*" onChange={handleReceiptUpload} className="hidden" disabled={isAnalyzing} />
            <label htmlFor="aiScan" className={`cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-blue-200 rounded-lg shadow-sm hover:border-blue-400 transition-all ${isAnalyzing ? 'opacity-50' : ''}`}>
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 text-blue-600" />}
              <span className="text-sm font-medium">{isAnalyzing ? 'Analyzing...' : 'Upload Receipt'}</span>
            </label>
          </div>
        </div>

        {/* Global Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-100 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center"><Landmark size={16} className="mr-1" /> Account-ka (Payment)</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <option value="">-- Dooro Account --</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center"><Building size={16} className="mr-1" /> Iibiyaha (Vendor)</label>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <option value="">-- Dooro Iibiye --</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center"><Calendar size={16} className="mr-1" /> Taariikhda Gadashada (Global)</label>
            <input type="date" value={purchaseDateGlobal} onChange={(e) => {
              setPurchaseDateGlobal(e.target.value);
              setAssets(assets.map(a => ({ ...a, purchaseDate: e.target.value })));
            }} className="w-full p-2 border rounded-lg bg-lightGray dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
            <h3 className="font-semibold flex items-center"><Package className="mr-2" size={18} /> Liiska Hantida</h3>
            <button type="button" onClick={addAsset} className="text-primary hover:text-blue-700 font-medium text-sm flex items-center">
              <Plus size={16} className="mr-1" /> Ku dar saf
            </button>
          </div>

          <div className="p-4 space-y-3">
            {assets.map((asset, index) => (
              <div key={asset.id} className="flex flex-col md:flex-row gap-3 p-3 border rounded-xl bg-gray-50/30 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800 items-start md:items-center">
                <span className="text-xs font-mono text-mediumGray w-6 hidden md:block">#{index + 1}</span>
                
                <div className="flex-1 w-full">
                  <input value={asset.name} onChange={(e) => updateAsset(asset.id, 'name', e.target.value)} placeholder="Magaca Hantida" className={`w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800 ${errors[`name_${index}`] ? 'border-redError' : 'border-gray-200 dark:border-gray-700'}`} />
                  {errors[`name_${index}`] && <p className="text-redError text-[10px] mt-0.5">{errors[`name_${index}`]}</p>}
                </div>

                <div className="w-full md:w-32">
                  <select value={asset.type} onChange={(e) => updateAsset(asset.id, 'type', e.target.value)} className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {assetTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="w-full md:w-28 relative">
                  <span className="absolute left-2 top-2 text-mediumGray text-xs">$</span>
                  <input type="number" value={asset.value} onChange={(e) => updateAsset(asset.id, 'value', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Qiimaha" className={`w-full p-2 pl-5 text-sm border rounded-lg bg-white dark:bg-gray-800 ${errors[`value_${index}`] ? 'border-redError' : 'border-gray-200 dark:border-gray-700'}`} />
                </div>

                <div className="w-full md:w-24">
                  <input type="number" step="0.01" value={asset.depreciationRate} onChange={(e) => updateAsset(asset.id, 'depreciationRate', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Dep. Rate" className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" title="Depreciation Rate (0-1)" />
                </div>

                <div className="w-full md:w-32">
                  <input value={asset.assignedTo} onChange={(e) => updateAsset(asset.id, 'assignedTo', e.target.value)} placeholder="Assigned To" className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                </div>

                <button type="button" onClick={() => removeAsset(asset.id)} className="p-2 text-mediumGray hover:text-redError transition-colors" disabled={assets.length === 1}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 flex justify-between items-center">
            <div className="text-sm font-medium text-mediumGray">Total Value: <span className="text-lg font-bold text-darkGray font-mono">${totalAmount.toLocaleString()}</span></div>
            <button type="submit" disabled={loading} className="bg-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center transition-all shadow-lg active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />} Kaydi Hantida Bulk
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium mb-1">Note (Guud)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional notes for this batch" className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 border-gray-200 dark:border-gray-600" />
        </div>
      </form>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
