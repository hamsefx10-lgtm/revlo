'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Plus, Trash2, Save, X } from 'lucide-react';
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
  billOfMaterials: BillOfMaterial[];
  workOrders: WorkOrder[];
}

interface BillOfMaterial {
  id?: string;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  notes?: string;
}

interface WorkOrder {
  id?: string;
  stage: string;
  description: string;
  estimatedHours: number;
  actualHours?: number;
  status: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  assignedToId?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  fullName: string;
}

interface Product {
  id: string;
  name: string;
}

export default function EditProductionOrderPage() {
  const params = useParams();
  const router = useRouter();
  const productionOrderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    orderNumber: '',
    productName: '',
    quantity: 1,
    status: 'PENDING',
    priority: 'MEDIUM',
    startDate: '',
    dueDate: '',
    notes: '',
    customerId: '',
    productId: '',
  });

  const [billOfMaterials, setBillOfMaterials] = useState<BillOfMaterial[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (productionOrderId) {
      fetchProductionOrder();
      fetchCustomers();
      fetchEmployees();
      fetchProducts();
    }
  }, [productionOrderId]);

  const fetchProductionOrder = async () => {
    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          orderNumber: data.orderNumber,
          productName: data.productName,
          quantity: data.quantity,
          status: data.status,
          priority: data.priority,
          startDate: data.startDate ? data.startDate.split('T')[0] : '',
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
          notes: data.notes || '',
          customerId: data.customerId,
          productId: data.productId || '',
        });
        setBillOfMaterials(data.billOfMaterials || []);
        setWorkOrders(data.workOrders || []);
      } else {
        setToast({ message: 'Qalad ayaa dhacay marka la soo saarayay amarka', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/manufacturing/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addBillOfMaterial = () => {
    setBillOfMaterials(prev => [...prev, {
      materialName: '',
      quantity: 1,
      unit: 'pcs',
      costPerUnit: 0,
      totalCost: 0,
      notes: ''
    }]);
  };

  const updateBillOfMaterial = (index: number, field: keyof BillOfMaterial, value: any) => {
    setBillOfMaterials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Calculate total cost
      if (field === 'quantity' || field === 'costPerUnit') {
        updated[index].totalCost = updated[index].quantity * updated[index].costPerUnit;
      }
      
      return updated;
    });
  };

  const removeBillOfMaterial = (index: number) => {
    setBillOfMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const addWorkOrder = () => {
    setWorkOrders(prev => [...prev, {
      stage: '',
      description: '',
      estimatedHours: 1,
      status: 'PENDING',
      notes: ''
    }]);
  };

  const updateWorkOrder = (index: number, field: keyof WorkOrder, value: any) => {
    setWorkOrders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeWorkOrder = (index: number) => {
    setWorkOrders(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/manufacturing/production-orders/${productionOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          billOfMaterials,
          workOrders,
        }),
      });

      if (response.ok) {
        setToast({ message: 'Amarka warshadaha waa la cusboonaysiiyay!', type: 'success' });
        router.push('/manufacturing');
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Qalad ayaa dhacay', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Qalad ayaa dhacay', type: 'error' });
    } finally {
      setSaving(false);
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
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <a href="/manufacturing" className="hover:text-blue-600">Warshadaha</a>
          <ChevronRight className="w-4 h-4" />
          <a href="/manufacturing/production-orders" className="hover:text-blue-600">Amarka Warshadaha</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Wax ka beddel</span>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Wax ka beddel Amarka Warshadaha</h1>
          <button
            onClick={() => router.push('/manufacturing')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Jooji
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Macluumaadka Aasaasiga</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lambarka Amarka *
                </label>
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Magaca Alaabta *
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tirada *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xaaladda
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">La sugayo</option>
                  <option value="IN_PROGRESS">Warshadaha</option>
                  <option value="COMPLETED">Dhammaaday</option>
                  <option value="CANCELLED">La joojiyay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Darajada
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Hoos</option>
                  <option value="MEDIUM">Dhexe</option>
                  <option value="HIGH">Sare</option>
                  <option value="URGENT">Degdeg</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taariikhda Bilawga
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taariikhda Dhammaadka
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Macmiilka
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Dooro macmiilka</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alaabta Kataloogga
                </label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Dooro alaabta</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qoraal
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Qoraal ku saabsan amarka..."
              />
            </div>
          </div>

          {/* Bill of Materials */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Liiska Alaabta (Bill of Materials)</h2>
              <button
                type="button"
                onClick={addBillOfMaterial}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ku dar
              </button>
            </div>
            <div className="space-y-4">
              {billOfMaterials.map((bom, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Alaabta {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeBillOfMaterial(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Magaca Alaabta
                      </label>
                      <input
                        type="text"
                        value={bom.materialName}
                        onChange={(e) => updateBillOfMaterial(index, 'materialName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Magaca alaabta"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tirada
                      </label>
                      <input
                        type="number"
                        value={bom.quantity}
                        onChange={(e) => updateBillOfMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unugga
                      </label>
                      <select
                        value={bom.unit}
                        onChange={(e) => updateBillOfMaterial(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pcs">pcs</option>
                        <option value="kg">kg</option>
                        <option value="m">m</option>
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
                        <option value="L">L</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qiimaha Unugga
                      </label>
                      <input
                        type="number"
                        value={bom.costPerUnit}
                        onChange={(e) => updateBillOfMaterial(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qiimaha Guud
                      </label>
                      <input
                        type="number"
                        value={bom.totalCost}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qoraal
                      </label>
                      <input
                        type="text"
                        value={bom.notes || ''}
                        onChange={(e) => updateBillOfMaterial(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Qoraal"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Work Orders */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Amarka Shaqada (Work Orders)</h2>
              <button
                type="button"
                onClick={addWorkOrder}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ku dar
              </button>
            </div>
            <div className="space-y-4">
              {workOrders.map((workOrder, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Heerka {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeWorkOrder(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Heerka
                      </label>
                      <input
                        type="text"
                        value={workOrder.stage}
                        onChange={(e) => updateWorkOrder(index, 'stage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tusaale: Qaybinta, Isku-dhafka, Dhammaadka"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Xaaladda
                      </label>
                      <select
                        value={workOrder.status}
                        onChange={(e) => updateWorkOrder(index, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PENDING">La sugayo</option>
                        <option value="IN_PROGRESS">Warshadaha</option>
                        <option value="COMPLETED">Dhammaaday</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sharaxaad
                      </label>
                      <input
                        type="text"
                        value={workOrder.description}
                        onChange={(e) => updateWorkOrder(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Sharaxaad ku saabsan heerka"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saacadaha la filayo
                      </label>
                      <input
                        type="number"
                        value={workOrder.estimatedHours}
                        onChange={(e) => updateWorkOrder(index, 'estimatedHours', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shaqaalaha la qoondeeyay
                      </label>
                      <select
                        value={workOrder.assignedToId || ''}
                        onChange={(e) => updateWorkOrder(index, 'assignedToId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Dooro shaqaalaha</option>
                        {employees.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qoraal
                      </label>
                      <input
                        type="text"
                        value={workOrder.notes || ''}
                        onChange={(e) => updateWorkOrder(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Qoraal"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/manufacturing')}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Jooji
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cusboonaysiinta...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Cusboonaysii
                </>
              )}
            </button>
          </div>
        </form>
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

