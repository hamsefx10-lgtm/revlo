'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Save, Calendar, DollarSign, Tag as TagIcon, Building, Landmark, Info as InfoIcon, Loader2 } from 'lucide-react';
import Toast from '@/components/common/Toast';

interface Account { id: string; name: string; type: string; balance: number; }
interface Vendor { id: string; name: string; }

export default function AddFixedAssetPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState('Equipment');
  const [value, setValue] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedTo, setAssignedTo] = useState('');
  const [depreciationRate, setDepreciationRate] = useState<number | ''>('');
  const [accountId, setAccountId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [note, setNote] = useState('');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [accRes, venRes] = await Promise.all([
          fetch('/api/accounting/accounts'),
          fetch('/api/vendors'),
        ]);
        const accData = await accRes.json();
        const venData = await venRes.json();
        setAccounts(accData.accounts || []);
        setVendors(venData.vendors || []);
      } catch (e: any) {
        setToastMessage({ message: e?.message || 'Cilad ayaa dhacday marka xogta la gelinayay.', type: 'error' });
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Magaca waa waajib.';
    if (!type) newErrors.type = 'Nooca waa waajib.';
    if (value === '' || Number(value) <= 0) newErrors.value = 'Qiimaha sax geli.';
    if (!purchaseDate) newErrors.purchaseDate = 'Taariikhda waa waajib.';
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
          name,
          type,
          value: Number(value),
          purchaseDate,
          assignedTo: assignedTo || undefined,
          depreciationRate: depreciationRate === '' ? undefined : Number(depreciationRate),
          accountId: accountId || undefined,
          vendorId: vendorId || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cilad ayaa dhacday.');
      setToastMessage({ message: 'Hanti go\'an waa la diiwaan geliyay. Transaction-kuna wuxuu noqday Fixed Asset Purchase.', type: 'success' });
      setName(''); setType('Equipment'); setValue(''); setAssignedTo(''); setDepreciationRate(''); setAccountId(''); setVendorId(''); setNote('');
    } catch (e: any) {
      setToastMessage({ message: e?.message || 'Cilad ayaa dhacday marka la dirayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-[300px] flex items-center justify-center text-mediumGray">
          <Loader2 className="animate-spin mr-2" /> Loading...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <Link href="/settings" className="text-mediumGray hover:text-primary mr-3"><ArrowLeft size={22} /></Link>
        <h1 className="text-2xl md:text-3xl font-bold text-darkGray">Ku dar Hanti Go\'an</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Magaca <span className="text-redError">*</span></label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={18} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tusaale: Mashiinka CNC" className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
            </div>
            {errors.name && <p className="text-redError text-xs mt-1 flex items-center"><InfoIcon size={14} className="mr-1"/>{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nooca <span className="text-redError">*</span></label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 ${errors.type ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}>
              <option>Equipment</option>
              <option>Vehicle</option>
              <option>Furniture</option>
              <option>Building</option>
              <option>IT Hardware</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Qiimaha ($) <span className="text-redError">*</span></label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={18} />
              <input type="number" value={value} onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))} placeholder="10000" className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 ${errors.value ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
            </div>
            {errors.value && <p className="text-redError text-xs mt-1 flex items-center"><InfoIcon size={14} className="mr-1"/>{errors.value}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Taariikhda Gadashada <span className="text-redError">*</span></label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={18} />
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 ${errors.purchaseDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`} />
            </div>
            {errors.purchaseDate && <p className="text-redError text-xs mt-1 flex items-center"><InfoIcon size={14} className="mr-1"/>{errors.purchaseDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Account-ka laga bixinayo</label>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={18} />
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700">
                <option value="">-- Dooro Account --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type}) - ${acc.balance.toLocaleString()}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-mediumGray mt-1">Haddii account la doorto, waxaa si toos ah u abuurmaya transaction "Fixed Asset Purchase" oo ka dhimi doona account-ka.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Iibiyaha</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={18} />
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700">
                <option value="">-- Dooro Iibiye --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Depreciation Rate (0-1)</label>
            <input type="number" step="0.01" value={depreciationRate} onChange={(e) => setDepreciationRate(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.15" className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assigned To (optional)</label>
            <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Dept/Person" className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional notes" className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="bg-primary text-white px-5 py-3 rounded-lg font-semibold flex items-center disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>} Kaydi Hantida
          </button>
        </div>
      </form>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
