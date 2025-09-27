// app/expenses/[id]/page.tsx - Professional Expense Details Page with Dynamic Design
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  ArrowLeft, Edit, Trash2, Calendar, Tag, DollarSign, Briefcase, CreditCard,
  MessageSquare, Paperclip, CheckCircle, XCircle, Loader2, Info, User, Printer, Download, Package,
  Building, Phone, Mail, MapPin, Clock, FileText, Users, Truck, Home, ThumbsUp, ThumbsDown,
  Copy, FileText as FileTextIcon, Share2, Star, AlertCircle, Send, Plus, Minus,
  Upload, Image, File, X, Eye, BarChart3, TrendingUp, Filter, Search, Settings,
  Zap, Link as LinkIcon, Globe, Database, Cloud, Shield, Bell, Wifi, WifiOff,
  Activity, RefreshCw, Smartphone, Monitor, Tablet, WifiIcon, Battery, Signal,
  Lock, Unlock, Key, UserCheck, UserX, EyeOff, Maximize, Minimize, RotateCcw,
  Receipt, Calculator, PieChart, TrendingDown, Award, Target, Zap as ZapIcon
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

// Enhanced Interface with complete expense information
interface Expense {
  id: string;
  date: string;
  project?: {
    id: string;
    name: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    description?: string;
  };
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  paidFrom: string;
  note?: string;
  approved?: boolean;
  receiptUrl?: string;
  materials?: { name: string; qty: number; price: number; unit: string }[];
  employee?: {
    id: string;
    fullName: string;
    position?: string;
    department?: string;
    phoneNumber?: string;
    email?: string;
  };
  vendor?: {
    id: string;
    name: string;
    contactPerson?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
  };
  customer?: {
    id: string;
    name: string;
    contactPerson?: string;
    phoneNumber?: string;
    email?: string;
  };
  user?: {
    id: string;
    fullName: string;
    email?: string;
    role?: string;
  };
  expenseCategory?: {
    id: string;
    name: string;
    type?: string;
    description?: string;
  };
  company?: {
    id: string;
    name: string;
    address?: string;
    phoneNumber?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Professional Invoice-style Design Component
const ProfessionalExpenseCard: React.FC<{ expense: Expense; router: any; handleDelete: () => void }> = ({ expense, router, handleDelete }) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'material': return <Package className="w-6 h-6" />;
      case 'labor': return <Users className="w-6 h-6" />;
      case 'transport': return <Truck className="w-6 h-6" />;
      case 'company expense': return <Building className="w-6 h-6" />;
      case 'debt': return <CreditCard className="w-6 h-6" />;
      case 'salary': return <User className="w-6 h-6" />;
      case 'marketing': return <Target className="w-6 h-6" />;
      case 'utilities': return <Home className="w-6 h-6" />;
      case 'insurance': return <Shield className="w-6 h-6" />;
      case 'consultancy': return <Award className="w-6 h-6" />;
      case 'equipment rental': return <Settings className="w-6 h-6" />;
      default: return <DollarSign className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'material': return 'bg-blue-600';
      case 'labor': return 'bg-green-600';
      case 'transport': return 'bg-orange-600';
      case 'company expense': return 'bg-purple-600';
      case 'debt': return 'bg-red-600';
      case 'salary': return 'bg-indigo-600';
      case 'marketing': return 'bg-pink-600';
      case 'utilities': return 'bg-yellow-600';
      case 'insurance': return 'bg-cyan-600';
      case 'consultancy': return 'bg-emerald-600';
      case 'equipment rental': return 'bg-violet-600';
      default: return 'bg-gray-600';
    }
  };

  const getSubCategoryDesign = (subCategory: string) => {
    switch (subCategory?.toLowerCase()) {
      case 'debt':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          icon: <CreditCard className="w-5 h-5" />,
          title: 'Deyn (La Qaatay)',
          description: 'Lacag la qaatay oo loo baahan yahay in la bixiyo'
        };
      case 'salary':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          icon: <User className="w-5 h-5" />,
          title: 'Mushahara',
          description: 'Lacagta shaqaalaha la bixiyay'
        };
      case 'material':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          icon: <Package className="w-5 h-5" />,
          title: 'Alaab',
          description: 'Alaabta la iibiyay ama la kirayay'
        };
      case 'fuel':
        return {
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-800 dark:text-orange-200',
          icon: <Truck className="w-5 h-5" />,
          title: 'Shidaal',
          description: 'Shidaalka gaadiidka la iibiyay'
        };
      case 'office rent':
        return {
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-800 dark:text-purple-200',
          icon: <Building className="w-5 h-5" />,
          title: 'Kirada Xafiiska',
          description: 'Kirada xafiiska la bixiyay'
        };
      case 'electricity':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          icon: <Zap className="w-5 h-5" />,
          title: 'Koronto',
          description: 'Korontada la bixiyay'
        };
      case 'marketing':
        return {
          bgColor: 'bg-pink-50 dark:bg-pink-900/20',
          borderColor: 'border-pink-200 dark:border-pink-800',
          textColor: 'text-pink-800 dark:text-pink-200',
          icon: <Target className="w-5 h-5" />,
          title: 'Suuqgeyn',
          description: 'Ololaha suuqgeynta la bixiyay'
        };
      case 'consultancy':
        return {
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          textColor: 'text-emerald-800 dark:text-emerald-200',
          icon: <Award className="w-5 h-5" />,
          title: 'Talo Bixin',
          description: 'Talo bixin la siiyay'
        };
      case 'equipment rental':
        return {
          bgColor: 'bg-violet-50 dark:bg-violet-900/20',
          borderColor: 'border-violet-200 dark:border-violet-800',
          textColor: 'text-violet-800 dark:text-violet-200',
          icon: <Settings className="w-5 h-5" />,
          title: 'Kirada Qalabka',
          description: 'Qalab la kirayay'
        };
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          icon: <DollarSign className="w-5 h-5" />,
          title: subCategory || 'Kale',
          description: 'Kharash kale'
        };
    }
  };

  const subCategoryDesign = getSubCategoryDesign(expense.subCategory || expense.category);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
      {/* Header Section */}
      <div className={`${getCategoryColor(expense.category)} text-white p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getCategoryIcon(expense.category)}
              <div>
                <h1 className="text-2xl font-bold">{expense.description}</h1>
                <p className="text-white/80 text-sm">{expense.category}</p>
        </div>
        </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{expense.amount.toLocaleString()} ETB</div>
              <div className="text-white/80 text-sm">
                {new Date(expense.date).toLocaleDateString('so-SO')}
      </div>
        </div>
        </div>
          
        <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              expense.approved ? 'bg-green-500/20 text-green-100' : 'bg-yellow-500/20 text-yellow-100'
            }`}>
              {expense.approved ? 'La Ansixiyay' : 'Sugaya Ansixin'}
                </div>
            <div className="text-white/80 text-sm">
              Laga bixiyay: {expense.paidFrom}
                </div>
                </div>
              </div>
      </div>

      {/* Sub Category Design Section */}
      <div className={`p-6 border-l-4 ${subCategoryDesign.borderColor} ${subCategoryDesign.bgColor}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-lg ${subCategoryDesign.textColor} bg-white/50`}>
            {subCategoryDesign.icon}
                  </div>
          <div>
            <h3 className={`text-lg font-bold ${subCategoryDesign.textColor}`}>
              {subCategoryDesign.title}
            </h3>
            <p className={`text-sm ${subCategoryDesign.textColor} opacity-80`}>
              {subCategoryDesign.description}
                  </p>
              </div>
          </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Project Information */}
            {expense.project && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">Mashruuca La Xiriira</h4>
                    </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Magaca Mashruuca</p>
                <p className="font-medium text-blue-800 dark:text-blue-200">{expense.project.name}</p>
                </div>
              {expense.project.budget && (
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Miisaaniyadda</p>
                  <p className="font-medium text-blue-800 dark:text-blue-200">${expense.project.budget.toLocaleString()}</p>
                </div>
            )}
                    </div>
                </div>
            )}

        {/* Materials Section */}
            {expense.materials && expense.materials.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-4">
              <Package className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800 dark:text-green-200">Alaabta La Iibiyay</h4>
            </div>
                  <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-200 dark:border-green-700">
                    <th className="text-left py-2 text-sm font-medium text-green-600 dark:text-green-400">Alaabta</th>
                    <th className="text-right py-2 text-sm font-medium text-green-600 dark:text-green-400">Tirada</th>
                    <th className="text-right py-2 text-sm font-medium text-green-600 dark:text-green-400">Qiimaha</th>
                    <th className="text-right py-2 text-sm font-medium text-green-600 dark:text-green-400">Wadarta</th>
                              </tr>
                          </thead>
                <tbody>
                              {expense.materials.map((item, index) => (
                    <tr key={index} className="border-b border-green-100 dark:border-green-800">
                      <td className="py-2 text-green-800 dark:text-green-200">{item.name}</td>
                      <td className="py-2 text-right text-green-600 dark:text-green-400">{item.qty} {item.unit}</td>
                      <td className="py-2 text-right text-green-600 dark:text-green-400">{item.price.toLocaleString()} ETB</td>
                      <td className="py-2 text-right font-medium text-green-800 dark:text-green-200">
                        {(item.qty * item.price).toLocaleString()} ETB
                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
            )}

        {/* Employee Information */}
        {expense.employee && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-800 dark:text-purple-200">Macluumaadka Shaqaalaha</h4>
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Magaca</p>
                <p className="font-medium text-purple-800 dark:text-purple-200">{expense.employee.fullName}</p>
                               </div>
              {expense.employee.position && (
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Jagada</p>
                  <p className="font-medium text-purple-800 dark:text-purple-200">{expense.employee.position}</p>
                           </div>
                            )}
                        </div>
                    </div>
                )}

        {/* Vendor Information */}
        {expense.vendor && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-3 mb-3">
              <Truck className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-orange-800 dark:text-orange-200">Macluumaadka Kiriyaha</h4>
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Magaca Shirkadda</p>
                <p className="font-medium text-orange-800 dark:text-orange-200">{expense.vendor.name}</p>
                                    </div>
              {expense.vendor.contactPerson && (
                                        <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Qofka La Xidhiidha</p>
                  <p className="font-medium text-orange-800 dark:text-orange-200">{expense.vendor.contactPerson}</p>
                                        </div>
                            )}
                        </div>
                    </div>
                )}

        {/* Notes Section */}
        {expense.note && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Fiiro Gaar Ah</h4>
                </div>
            <p className="text-gray-700 dark:text-gray-300">{expense.note}</p>
                                </div>
        )}

        {/* Receipt Section */}
        {expense.receiptUrl && (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center space-x-3 mb-3">
              <Receipt className="w-5 h-5 text-cyan-600" />
              <h4 className="font-semibold text-cyan-800 dark:text-cyan-200">Rasiidhka</h4>
            </div>
            <div className="flex items-center space-x-4">
              <img 
                src={expense.receiptUrl} 
                alt="Receipt" 
                className="w-20 h-20 object-cover rounded-lg border border-cyan-200 dark:border-cyan-700"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-center">
                <FileTextIcon className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm text-cyan-600 dark:text-cyan-400">Sawirka lama soo bandhlin</p>
              </div>
              <div>
                <p className="text-sm text-cyan-600 dark:text-cyan-400">Rasiidhka lifaaqan</p>
                <a 
                  href={expense.receiptUrl} 
                  download 
                  className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200 text-sm font-medium inline-flex items-center"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Soo Degso
                </a>
                </div>
                        </div>
                    </div>
                )}
            </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            La diiwaan geliyay: {expense.user?.fullName || 'Unknown User'}
          </div>
                    <div className="flex items-center space-x-2">
                            <button 
              onClick={() => router.push(`/expenses/edit/${expense.id}`)}
              className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" 
              title="Wax ka beddel kharashka"
                            >
              <Edit className="w-4 h-4" />
                            </button>
                        <button 
              onClick={() => window.print()}
              className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors" 
              title="Daabac kharashka"
                        >
              <Printer className="w-4 h-4" />
                        </button>
                                        <button 
              onClick={handleDelete}
              className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors" 
              title="Tirtir kharashka"
                                        >
              <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            </div>
  );
};

