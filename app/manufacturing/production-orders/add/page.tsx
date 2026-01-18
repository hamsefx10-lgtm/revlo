// app/manufacturing/production-orders/add/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Save, X, Package, Users, Calendar, Tag, FileText,
  Loader2, CheckCircle, AlertCircle, Factory, Wrench, Clock, ChevronRight,
  Beaker
} from 'lucide-react';
import Toast from '@/components/common/Toast';

interface Customer {
  id: string;
  name: string;
}

interface ProductCatalog {
  id: string;
  name: string;
  category: string;
  standardCost: number;
  sellingPrice: number;
  billOfMaterials?: any[];
}

const RawMaterialInput: React.FC<{
  index: number;
  material: any;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}> = ({ index, material, onUpdate, onRemove }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
      <div className="md:col-span-2">
        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block md:hidden">Material</label>
        <input
          type="text"
          value={material.materialName}
          onChange={(e) => onUpdate(index, 'materialName', e.target.value)}
          placeholder="e.g., Resin"
          className="w-full text-sm font-semibold bg-white dark:bg-gray-800 border-none rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block md:hidden">Qty</label>
        <input
          type="number"
          value={material.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
          className="w-full text-sm bg-white dark:bg-gray-800 border-none rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block md:hidden">Cost/Unit</label>
        <input
          type="number"
          value={material.costPerUnit}
          onChange={(e) => onUpdate(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="w-full text-sm bg-white dark:bg-gray-800 border-none rounded-lg p-2 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block md:hidden">Total</label>
        <div className="w-full text-sm font-bold text-gray-700 dark:text-gray-200 p-2 bg-transparent">
          ${(material.quantity * material.costPerUnit).toFixed(2)}
        </div>
      </div>
      <div className="flex items-center justify-end">
        <button onClick={() => onRemove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default function AddProductionOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductCatalog[]>([]);

  const [formData, setFormData] = useState({
    productName: '',
    quantity: 1000,
    status: 'PLANNED',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerId: '',
    productId: ''
  });

  const [billOfMaterials, setBillOfMaterials] = useState<any[]>([]);

  const [workOrders, setWorkOrders] = useState<any[]>([
    { stage: 'Heating', description: 'Standard heating', estimatedHours: 2 },
    { stage: 'Blowing', description: 'Standard blowing', estimatedHours: 4 },
    { stage: 'Quality Check', description: 'Standard QC', estimatedHours: 1 },
    { stage: 'Packaging', description: 'Final packaging', estimatedHours: 2 }
  ]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          fetch('/api/manufacturing/products'),
          fetch('/api/manufacturing/customers')
        ]);

        if (prodRes.ok) {
          const pData = await prodRes.json();
          setProducts(pData.products || []);
        }
        if (custRes.ok) {
          const cData = await custRes.json();
          setCustomers(cData.customers || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchResources();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        productName: product.name
      }));
      // Auto-load BOM if available in API response, otherwise keep empty or previous
      // Assuming API returns basic product info. If BOM is separate, we'd fetch it.
      // For now, reset BOM or let user add.
    } else {
      setFormData(prev => ({ ...prev, productId: '', productName: '' }));
    }
  };

  const addBillOfMaterial = () => {
    setBillOfMaterials(prev => [...prev, { materialName: '', quantity: 0, unit: 'pcs', costPerUnit: 0 }]);
  };

  const updateBillOfMaterial = (index: number, field: string, value: any) => {
    setBillOfMaterials(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeBillOfMaterial = (index: number) => {
    setBillOfMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.productName) {
      setToastMessage({ message: 'Please select a product.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        items: billOfMaterials // Send items if API supports creating BOM on the fly
        // Note: Our POST /api/manufacturing/production-orders might expect 'billOfMaterials' or similar.
        // Let's assume the API handles creation. If not, we might need to adjust.
      };

      const res = await fetch('/api/manufacturing/production-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setToastMessage({ message: 'Production Order Created!', type: 'success' });
        setTimeout(() => router.push('/manufacturing/production-orders'), 1000);
      } else {
        setToastMessage({ message: 'Failed to create order', type: 'error' });
      }
    } catch (e) {
      setToastMessage({ message: 'Error creating order', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalMaterialCost = billOfMaterials.reduce((sum, m) => sum + (m.quantity * m.costPerUnit), 0);

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">
      <div className="flex items-center gap-4">
        <Link href="/manufacturing/production-orders" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Production Order</h1>
          <p className="text-sm font-medium text-gray-500">Scheduled production run</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Factory size={18} /></div>
              Order Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full text-base font-semibold border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none"
                >
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity (Units)</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                  className="w-full text-base font-semibold border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent!</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Customer (Optional)</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                  className="w-full text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Stock Production</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600"><Wrench size={18} /></div>
              Workflow (Standard Config)
            </h3>
            <div className="space-y-4">
              {workOrders.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{stage.stage}</h4>
                    <p className="text-xs text-gray-500">{stage.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{stage.estimatedHours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Beaker size={18} /></div>
                BOM / Materials
              </h3>
              <button type="button" onClick={addBillOfMaterial} className="text-xs font-bold text-blue-600 hover:underline">+ Add Item</button>
            </div>

            <div className="space-y-2">
              {billOfMaterials.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No materials added.</p>}
              {billOfMaterials.map((item, idx) => (
                <RawMaterialInput
                  key={idx}
                  index={idx}
                  material={item}
                  onUpdate={updateBillOfMaterial}
                  onRemove={removeBillOfMaterial}
                />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Estimated Cost</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">${totalMaterialCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 mb-3 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Create Order
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>

      </form>

      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
    </div>
  );
}
