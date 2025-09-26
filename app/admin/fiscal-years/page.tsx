'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Archive, CheckCircle, Clock } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import Toast from '@/components/common/Toast';

interface FiscalYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  description?: string;
  createdAt: string;
}

export default function FiscalYearsPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1,
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  const fetchFiscalYears = async () => {
    try {
      const response = await fetch('/api/fiscal-years');
      if (response.ok) {
        const data = await response.json();
        setFiscalYears(data);
      }
    } catch (error) {
      console.error('Error fetching fiscal years:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFiscalYear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/fiscal-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setToast({ message: 'Sano maaliyadeed cusub waa la abuuray!', type: 'success' });
        setShowCreateForm(false);
        setFormData({
          year: new Date().getFullYear() + 1,
          startDate: '',
          endDate: '',
          description: '',
        });
        fetchFiscalYears();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Qalad ayaa dhacay', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    }
  };

  const handleCloseFiscalYear = async (fiscalYearId: string) => {
    if (!confirm('Ma hubtaa inaad xirto sano maaliyadeedkan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/fiscal-years/${fiscalYearId}/close`, {
        method: 'POST',
      });

      if (response.ok) {
        setToast({ message: 'Sano maaliyadeed waa la xirey!', type: 'success' });
        fetchFiscalYears();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Qalad ayaa dhacay', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="w-4 h-4" />;
      case 'CLOSED':
        return <CheckCircle className="w-4 h-4" />;
      case 'ARCHIVED':
        return <Archive className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maareynta Sanadaha Maaliyadeedka</h1>
            <p className="text-gray-600">Maamul iyo xiritaanka sanadaha maaliyadeedka</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Abuur Sano Cusub
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Abuur Sano Maaliyadeed Cusub</h2>
              <form onSubmit={handleCreateFiscalYear} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sanadka
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taariikhda Bilawga
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taariikhda Dhammaadka
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sharaxaad (Ikhtiyaari)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Abuur
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Jooji
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fiscal Years List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sanadaha Maaliyadeedka</h2>
            {fiscalYears.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Weli ma jiro sanad maaliyadeed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fiscalYears.map((fiscalYear) => (
                  <div
                    key={fiscalYear.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Sanadka {fiscalYear.year}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(fiscalYear.status)}`}>
                            {getStatusIcon(fiscalYear.status)}
                            {fiscalYear.status === 'ACTIVE' ? 'Firfircoon' : 
                             fiscalYear.status === 'CLOSED' ? 'Xiran' : 'Kaydiyay'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Bilawga:</strong> {new Date(fiscalYear.startDate).toLocaleDateString('so-SO')}</p>
                          <p><strong>Dhammaadka:</strong> {new Date(fiscalYear.endDate).toLocaleDateString('so-SO')}</p>
                          {fiscalYear.description && (
                            <p><strong>Sharaxaad:</strong> {fiscalYear.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/fiscal-years/${fiscalYear.id}/reports`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Warbixinnada
                        </Link>
                        {fiscalYear.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCloseFiscalYear(fiscalYear.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Xir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}