export default function ExpenseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addNotification } = useNotifications();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (id) {
      const fetchExpenseDetails = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/expenses/${id}`);
          if (!response.ok) {
            if (response.status === 404) {
              setExpense(null);
              return;
            }
            throw new Error('Khasab ma ahan in la helo faahfaahinta kharashka');
          }
          const data = await response.json();
          setExpense(data.expense);
        } catch (error: any) {
          console.error("Error fetching expense details:", error);
          setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
          setExpense(null);
        } finally {
          setLoading(false);
        }
      };
      fetchExpenseDetails();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Ma hubtaa inaad rabto inaad tirtirto kharashkan? Lama soo celin karo.')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Khasab ma ahan in la tirtiro kharashka.');
        setToastMessage({ message: 'Kharashka si guul leh ayaa loo tirtiray!', type: 'success' });
        router.push('/expenses');
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa ka dhacday tirtiridda.', type: 'error' });
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} />
          <span>Soo raridda Faahfaahinta Kharashka...</span>
                                    </div>
      </Layout>
    );
  }

  if (!expense) {
    return (
      <Layout>
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <Info size={48} className="mx-auto text-redError mb-4" />
          <h2 className="text-2xl font-bold text-darkGray dark:text-gray-100">Kharash Lama Helin</h2>
          <p className="text-mediumGray dark:text-gray-400 mt-2">Waan ka xunnahay, laakiin kharashka aad raadineyso ma jiro ama waa la tirtiray.</p>
          <div className="mt-6 space-y-4">
            <Link href="/expenses" className="inline-block bg-primary text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
              Ku laabo Liiska Kharashyada
            </Link>
            <div className="mt-4">
                    <button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/expenses/seed', { method: 'POST' });
                    const data = await response.json();
                    if (response.ok) {
                      setToastMessage({ message: data.message, type: 'success' });
                      window.location.reload();
                    } else {
                      setToastMessage({ message: data.message, type: 'error' });
                    }
                  } catch (error) {
                    setToastMessage({ message: 'Cilad ayaa dhacday marka sample data la abuuraynayay.', type: 'error' });
                  }
                }}
                className="bg-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-600 transition duration-200"
              >
                Ku Dar Sample Data
                    </button>
                </div>
                    </div>
                    </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/expenses" className="p-2 rounded-full bg-lightGray dark:bg-gray-700 hover:bg-primary hover:text-white transition-colors duration-200" title="Ku laabo liiska kharashyada">
            <ArrowLeft size={24} />
          </Link>
                    <div>
            <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">Faahfaahinta Kharashka</h1>
            <p className="text-mediumGray dark:text-gray-400 mt-1">Macluumaadka dhammaan kharashka</p>
                    </div>
        </div>
      </div>

      {/* Professional Expense Card */}
      <div className="print:bg-white print:shadow-none">
        <ProfessionalExpenseCard expense={expense} router={router} handleDelete={handleDelete} />
            </div>
    </Layout>
  );
}
