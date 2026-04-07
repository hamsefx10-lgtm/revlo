'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info,
  Tag, CheckCircle, XCircle, ChevronRight, User as UserIcon, Lock, Key, Eye,
  UserCheck, Building, UserCog, Mail, Monitor, RefreshCw, Zap
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import { USER_ROLES } from '@/lib/constants';

// --- User Table Row Component ---
const UserRow = ({
  user,
  onEdit,
  onDelete,
  onClearFace,
  onImpersonate,
  currentUserId,
}: any) => {
  const isCurrentUser = user.id === currentUserId;
  const isOnline = user.lastActiveAt && (new Date().getTime() - new Date(user.lastActiveAt).getTime() < 15 * 60 * 1000);

  return (
    <tr className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
               <UserIcon size={20} className="text-primary" />
            </div>
            {isOnline && <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
          </div>
          <div className="flex flex-col">
            <span className="font-bold flex items-center gap-1">
              {user.fullName}{' '}
              {isCurrentUser && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded-full uppercase tracking-wider">(You)</span>}
            </span>
            <span className="text-xs text-mediumGray dark:text-gray-400">{user.email}</span>
          </div>
        </div>
      </td>
      
      <td className="p-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
           <Building size={14} className="text-gray-400" />
           <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user.company?.name || '---'}</span>
        </div>
      </td>

      <td className="p-4 whitespace-nowrap">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === USER_ROLES.ADMIN
              ? 'bg-redError/10 text-redError'
              : user.role === USER_ROLES.MANAGER || user.role === 'SUPER_ADMIN'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-primary/10 text-primary'
            }`}
        >
          {user.role}
        </span>
      </td>

      <td className="p-4 whitespace-nowrap text-center">
         {user.faceDescriptor ? (
           <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer hover:bg-green-200" title="Waxaa ku xiran Face ID">
             <UserCheck size={12} /> Haa
           </span>
         ) : (
           <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-bold" title="Lama diiwaangelin Face ID">
            Maya
           </span>
         )}
      </td>

      <td className="p-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-red-500'}`}>
          {user.status === 'Active' ? <CheckCircle size={14}/> : <XCircle size={14}/>} {user.status}
        </span>
      </td>

      <td className="p-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-1.5">
          {!isCurrentUser && (
            <button
              onClick={() => onImpersonate(user.id)}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-200"
              title="Ghost Login (Gali Account-kiisa)"
            >
              <Zap size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200"
            title="Edit User"
          >
            <Edit size={16} />
          </button>
          {user.faceDescriptor && !isCurrentUser && (
            <button
              onClick={() => onClearFace(user.id)}
              className="p-2 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-colors duration-200"
              title="Clear Face ID (Reset)"
            >
              <UserCheck size={16} />
            </button>
          )}
          {!isCurrentUser && (
            <button
              onClick={() => onDelete(user.id)}
              className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200"
              title="Delete User"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// --- Modal Component ---
const Modal = ({ title, onClose, children }: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-lg transform animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-darkGray dark:text-gray-100">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// --- Add/Edit User Form ---
const UserForm = ({
  onSubmit,
  onCancel,
  editingUser,
  companyList,
}: any) => {
  const [fullName, setFullName] = useState(editingUser?.fullName || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState(editingUser?.companyId || '');
  const [role, setRole] = useState(editingUser?.role || USER_ROLES.MEMBER);
  const [status, setStatus] = useState(editingUser?.status || 'Active');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorLine, setErrorLine] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !role || !companyId) {
      setErrorLine('Fadlan buuxi tafaasiisha aasaasiga ah.');
      return;
    }
    if (!editingUser && !password) {
      setErrorLine('Waa inuu lahaadaa password.');
      return;
    }
    setLoading(true);
    onSubmit({
      id: editingUser?.id,
      fullName,
      email,
      password: password || undefined,
      companyId,
      role,
      status,
    });
  };

  const roles = ['SUPER_ADMIN', USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.MEMBER, 'PROJECTS_ADMIN', 'SHOP_ADMIN', 'MANUFACTURING_ADMIN'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorLine && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center">
           <Info size={16} className="mr-2" /> {errorLine}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Magaca</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="Magaca" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email-ka</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="Email" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shirkadda (Company)</label>
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none appearance-none">
          <option value="">-- Dooro Shirkad --</option>
          {companyList.map((c: any) => (
             <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Password {editingUser && <span className="lowercase text-gray-400 normal-case">(ka tag haddaadan bedelayn)</span>}
        </label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none pr-10" placeholder="********" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
             <Eye size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Doorka</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none appearance-none">
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Xaaladda</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none appearance-none">
            <option value="Active">Active (Shaqaynaya)</option>
            <option value="Inactive">Inactive (Joojisan)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onCancel} className="px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Jooji</button>
        <button type="submit" disabled={loading} className="px-6 py-3 font-bold text-white bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-xl flex items-center shadow-lg transition">
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <CheckCircle size={20} className="mr-2" />}
          {editingUser ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  );
};


// --- Main Page ---
export default function SystemUserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const currentUserId = (session?.user as any)?.id || '';
  const currentUserRole = (session?.user as any)?.role || '';

  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterCompany, setFilterCompany] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Protection
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && currentUserRole !== 'SUPER_ADMIN') router.push('/dashboard');
  }, [status, currentUserRole, router]);

  const fetchData = async () => {
    setPageLoading(true);
    try {
      const response = await fetch(`/api/admin/system-users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
      setCompanies(data.companies || []);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => { 
    if (status === 'authenticated' && currentUserRole === 'SUPER_ADMIN') {
      fetchData(); 
    }
  }, [status, currentUserRole]);

  const handleSaveUser = async (userData: any) => {
    try {
      const method = userData.id ? 'PUT' : 'POST';
      const url = userData.id ? `/api/admin/system-users/${userData.id}` : '/api/admin/system-users';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save');
      
      setToastMessage({ message: data.message, type: 'success' });
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('KA DIGTOONOW: Ma hubtaa inaad gabi ahaanba tirtirto user-kan? Waxaa ku xirnaan kara xog!')) {
      try {
        const response = await fetch(`/api/admin/system-users/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete user');
        setToastMessage({ message: data.message, type: 'success' });
        fetchData();
      } catch (error: any) {
        setToastMessage({ message: error.message, type: 'error' });
      }
    }
  };

  const handleClearFace = async (id: string) => {
    if (window.confirm('Ma doonaysaa in user-kan wajigiisa la masaxo (Reset Face ID)?')) {
      try {
        const response = await fetch(`/api/admin/system-users/${id}/face`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to clear Face ID');
        setToastMessage({ message: data.message, type: 'success' });
        fetchData();
      } catch (error: any) {
        setToastMessage({ message: error.message, type: 'error' });
      }
    }
  };

  const handleImpersonateUser = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to impersonate user');
      
      setToastMessage({ message: 'Furayaasha waa la jabsaday... Aan galno!', type: 'info' });
      
      // Auto-login to dashboard using generated impersonation token
      setTimeout(async () => {
         await signIn('credentials', { impersonateToken: data.token, callbackUrl: '/dashboard' });
      }, 1000);
      
    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    }
  };


  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesCompany = filterCompany === 'All' || user.companyId === filterCompany;
    return matchesSearch && matchesRole && matchesCompany;
  });

  const roles = ['All', 'SUPER_ADMIN', USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.MEMBER, 'PROJECTS_ADMIN', 'SHOP_ADMIN'];

  if (pageLoading || status === 'loading') {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center text-primary flex-col gap-4">
           <RefreshCw className="animate-spin" size={48} />
           <p className="text-xl font-bold tracking-tight">Akhrinta Xogta Systemka...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 flex items-center tracking-tight">
          <Link href="/admin" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 mr-4">
            <ArrowLeft size={36} />
          </Link>
          <div className="flex flex-col">
            Global User Management
            <span className="text-sm font-bold text-gray-500 tracking-widest uppercase mt-1">Super Admin Exclusive</span>
          </div>
        </h1>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-6 rounded-2xl font-black text-lg hover:shadow-xl hover:-translate-y-1 transition duration-300 shadow-md flex items-center"
        >
          <Plus size={22} className="mr-2" /> Xubin Cusub
        </button>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-full">
            <UserCog size={28} />
          </div>
          <div>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">Total Users</p>
            <h3 className="text-3xl font-black">{users.length}</h3>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="bg-green-50 text-green-600 p-4 rounded-full">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">Active</p>
            <h3 className="text-3xl font-black">{users.filter(u => u.status === 'Active').length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="bg-purple-50 text-purple-600 p-4 rounded-full">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">Face ID Ready</p>
            <h3 className="text-3xl font-black">{users.filter(u => u.faceDescriptor).length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="bg-orange-50 text-orange-600 p-4 rounded-full">
            <Building size={28} />
          </div>
          <div>
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wide">Companies</p>
            <h3 className="text-3xl font-black">{companies.length}</h3>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex flex-col md:flex-row items-center gap-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Raadi magac ama email..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:border-primary outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <select
            className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:border-primary outline-none transition appearance-none font-semibold text-gray-700 dark:text-gray-200"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
          >
             <option value="All">All Companies</option>
             {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            className="w-full px-4 py-3 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:border-primary outline-none transition appearance-none font-semibold text-gray-700 dark:text-gray-200"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase tracking-wider text-xs font-bold border-b border-gray-100 dark:border-gray-700">
                <th className="p-4">Profile</th>
                <th className="p-4">Company</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Face ID</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">Lama helin wax xog ah oo u dhigma raadintaada.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={(u: any) => { setEditingUser(u); setShowModal(true); }}
                    onDelete={handleDeleteUser}
                    onClearFace={handleClearFace}
                    onImpersonate={handleImpersonateUser}
                    currentUserId={currentUserId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editingUser ? 'Edit User' : 'Add New User'} onClose={() => setShowModal(false)}>
          <UserForm
            onSubmit={handleSaveUser}
            onCancel={() => setShowModal(false)}
            editingUser={editingUser}
            companyList={companies}
          />
        </Modal>
      )}
    </Layout>
  );
}
