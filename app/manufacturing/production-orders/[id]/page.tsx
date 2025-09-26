'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Edit, Trash2, ArrowLeft, Calendar, User, Package, Clock, DollarSign, Play, Pause, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Layout from '@/components/layouts/Layout';
import Toast from '@/components/common/Toast';

interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  notes?: string;
  customerId: string;
  productId?: string;
  customer?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
  };
  billOfMaterials?: BillOfMaterial[];
  workOrders?: WorkOrder[];
}

interface BillOfMaterial {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  notes?: string;
}

interface WorkOrder {
  id: string;
  stage: string;
  description: string;
  estimatedHours: number;
  actualHours?: number;
  status: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    fullName: string;
  };
}

export default function ViewProductionOrderPage() {
  const params = useParams();
  const router = useRouter();
  const productionOrderId = params.id as string;

  const [productionOrder, setProductionOrder] = useState<ProductionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (productionOrderId) {
      fetchProductionOrder();
    }
  }, [productionOrderId]);

  const fetchProductionOrder = async () => {
    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`);
      if (response.ok) {
        const data = await response.json();
        setProductionOrder(data);
      } else {
        setToast({ message: 'Qalad ayaa dhacay marka la soo saarayay amarka', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Ma hubtaa inaad tirtirto amarkan?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setToast({ message: 'Amarka warshadaha waa la tirtiray!', type: 'success' });
        router.push('/manufacturing');
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Qalad ayaa dhacay', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'Planned';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'COMPLETED' && { completedDate: new Date().toISOString() })
        }),
      });

      if (response.ok) {
        setToast({ message: `Status updated to ${getStatusText(newStatus)}`, type: 'success' });
        fetchProductionOrder();
      } else {
        const error = await response.json();
        setToast({ message: error.message || 'Failed to update status', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error updating status', type: 'error' });
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PLANNED':
        return 'IN_PROGRESS';
      case 'IN_PROGRESS':
        return 'COMPLETED';
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Clock size={16} />;
      case 'IN_PROGRESS':
        return <Play size={16} />;
      case 'COMPLETED':
        return <CheckCircle size={16} />;
      case 'CANCELLED':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Hoos';
      case 'MEDIUM':
        return 'Dhexe';
      case 'HIGH':
        return 'Sare';
      case 'URGENT':
        return 'Degdeg';
      default:
        return priority;
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

  if (!productionOrder) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">Amarka lama helin</p>
        </div>
      </Layout>
    );
  }

  const totalMaterialCost = (productionOrder.billOfMaterials || []).reduce((sum, bom) => sum + bom.totalCost, 0);
  const totalEstimatedHours = (productionOrder.workOrders || []).reduce((sum, wo) => sum + wo.estimatedHours, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <a href="/manufacturing" className="hover:text-blue-600">Warshadaha</a>
          <ChevronRight className="w-4 h-4" />
          <a href="/manufacturing/production-orders" className="hover:text-blue-600">Amarka Warshadaha</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{productionOrder.orderNumber}</span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{productionOrder.orderNumber}</h1>
            <p className="text-gray-600">{productionOrder.productName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/manufacturing/production-orders/${productionOrderId}/edit`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Wax ka beddel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Tirtirid...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Tirtir
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/manufacturing')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dib u noqo
            </button>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Xaaladda:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(productionOrder.status)}`}>
              {getStatusText(productionOrder.status)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Darajada:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(productionOrder.priority)}`}>
              {getPriorityText(productionOrder.priority)}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Macluumaadka Aasaasiga</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tirada</p>
                <p className="font-semibold">{productionOrder.quantity} pcs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Macmiilka</p>
                <p className="font-semibold">{productionOrder.customer?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taariikhda Dhammaadka</p>
                <p className="font-semibold">
                  {productionOrder.dueDate ? new Date(productionOrder.dueDate).toLocaleDateString('so-SO') : 'N/A'}
                </p>
              </div>
            </div>
            {productionOrder.startDate && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taariikhda Bilawga</p>
                  <p className="font-semibold">
                    {new Date(productionOrder.startDate).toLocaleDateString('so-SO')}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Qiimaha Alaabta</p>
                <p className="font-semibold">${totalMaterialCost.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saacadaha la filayo</p>
                <p className="font-semibold">{totalEstimatedHours} saac</p>
              </div>
            </div>
          </div>
          {productionOrder.notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Qoraal</p>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{productionOrder.notes}</p>
            </div>
          )}
        </div>

        {/* Bill of Materials */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Liiska Alaabta (Bill of Materials)</h2>
          {(productionOrder.billOfMaterials || []).length === 0 ? (
            <p className="text-gray-500 text-center py-4">Weli ma jiro alaab la diiwaan gelin</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Magaca Alaabta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tirada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unugga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qiimaha Unugga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qiimaha Guud
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qoraal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(productionOrder.billOfMaterials || []).map((bom, index) => (
                    <tr key={bom.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bom.materialName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bom.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bom.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${bom.costPerUnit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${bom.totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {bom.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Wadarta:
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      ${totalMaterialCost.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Work Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Amarka Shaqada (Work Orders)</h2>
          {(productionOrder.workOrders || []).length === 0 ? (
            <p className="text-gray-500 text-center py-4">Weli ma jiro heer shaqo la diiwaan gelin</p>
          ) : (
            <div className="space-y-4">
              {(productionOrder.workOrders || []).map((workOrder, index) => (
                <div key={workOrder.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{workOrder.stage}</h3>
                      <p className="text-gray-600">{workOrder.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workOrder.status)}`}>
                      {getStatusText(workOrder.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Saacadaha la filayo:</span>
                      <span className="ml-2">{workOrder.estimatedHours} saac</span>
                    </div>
                    {workOrder.actualHours && (
                      <div>
                        <span className="font-medium text-gray-700">Saacadaha dhabta ah:</span>
                        <span className="ml-2">{workOrder.actualHours} saac</span>
                      </div>
                    )}
                    {workOrder.assignedTo && (
                      <div>
                        <span className="font-medium text-gray-700">Shaqaalaha:</span>
                        <span className="ml-2">{workOrder.assignedTo?.fullName || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                  {workOrder.notes && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Qoraal:</span>
                      <p className="text-gray-600 mt-1">{workOrder.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
