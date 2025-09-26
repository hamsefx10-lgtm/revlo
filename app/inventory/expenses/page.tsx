// app/inventory/expenses/page.tsx - Company Material Expenses Usage Report
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, List, LayoutGrid } from 'lucide-react';
import Layout from '../../../components/layouts/Layout';
import { Box, Tag, DollarSign, Calendar, ClipboardList } from 'lucide-react';
import Toast from '../../../components/common/Toast';

// --- Expense Material Data Interface ---
interface ExpenseMaterial {
  id: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
  expenseDate: string;
  note?: string;
}

export default function CompanyMaterialExpensesPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<ExpenseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/expenses?category=Material&projectId=null');
        if (!response.ok) throw new Error('Failed to fetch company material expenses');
        const data = await response.json();
        // Flatten all materials from expenses
        const allMaterials: ExpenseMaterial[] = [];
        for (const exp of data.expenses) {
          if (Array.isArray(exp.materials)) {
            exp.materials.forEach((mat: any) => {
              allMaterials.push({
                id: exp.id,
                name: mat.name,
                qty: mat.qty,
                price: mat.price,
                unit: mat.unit,
                expenseDate: exp.expenseDate,
                note: exp.note,
              });
            });
          }
        }
        setMaterials(allMaterials);
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // --- Statistics ---
  const totalRecords = materials.length;
  const totalQty = materials.reduce((sum, mat) => sum + mat.qty, 0);
  const totalCost = materials.reduce((sum, mat) => sum + (mat.qty * mat.price), 0);
  const uniqueMaterials = Array.from(new Set(materials.map(mat => mat.name))).length;

  // --- Search & View State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // --- Filtered Materials ---
  const filteredMaterials = materials.filter(mat =>
    mat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>

      <div className="w-full min-h-[90vh] bg-[#f6f8fa] dark:bg-gray-900 py-4 px-2 md:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 mb-4 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow hover:bg-primary/10 dark:hover:bg-primary/20 text-darkGray dark:text-gray-100 font-semibold transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center md:text-left text-darkGray dark:text-gray-100">Kharashyada Alaabta Shirkadda (Company Material Expenses)</h2>
        {/* Statistics Cards - Responsive */}
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6 flex flex-col items-center">
            <span className="text-base md:text-lg font-semibold mb-1 md:mb-2">Wadarta Diiwaanka</span>
            <span className="text-xl md:text-3xl font-bold text-primary">{totalRecords}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6 flex flex-col items-center">
            <span className="text-base md:text-lg font-semibold mb-1 md:mb-2">Wadarta Qty</span>
            <span className="text-xl md:text-3xl font-bold text-secondary">{totalQty}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6 flex flex-col items-center">
            <span className="text-base md:text-lg font-semibold mb-1 md:mb-2">Wadarta Qiimaha</span>
            <span className="text-xl md:text-3xl font-bold text-redError">${totalCost.toLocaleString()}</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6 flex flex-col items-center">
            <span className="text-base md:text-lg font-semibold mb-1 md:mb-2">Noocyada Alaabta</span>
            <span className="text-xl md:text-3xl font-bold text-accent">{uniqueMaterials}</span>
          </div>
        </div>

        {/* Search & View Switcher - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-2 md:gap-4">
          <input
            type="text"
            placeholder="Search by material name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border border-lightGray dark:border-gray-700 rounded-lg px-3 py-2 w-full sm:w-1/2 md:w-1/3"
          />
          <div className="flex space-x-2 justify-end">
            <button
              className={`px-3 py-2 rounded-lg font-semibold text-xs md:text-base flex items-center space-x-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
              <span>List View</span>
            </button>
            <button
              className={`px-3 py-2 rounded-lg font-semibold text-xs md:text-base flex items-center space-x-2 ${viewMode === 'board' ? 'bg-secondary text-white' : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100'}`}
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid size={16} />
              <span>Board View</span>
            </button>
          </div>
        </div>

        {toastMessage && <Toast {...toastMessage} onClose={() => setToastMessage(null)} />}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto rounded-xl shadow-lg bg-white dark:bg-gray-800">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-[#f0f4f8] dark:bg-gray-700 border-b-2 border-primary">
                  <th className="p-2 md:p-4 text-left text-darkGray dark:text-gray-100">Alaabta</th>
                  <th className="p-2 md:p-4 text-left text-darkGray dark:text-gray-100">Nooca</th>
                  <th className="p-2 md:p-4 text-left text-darkGray dark:text-gray-100">Unit</th>
                  <th className="p-2 md:p-4 text-right text-darkGray dark:text-gray-100">Qty</th>
                  <th className="p-2 md:p-4 text-right text-darkGray dark:text-gray-100">Qiimaha</th>
                  <th className="p-2 md:p-4 text-left text-darkGray dark:text-gray-100">Taariikhda</th>
                  <th className="p-2 md:p-4 text-left text-darkGray dark:text-gray-100">Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 md:py-8">Ma jiro kharash alaab shirkad ah oo la helay.</td></tr>
                ) : (
                  filteredMaterials.map((mat, idx) => (
                    <tr key={mat.id + idx} className="border-b last:border-b-0 hover:bg-[#f6f8fa] dark:hover:bg-gray-900 transition-colors">
                      <td className="p-2 md:p-4 font-medium flex items-center space-x-2"><Box size={16}/> <span>{mat.name}</span></td>
                      <td className="p-2 md:p-4 text-mediumGray"><Tag size={14}/> Material</td>
                      <td className="p-2 md:p-4 text-mediumGray">{mat.unit}</td>
                      <td className="p-2 md:p-4 text-right">{mat.qty}</td>
                      <td className="p-2 md:p-4 text-right">${mat.price}</td>
                      <td className="p-2 md:p-4">{mat.expenseDate ? (new Date(mat.expenseDate).toLocaleDateString() !== 'Invalid Date' ? new Date(mat.expenseDate).toLocaleDateString() : '-') : '-'}</td>
                      <td className="p-2 md:p-4">{mat.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 animate-fade-in-up">
            {filteredMaterials.length === 0 ? (
              <div className="col-span-full text-center py-6 md:py-8">Ma jiro kharash alaab shirkad ah oo la helay.</div>
            ) : (
              filteredMaterials.map((mat, idx) => (
                <div key={mat.id + idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 flex flex-col space-y-2 border-l-4 border-primary hover:shadow-xl transition-shadow">
                  <div className="flex items-center space-x-2 mb-1 md:mb-2">
                    <Box size={20} className="text-primary" />
                    <span className="font-bold text-base md:text-lg text-darkGray dark:text-gray-100">{mat.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-mediumGray text-xs md:text-sm">
                    <Tag size={16}/> <span>Material</span>
                  </div>
                  <div className="flex items-center space-x-2 text-mediumGray text-xs md:text-sm">
                    <ClipboardList size={16}/> <span>Qty: {mat.qty} {mat.unit}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-mediumGray text-xs md:text-sm">
                    <DollarSign size={16}/> <span>Qiimaha: ${mat.price}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-mediumGray text-xs md:text-sm">
                    <Calendar size={16}/> <span>{mat.expenseDate ? (new Date(mat.expenseDate).toLocaleDateString() !== 'Invalid Date' ? new Date(mat.expenseDate).toLocaleDateString() : '-') : '-'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-mediumGray text-xs md:text-sm">
                    <span className="font-semibold">Note:</span> <span>{mat.note || '-'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
