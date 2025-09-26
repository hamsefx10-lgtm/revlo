// app/manufacturing/production-orders/add/page.tsx - Add Production Order
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Save, X, Package, Users, Calendar, Tag, FileText, 
  Loader2, CheckCircle, AlertCircle, Factory, Wrench, Clock, ChevronRight
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// --- Data Interfaces ---
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Employee {
  id: string;
  fullName: string;
  role: string;
  category: string;
}

interface ProductCatalog {
  id: string;
  name: string;
  description?: string;
  category: string;
  standardCost: number;
  sellingPrice: number;
}

// --- Bill of Material Row Component ---
const BillOfMaterialRow: React.FC<{
  index: number;
  material: any;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}> = ({ index, material, onUpdate, onRemove }) => {
  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value) || 0;
    const totalCost = quantity * material.costPerUnit;
    onUpdate(index, 'quantity', quantity);
    onUpdate(index, 'totalCost', totalCost);
  };

  const handleCostChange = (value: string) => {
    const costPerUnit = parseFloat(value) || 0;
    const totalCost = material.quantity * costPerUnit;
    onUpdate(index, 'costPerUnit', costPerUnit);
    onUpdate(index, 'totalCost', totalCost);
  };

  return (
    <tr className="border-b border-lightGray dark:border-gray-700">
      <td className="p-2 lg:p-3">
        <input
          type="text"
          value={material.materialName}
          onChange={(e) => onUpdate(index, 'materialName', e.target.value)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
          placeholder="Magaca alaabta..."
        />
      </td>
      <td className="p-2 lg:p-3">
        <input
          type="number"
          value={material.quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
          placeholder="0"
          min="0"
          step="0.01"
        />
      </td>
      <td className="p-2 lg:p-3">
        <select
          value={material.unit}
          onChange={(e) => onUpdate(index, 'unit', e.target.value)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
        >
          <option value="pcs">pcs</option>
          <option value="sq ft">sq ft</option>
          <option value="liters">liters</option>
          <option value="kg">kg</option>
          <option value="meters">meters</option>
          <option value="sets">sets</option>
        </select>
      </td>
      <td className="p-2 lg:p-3">
        <input
          type="number"
          value={material.costPerUnit}
          onChange={(e) => handleCostChange(e.target.value)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </td>
      <td className="p-2 lg:p-3">
        <span className="font-semibold text-primary text-sm lg:text-base">
          {material.totalCost.toLocaleString()} ETB
        </span>
      </td>
      <td className="p-2 lg:p-3">
        <button
          onClick={() => onRemove(index)}
          className="p-2 text-redError hover:bg-redError/10 rounded-lg transition-colors"
          title="Ka saar alaabta"
        >
          <X size={16} />
        </button>
      </td>
    </tr>
  );
};

// --- Work Order Row Component ---
const WorkOrderRow: React.FC<{
  index: number;
  workOrder: any;
  employees: Employee[];
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}> = ({ index, workOrder, employees, onUpdate, onRemove }) => {
  return (
    <tr className="border-b border-lightGray dark:border-gray-700">
      <td className="p-3">
        <select
          value={workOrder.stage}
          onChange={(e) => onUpdate(index, 'stage', e.target.value)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Qaybinta">Qaybinta</option>
          <option value="Isku-dhafka">Isku-dhafka</option>
          <option value="Dhammaadka">Dhammaadka</option>
          <option value="Tijaabada">Tijaabada</option>
          <option value="Qalabka">Qalabka</option>
        </select>
      </td>
      <td className="p-3">
        <input
          type="text"
          value={workOrder.description}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Sharaxaad shaqada..."
        />
      </td>
      <td className="p-3">
        <input
          type="number"
          value={workOrder.estimatedHours}
          onChange={(e) => onUpdate(index, 'estimatedHours', parseFloat(e.target.value) || 0)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="0"
          min="0"
          step="0.5"
        />
      </td>
      <td className="p-3">
        <select
          value={workOrder.assignedToId}
          onChange={(e) => onUpdate(index, 'assignedToId', e.target.value)}
          className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Dooro shaqaale...</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName} ({emp.role})
            </option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <button
          onClick={() => onRemove(index)}
          className="p-2 text-redError hover:bg-redError/10 rounded-lg transition-colors"
          title="Ka saar shaqada"
        >
          <X size={16} />
        </button>
      </td>
    </tr>
  );
};

export default function AddProductionOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<ProductCatalog[]>([]);
  
  // Form states
  const [formData, setFormData] = useState({
    orderNumber: '',
    productName: '',
    quantity: 1,
    status: 'PLANNED',
    priority: 'MEDIUM',
    startDate: '',
    dueDate: '',
    notes: '',
    customerId: '',
    productId: ''
  });

  const [billOfMaterials, setBillOfMaterials] = useState<any[]>([
    { materialName: '', quantity: 1, unit: 'pcs', costPerUnit: 0, totalCost: 0, notes: '' }
  ]);

  const [workOrders, setWorkOrders] = useState<any[]>([
    { stage: 'Qaybinta', description: '', estimatedHours: 1, assignedToId: '', status: 'PENDING' }
  ]);

  // Fetch data on component mount
  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
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
        setEmployees(data.employees || []);
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
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

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
    }
  };

  const addBillOfMaterial = () => {
    setBillOfMaterials(prev => [...prev, {
      materialName: '',
      quantity: 0,
      unit: 'pcs',
      costPerUnit: 0,
      totalCost: 0,
      notes: ''
    }]);
  };

  const updateBillOfMaterial = (index: number, field: string, value: any) => {
    setBillOfMaterials(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeBillOfMaterial = (index: number) => {
    setBillOfMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const addWorkOrder = () => {
    setWorkOrders(prev => [...prev, {
      stage: 'Qaybinta',
      description: '',
      estimatedHours: 1,
      assignedToId: '',
      status: 'PENDING'
    }]);
  };

  const updateWorkOrder = (index: number, field: string, value: any) => {
    setWorkOrders(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeWorkOrder = (index: number) => {
    setWorkOrders(prev => prev.filter((_, i) => i !== index));
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `PO-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);

    // Enhanced validation
    if (!formData.productName.trim()) {
      setToastMessage({ message: 'Fadlan geli magaca alaabta.', type: 'error' });
      setLoading(false);
      return;
    }

    if (formData.quantity <= 0) {
      setToastMessage({ message: 'Tirada waa inay ka weyn tahay 0.', type: 'error' });
      setLoading(false);
      return;
    }

    // Validate Bill of Materials
    const validMaterials = billOfMaterials.filter(m => m.materialName.trim() !== '');
    if (validMaterials.length === 0) {
      setToastMessage({ message: 'Fadlan ku dar ugu yaraan hal alaab.', type: 'error' });
      setLoading(false);
      return;
    }

    // Validate Work Orders
    const validWorkOrders = workOrders.filter(w => w.stage.trim() !== '');
    if (validWorkOrders.length === 0) {
      setToastMessage({ message: 'Fadlan ku dar ugu yaraan hal amarka shaqada.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      // Generate order number if not provided
      const orderNumber = formData.orderNumber || generateOrderNumber();

      const payload = {
        ...formData,
        orderNumber,
        billOfMaterials: validMaterials,
        workOrders: validWorkOrders
      };

      const response = await fetch('/api/manufacturing/production-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create production order');
      }

      setToastMessage({ 
        message: data.message || 'Amarka warshadaha si guul leh ayaa loo daray!', 
        type: 'success' 
      });

      // Redirect to manufacturing page after success
      setTimeout(() => {
        router.push('/manufacturing');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating production order:', error);
      setToastMessage({ 
        message: error.message || 'Cilad ayaa dhacday marka amarka warshadaha la darayay.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const totalMaterialCost = billOfMaterials.reduce((sum, bom) => sum + bom.totalCost, 0);
  const totalEstimatedHours = workOrders.reduce((sum, wo) => sum + wo.estimatedHours, 0);

  return (
    <Layout>
      {/* Mobile-Responsive Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/manufacturing" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200">
            <ArrowLeft size={24} className="inline-block" />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">Ku Dar Amarka Warshadaha</h1>
            <p className="text-mediumGray dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">Samee amarka warshadaha cusub</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4 lg:mb-6 flex items-center">
            <Factory className="mr-2 lg:mr-3 text-primary" size={20} />
            Macluumaadka Asaasiga ah
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Lambarka Amarka *
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                placeholder="PO-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Alaabta *
              </label>
              <select
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              >
                <option value="">Dooro alaabta...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Magaca Alaabta *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                placeholder="Miis Qolka, Kursi Maamulka..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Tirada *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Xaaladda
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              >
                <option value="PLANNED">Qorshaysan</option>
                <option value="IN_PROGRESS">Warshadaha</option>
                <option value="COMPLETED">Dhammaaday</option>
                <option value="CANCELLED">Joojiyay</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Darajada
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              >
                <option value="LOW">Hoos</option>
                <option value="MEDIUM">Dhexe</option>
                <option value="HIGH">Kor</option>
                <option value="URGENT">Degdeg</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Macmiilka
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleInputChange('customerId', e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              >
                <option value="">Dooro macmiilka...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Taariikhda Bilawga
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Taariikhda Dhammaadka
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
              Qoraal
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full p-2 lg:p-3 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              placeholder="Qoraal ku saabsan amarka warshadaha..."
            />
          </div>
        </div>

        {/* Bill of Materials */}
        <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 gap-4">
            <h2 className="text-xl lg:text-2xl font-bold text-darkGray dark:text-gray-100 flex items-center">
              <Package className="mr-2 lg:mr-3 text-accent" size={20} />
              Liiska Alaabta (Bill of Materials)
            </h2>
            <button
              type="button"
              onClick={addBillOfMaterial}
              className="bg-accent text-white px-3 lg:px-4 py-2 rounded-lg flex items-center hover:bg-orange-600 transition-colors text-sm lg:text-base"
            >
              <Plus size={16} className="mr-2" />
              Ku Dar Alaabta
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-lightGray dark:border-gray-700">
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Magaca Alaabta</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Tirada</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Halbeegga</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Kharashka Halbeegga</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Kharashka Guud</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billOfMaterials.map((material, index) => (
                  <BillOfMaterialRow
                    key={index}
                    index={index}
                    material={material}
                    onUpdate={updateBillOfMaterial}
                    onRemove={removeBillOfMaterial}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 lg:p-4 bg-primary/10 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-base lg:text-lg font-semibold text-primary">Wadarta Kharashka Alaabta:</span>
              <span className="text-xl lg:text-2xl font-bold text-primary">{totalMaterialCost.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>

        {/* Work Orders */}
        <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 gap-4">
            <h2 className="text-xl lg:text-2xl font-bold text-darkGray dark:text-gray-100 flex items-center">
              <Wrench className="mr-2 lg:mr-3 text-secondary" size={20} />
              Amarka Shaqada (Work Orders)
            </h2>
            <button
              type="button"
              onClick={addWorkOrder}
              className="bg-secondary text-white px-3 lg:px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition-colors text-sm lg:text-base"
            >
              <Plus size={16} className="mr-2" />
              Ku Dar Shaqada
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-lightGray dark:border-gray-700">
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Heerka</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Sharaxaad</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Saacadaha La Filayo</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Shaqaalaha</th>
                  <th className="text-left p-2 lg:p-3 font-semibold text-darkGray dark:text-gray-100 text-sm lg:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((workOrder, index) => (
                  <WorkOrderRow
                    key={index}
                    index={index}
                    workOrder={workOrder}
                    employees={employees}
                    onUpdate={updateWorkOrder}
                    onRemove={removeWorkOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 lg:p-4 bg-secondary/10 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-base lg:text-lg font-semibold text-secondary">Wadarta Saacadaha:</span>
              <span className="text-xl lg:text-2xl font-bold text-secondary">{totalEstimatedHours} saacadood</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
          <Link
            href="/manufacturing"
            className="px-4 lg:px-6 py-3 border border-lightGray dark:border-gray-600 text-darkGray dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center text-sm lg:text-base"
          >
            Jooji
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 lg:px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Warshadaya...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Kaydi Amarka
              </>
            )}
          </button>
        </div>
      </form>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
