'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import { 
  ArrowLeft, Edit, Trash2, Package, Truck, Calendar, DollarSign, FileText, 
  Loader2, CheckCircle, AlertCircle, User, Building, Clock, Tag
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// --- Data Interfaces ---
interface MaterialPurchase {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  vendorId: string;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
  productionOrderId?: string;
  accountId?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
  productionOrder?: {
    id: string;
    orderNumber: string;
    productName: string;
    status: string;
  };
  account?: {
    id: string;
    name: string;
    type: string;
    balance: number;
  };
}

export default function MaterialPurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<MaterialPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchPurchase(params.id as string);
    }
  }, [params.id]);

  const fetchPurchase = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manufacturing/material-purchases/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPurchase(data.materialPurchase);
      } else {
        setToastMessage({ 
          message: 'Failed to fetch purchase details', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error fetching purchase:', error);
      setToastMessage({ 
        message: 'Failed to fetch purchase details', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this purchase? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/manufacturing/material-purchases/${params.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setToastMessage({ 
          message: 'Purchase deleted successfully', 
          type: 'success' 
        });
        setTimeout(() => {
          router.push('/manufacturing/material-purchases');
        }, 1500);
      } else {
        setToastMessage({ 
          message: 'Failed to delete purchase', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      setToastMessage({ 
        message: 'Failed to delete purchase', 
        type: 'error' 
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    );
  }

  if (!purchase) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Purchase not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The purchase you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/manufacturing/material-purchases"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Purchases
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/manufacturing/material-purchases"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Details</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Material: {purchase.materialName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href={`/manufacturing/material-purchases/${purchase.id}/edit`}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Edit size={20} />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {deleting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Trash2 size={20} />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Purchase Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Material Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Package className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Material Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Material Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {purchase.materialName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Quantity
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {purchase.quantity} {purchase.unit}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Unit Price
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${purchase.unitPrice.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total Price
                  </label>
                  <p className="text-2xl font-bold text-orange-500">
                    ${purchase.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="text-blue-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vendor Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Vendor Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {purchase.vendor?.name || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Contact Person
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {purchase.vendor?.contactPerson || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Phone
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {purchase.vendor?.phone || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Email
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {purchase.vendor?.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-green-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Additional Information</h2>
              </div>
              
              <div className="space-y-4">
                {purchase.invoiceNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Invoice Number
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {purchase.invoiceNumber}
                    </p>
                  </div>
                )}
                
                {purchase.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Notes
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {purchase.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Purchase Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Purchase Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Created At
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Last Updated
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(purchase.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Production Order */}
            {purchase.productionOrder && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Production Order</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Order Number
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {purchase.productionOrder.orderNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Product Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {purchase.productionOrder.productName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Status
                    </label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      purchase.productionOrder.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      purchase.productionOrder.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {purchase.productionOrder.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Account */}
            {purchase.account && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Account</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Account Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {purchase.account.name}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Account Type
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {purchase.account.type}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Current Balance
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${purchase.account.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Message */}
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
