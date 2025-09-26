'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Save, X, Package, Users, Calendar, Tag, FileText, 
  Loader2, CheckCircle, AlertCircle, Factory, Wrench, Clock, ChevronRight,
  ShoppingCart, Truck, Receipt, DollarSign, Info
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// --- Data Interfaces ---
interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface Material {
  id: number;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export default function AddMaterialPurchasePage() {
  const router = useRouter();

  // Form data state
  const [formData, setFormData] = useState({
    vendorId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: '',
    productionOrderId: '',
    accountId: ''
  });

  // Materials array for multiple materials
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: 1,
      materialName: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      totalPrice: 0
    }
  ]);

  // Other state variables
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchVendors();
    fetchProductionOrders();
    fetchAccounts();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      const response = await fetch('/api/manufacturing/production-orders');
      if (response.ok) {
        const data = await response.json();
        setProductionOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching production orders:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Material management functions
  const addMaterial = () => {
    const newMaterial: Material = {
      id: Date.now(),
      materialName: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      totalPrice: 0
    };
    setMaterials([...materials, newMaterial]);
  };

  const removeMaterial = (materialId: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== materialId));
    }
  };

  const updateMaterial = (materialId: number, field: keyof Material, value: string | number) => {
    setMaterials(materials.map(material => {
      if (material.id === materialId) {
        const updatedMaterial = { ...material, [field]: value };
        // Recalculate total price when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedMaterial.totalPrice = updatedMaterial.quantity * updatedMaterial.unitPrice;
        }
        return updatedMaterial;
      }
      return material;
    }));
  };

  // Input change handler
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate total purchase amount
  const totalPurchaseAmount = materials.reduce((sum, material) => sum + material.totalPrice, 0);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.vendorId) {
        setToastMessage({ message: 'Fadlan dooro iibiyaha', type: 'error' });
        setLoading(false);
        return;
      }

      if (!formData.accountId) {
        setToastMessage({ message: 'Fadlan dooro akoonka lacag bixinta', type: 'error' });
        setLoading(false);
        return;
      }

      // Validate materials
      for (const material of materials) {
        if (!material.materialName || material.quantity <= 0 || material.unitPrice <= 0) {
          setToastMessage({ message: 'Fadlan buuxi dhammaan faahfaahinta alaabta si sax ah', type: 'error' });
          setLoading(false);
          return;
        }
      }

      // Submit each material as a separate purchase
      const promises = materials.map(material => 
        fetch('/api/manufacturing/material-purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            materialName: material.materialName,
            quantity: material.quantity,
            unit: material.unit,
            unitPrice: material.unitPrice,
            totalPrice: material.totalPrice,
            vendorId: formData.vendorId,
            purchaseDate: formData.purchaseDate,
            invoiceNumber: formData.invoiceNumber,
            notes: formData.notes,
            productionOrderId: formData.productionOrderId || null,
            accountId: formData.accountId
          }),
        })
      );

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        setToastMessage({ 
          message: `Si guul leh ayaa loo abuuray ${materials.length} iib alaabta!`, 
          type: 'success' 
        });
        
        // Reset form after successful submission
        setTimeout(() => {
          router.push('/manufacturing/material-purchases');
        }, 2000);
      } else {
        setToastMessage({ 
          message: 'Qaar ka mid ah iibyada lama abuurin. Fadlan hubi oo isku day mar kale.', 
          type: 'error' 
        });
      }
    } catch (error: any) {
      console.error('Error creating material purchase:', error);
      setToastMessage({ 
        message: error.message || 'Lama abuurin iibka alaabta. Fadlan isku day mar kale.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Mobile-Responsive Header */}
        <div className="flex items-center gap-3 lg:gap-4">
          <Link 
            href="/manufacturing/material-purchases" 
            className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">Ku Dar Iibka Alaabta</h1>
            <p className="text-mediumGray dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">Diiwaan geli iibka alaabta cusub ee warshadaha</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Materials List */}
              <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 gap-4">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <Package className="text-primary" size={20} />
                    <h2 className="text-lg lg:text-xl font-bold text-darkGray dark:text-gray-100">Alaabta ({materials.length})</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base"
                  >
                    <Plus size={16} />
                    Ku Dar Alaab
                  </button>
                </div>

                <div className="space-y-4">
                  {materials.map((material) => (
                    <div key={material.id} className="border border-lightGray dark:border-gray-600 rounded-lg p-3 lg:p-4">
                      <div className="flex items-center justify-between mb-3 lg:mb-4">
                        <h3 className="text-base lg:text-lg font-semibold text-darkGray dark:text-gray-100">
                          Alaab {materials.findIndex(m => m.id === material.id) + 1}
                        </h3>
                        {materials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMaterial(material.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                            Magaca Alaabta *
                          </label>
                          <input
                            type="text"
                            value={material.materialName}
                            onChange={(e) => updateMaterial(material.id, 'materialName', e.target.value)}
                            className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                            placeholder="Geli magaca alaabta"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                              Tirada *
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={material.quantity}
                              onChange={(e) => updateMaterial(material.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                              Unugga *
                            </label>
                            <select
                              value={material.unit}
                              onChange={(e) => updateMaterial(material.id, 'unit', e.target.value)}
                              className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                              required
                            >
                              <option value="pcs">Qaybaha</option>
                              <option value="kg">Kiilogram</option>
                              <option value="lbs">Pound</option>
                              <option value="m">Mitir</option>
                              <option value="ft">Cagaha</option>
                              <option value="sqm">Mitir Laba Jibbaaran</option>
                              <option value="sqft">Cag Laba Jibbaaran</option>
                              <option value="l">Litar</option>
                              <option value="gal">Gallon</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                            Qiimaha Unugga *
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={material.unitPrice}
                            onChange={(e) => updateMaterial(material.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                            Qiimaha Wadar
                          </label>
                          <input
                            type="text"
                            value={`$${material.totalPrice.toFixed(2)}`}
                            readOnly
                            className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-darkGray dark:text-gray-100 text-sm lg:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Purchase Amount */}
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-primary">Wadarta Iibka:</span>
                    <span className="text-2xl font-bold text-primary">${totalPurchaseAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Vendor Information */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="text-secondary" size={24} />
                  <h2 className="text-xl font-bold text-darkGray dark:text-gray-100">Macluumaadka Iibiyaha</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Iibiyaha *
                    </label>
                    <select
                      value={formData.vendorId}
                      onChange={(e) => handleInputChange('vendorId', e.target.value)}
                      className="w-full p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Dooro iibiyaha...</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name} {vendor.contactPerson ? `(${vendor.contactPerson})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Taariikhda Iibka *
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      className="w-full p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Lambarka Qaansheegta
                    </label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      className="w-full p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Geli lambarka qaansheegta (ikhtiyaari)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Akoonka Lacag Bixinta *
                    </label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => handleInputChange('accountId', e.target.value)}
                      className="w-full p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Dooro akoonka lacag bixinta...</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} - {account.type} (${account.balance.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Fiiro Gaar Ah
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Wixii fiiro gaar ah oo ku saabsan iibkan..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Production Order Link */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Factory className="text-accent" size={24} />
                  <h2 className="text-xl font-bold text-darkGray dark:text-gray-100">Xiriirka Amarka Warshadaha</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
                      Xiriirka Amarka Warshadaha (Ikhtiyaari)
                    </label>
                    <select
                      value={formData.productionOrderId}
                      onChange={(e) => handleInputChange('productionOrderId', e.target.value)}
                      className="w-full p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Ma jiraan xiriir amark warshadaha</option>
                      {productionOrders.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.orderNumber} - {order.productName} ({order.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">Xiriirka Amarka Warshadaha</p>
                        <p>Xiriir iibkan amark warshadaha gaar ah si aad u socoddo isticmaalka alaabta iyo kharashka mashaariicda warshadaha. Tani waa ikhtiyaari laakiin waa la soo jeediyay si loo wanaajiyo socodka kharashka.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-6 rounded-xl shadow-lg border border-primary/20">
                <h3 className="text-lg font-semibold text-primary mb-4">Koobka Iibka</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-darkGray dark:text-gray-100">Tirada Alaabta:</span>
                    <span className="font-medium text-darkGray dark:text-gray-100">{materials.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-darkGray dark:text-gray-100">Iibiyaha:</span>
                    <span className="font-medium text-darkGray dark:text-gray-100">
                      {vendors.find(v => v.id === formData.vendorId)?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-darkGray dark:text-gray-100">Taariikhda Iibka:</span>
                    <span className="font-medium text-darkGray dark:text-gray-100">
                      {new Date(formData.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-primary/20 pt-2">
                    <span className="text-lg font-semibold text-primary">Wadarta Lacagta:</span>
                    <span className="text-xl font-bold text-primary">${totalPurchaseAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/manufacturing/material-purchases"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-darkGray dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Jooji
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Abuuritaanka...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Abuur Iibka
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Layout>
  );
}