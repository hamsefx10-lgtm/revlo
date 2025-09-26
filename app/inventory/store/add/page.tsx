// app/inventory/store/add/page.tsx - Add New Inventory Item Page
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import {
  ArrowLeft, Plus, Box, Tag, Ruler, DollarSign, Info, Loader2, AlertTriangle // Added AlertTriangle for Min Stock
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// Define expected categories (can be fetched from API in a real app)
const itemCategories = [
  'Wood', 'Metal', 'Fabric', 'Plastic', 'Glass', 'Hardware', 'Paint & Finish', 'Tools', 'Other'
];

// Define common units (can be fetched from API in a real app)
const itemUnits = [
  'pcs', 'kg', 'meter', 'liter', 'sheet', 'box', 'roll', 'unit'
];

export default function AddInventoryItemPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); // New field
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [inStock, setInStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Alaabta waa waajib.';
    if (!category) newErrors.category = 'Qaybta waa waajib.';
    if (!unit) newErrors.unit = 'Unugga waa waajib.';
    if (typeof inStock !== 'number' || inStock < 0) newErrors.inStock = 'Tirada Stock-ga waa inuu noqdaa nambar wanaagsan ama 0.';
    if (typeof minStock !== 'number' || minStock < 0) newErrors.minStock = 'Tirada Ugu Yar ee Stock-ga waa inuu noqdaa nambar wanaagsan ama 0.';
    if (typeof purchasePrice !== 'number' || purchasePrice <= 0) newErrors.purchasePrice = 'Qiimaha Iibsiga waa inuu noqdaa nambar wanaagsan.';
    if (typeof sellingPrice !== 'number' || sellingPrice <= 0) newErrors.sellingPrice = 'Qiimaha Iibka waa inuu noqdaa nambar wanaagsan.';
    if (sellingPrice < purchasePrice) newErrors.sellingPrice = 'Qiimaha Iibka ma yaraan karo Qiimaha Iibsiga.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/inventory/store', { // API endpoint for adding inventory items
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          unit,
          inStock: inStock,
          minStock: minStock,
          purchasePrice: purchasePrice,
          sellingPrice: sellingPrice,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage({ message: data.message || 'Alaabta si guul leh ayaa loo daray!', type: 'success' });
        router.push('/inventory/store'); // Redirect to inventory list on success
      } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka alaabta la darayay.', type: 'error' });
      }
    } catch (error: any) {
      console.error('Add Inventory Item API error:', error);
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/inventory/store" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Ku Dar Alaab Cusub Bakhaarka
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
          <div>
            <label htmlFor="itemName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Alaabta <span className="text-redError">*</span></label>
            <div className="relative">
              <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="itemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tusaale: Wood Panel (Oak)"
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sharaxaad (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Sharaxaad kooban oo ku saabsan alaabtan..."
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            ></textarea>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qaybta <span className="text-redError">*</span></label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.category ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Qaybta --</option>
                  {itemCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ArrowLeft size={20} className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" />
              </div>
              {errors.category && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.category}</p>}
            </div>
            <div>
              <label htmlFor="unit" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Unugga <span className="text-redError">*</span></label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.unit ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Unugga --</option>
                  {itemUnits.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <ArrowLeft size={20} className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" />
              </div>
              {errors.unit && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.unit}</p>}
            </div>
          </div>

          {/* In Stock & Min Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="inStock" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Tirada Stock-ga <span className="text-redError">*</span></label>
              <div className="relative">
                <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="inStock"
                  value={inStock}
                  onChange={(e) => setInStock(parseFloat(e.target.value) || 0)}
                  placeholder="Tusaale: 100"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.inStock ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.inStock && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.inStock}</p>}
            </div>
            <div>
              <label htmlFor="minStock" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Tirada Ugu Yar ee Stock-ga <span className="text-redError">*</span></label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="minStock"
                  value={minStock}
                  onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                  placeholder="Tusaale: 10"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.minStock ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.minStock && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.minStock}</p>}
            </div>
          </div>

          {/* Purchase Price & Selling Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="purchasePrice" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha Iibsiga ($) <span className="text-redError">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="purchasePrice"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 5.50"
                  step="0.01"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.purchasePrice ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.purchasePrice && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.purchasePrice}</p>}
            </div>
            <div>
              <label htmlFor="sellingPrice" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha Iibka ($) <span className="text-redError">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="sellingPrice"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 8.00"
                  step="0.01"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.sellingPrice ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.sellingPrice && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.sellingPrice}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Plus className="mr-2" size={20} />
            )}
            {loading ? 'Diiwaan Gelinaya Alaabta...' : 'Diiwaan Geli Alaabta'}
          </button>
        </form>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}