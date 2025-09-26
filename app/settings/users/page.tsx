'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info,
  Tag, CheckCircle, XCircle, ChevronRight, User as UserIcon, Lock, Key, Eye,
  UserCheck, UserX, UserCog, Mail, Calendar
} from 'lucide-react';
import Toast from '../../../components/common/Toast';
import { USER_ROLES } from '@/lib/constants';

// --- User Table Row Component ---
const UserRow = ({
  user,
  onEdit,
  onDelete,
  onChangeStatus,
  onSelect,
  isSelected,
  currentUserId,
  currentUserRole,
}: any) => {
  const isCurrentUser = user.id === currentUserId;
  const canDelete = currentUserRole === USER_ROLES.ADMIN && !isCurrentUser;
  const canChangeStatus = currentUserRole === USER_ROLES.ADMIN && !isCurrentUser;
  const canEdit =
    currentUserRole === USER_ROLES.ADMIN ||
    (currentUserRole === USER_ROLES.MANAGER && user.role !== USER_ROLES.ADMIN);

  return (
    <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
      <td className="p-4 whitespace-nowrap">
        <input
          type="checkbox"
          title="Select user"
          placeholder="Select user"
          checked={isSelected}
          onChange={(e) => onSelect(user.id, e.target.checked)}
          className="h-4 w-4 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"
          disabled={isCurrentUser}
        />
      </td>
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <UserIcon size={18} className="text-primary" />{' '}
        <span>
          {user.fullName}{' '}
          {isCurrentUser && <span className="text-xs text-blue-500">(You)</span>}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
        <span>{user.email}</span>
      </td>
      <td className="p-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            user.role === USER_ROLES.ADMIN
              ? 'bg-redError/10 text-redError'
              : user.role === USER_ROLES.MANAGER
              ? 'bg-accent/10 text-accent'
              : user.role === USER_ROLES.MEMBER
              ? 'bg-primary/10 text-primary'
              : 'bg-mediumGray/10 text-mediumGray'
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            user.status === 'Active'
              ? 'bg-secondary/10 text-secondary'
              : 'bg-mediumGray/10 text-mediumGray'
          }`}
        >
          {user.status}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        {user.lastLogin
          ? new Date(user.lastLogin).toLocaleDateString()
          : '-'}
      </td>
      <td className="p-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-2">
        <button
          onClick={() => onEdit(user.id)}
          className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200"
          title="Edit User"
          disabled={!canEdit}
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => onDelete(user.id)}
          className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200"
          title="Delete User"
          disabled={!canDelete}
        >
          <Trash2 size={18} />
        </button>
        <button
          onClick={() => onChangeStatus(
            user.id,
            user.status === 'Active' ? 'Inactive' : 'Active'
          )}
          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200"
          title="Toggle Status"
          disabled={!canChangeStatus}
        >
          {user.status === 'Active' ? <UserX size={18} /> : <UserCheck size={18} />}
        </button>
        </div>
      </td>
                title="Add new user"
    </tr>
  );
};

// --- Modal Component ---
const Modal = ({ title, onClose, children }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-up">
      <div className="flex justify-between items-center mb-4 border-b pb-3 border-lightGray dark:border-gray-700">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">{title}</h3>
        <button
          onClick={onClose}
          className="text-mediumGray dark:text-gray-400 hover:text-redError transition-colors"
          title="Close modal"
        >
          <X size={24} />
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
  currentUserId,
  currentUserRole,
}: any) => {
  const [fullName, setFullName] = useState(editingUser?.fullName || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(editingUser?.role || USER_ROLES.MEMBER);
  const [status, setStatus] = useState(editingUser?.status || 'Active');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isCurrentUserBeingEdited = editingUser?.id === currentUserId;
  const canEditRole = currentUserRole === USER_ROLES.ADMIN && !isCurrentUserBeingEdited;
  const canEditStatus = currentUserRole === USER_ROLES.ADMIN && !isCurrentUserBeingEdited;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!fullName.trim()) newErrors.fullName = 'Magaca waa waajib.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Email sax ah waa waajib.';
    if (!editingUser || password) {
      if (!password) newErrors.password = 'Password waa waajib.';
      if (password.length < 6)
        newErrors.password = 'Password waa inuu ugu yaraan 6 xaraf ka koobnaadaa.';
      if (password !== confirmPassword)
        newErrors.confirmPassword = 'Password-ku isku mid maaha.';
    }
    if (!role && canEditRole) newErrors.role = 'Doorka waa waajib.';
    if (!status && canEditStatus) newErrors.status = 'Xaaladda waa waajib.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    onSubmit({
      id: editingUser?.id,
      fullName,
      email,
      password: password || undefined,
      role,
      status,
    });
    setLoading(false);
  };

  const roles = [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.MEMBER, USER_ROLES.VIEWER];
  const statuses = ['Active', 'Inactive'];

  // Dummy Permissions based on Role (Advanced Feature Placeholder)
  const getPermissionsForRole = (selectedRole: string) => {
    switch (selectedRole) {
      case USER_ROLES.ADMIN:
        return [
          'All Access',
          'Manage Users',
          'View All Reports',
          'Edit All Data',
          'Force Password Reset',
          'Impersonate Users',
        ];
      case USER_ROLES.MANAGER:
        return [
          'Manage Projects',
          'View All Data',
          'Approve Expenses',
          'Manage Inventory',
          'View User Activity',
        ];
      case USER_ROLES.MEMBER:
        return [
          'Add Expenses',
          'View Own Projects',
          'View Basic Reports',
          'Manage Own Profile',
        ];
      case USER_ROLES.VIEWER:
        return ['View All Data (Read-Only)'];
      default:
        return [];
    }
  };
  const currentPermissions = getPermissionsForRole(role);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label htmlFor="fullName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
          Magaca Buuxa <span className="text-redError">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tusaale: Axmed Cali"
          className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${
            errors.fullName ? 'border-redError' : 'border-lightGray dark:border-gray-700'
          }`}
        />
        {errors.fullName && (
          <p className="text-redError text-sm mt-1 flex items-center">
            <Info size={16} className="mr-1" />
            {errors.fullName}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="email" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
          Email <span className="text-redError">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tusaale@ganacsi.com"
          className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${
            errors.email ? 'border-redError' : 'border-lightGray dark:border-gray-700'
          }`}
        />
        {errors.email && (
          <p className="text-redError text-sm mt-1 flex items-center">
            <Info size={16} className="mr-1" />
            {errors.email}
          </p>
        )}
      </div>
      {!editingUser || password ? (
        <>
          <div>
            <label htmlFor="userPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
              Password {editingUser && <span className="text-mediumGray">(Leave empty to keep current)</span>}{' '}
              <span className="text-redError">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="userPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={`w-full p-3 pr-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${
                  errors.password ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100"
                title={showPassword ? "Hide password" : "Show password"}
              >
                <Eye size={20} />
              </button>
            </div>
            {errors.password && (
              <p className="text-redError text-sm mt-1 flex items-center">
                <Info size={16} className="mr-1" />
                {errors.password}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
              Xaqiiji Password <span className="text-redError">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                className={`w-full p-3 pr-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${
                  errors.confirmPassword ? 'border-redError' : 'border-lightGray dark:border-gray-700'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <Eye size={20} />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-redError text-sm mt-1 flex items-center">
                <Info size={16} className="mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setPassword('')}
          className="text-primary text-sm font-medium hover:underline flex items-center space-x-1"
        >
          <Key size={16} /> <span>Beddel Password</span>
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="userRole" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
            Doorka <span className="text-redError">*</span>
          </label>
          <select
            id="userRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${
              errors.role ? 'border-redError' : 'border-lightGray dark:border-gray-700'
            }`}
            disabled={!canEditRole}
          >
            <option value="">-- Dooro Door --</option>
            {roles.map((roleOpt) => (
              <option key={roleOpt} value={roleOpt}>
                {roleOpt}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-redError text-sm mt-1 flex items-center">
              <Info size={16} className="mr-1" />
              {errors.role}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="userStatus" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
            Xaaladda <span className="text-redError">*</span>
          </label>
          <select
            id="userStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${
              errors.status ? 'border-redError' : 'border-lightGray dark:border-gray-700'
            }`}
            disabled={!canEditStatus}
          >
            {statuses.map((statusOpt) => (
              <option key={statusOpt} value={statusOpt}>
                {statusOpt}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-redError text-sm mt-1 flex items-center">
              <Info size={16} className="mr-1" />
              {errors.status}
            </p>
          )}
        </div>
      </div>
      <div className="bg-lightGray dark:bg-gray-700 p-4 rounded-lg animate-fade-in">
        <h4 className="text-md font-semibold text-darkGray dark:text-gray-100 mb-2 flex items-center space-x-2">
          <Lock size={18} />
          <span>Rukhsadaha Doorka ({role})</span>
        </h4>
        <ul className="list-disc list-inside text-sm text-mediumGray dark:text-gray-300 space-y-1">
          {currentPermissions.length > 0 ? (
            currentPermissions.map((perm: string, index: number) => <li key={index}>{perm}</li>)
          ) : (
            <li>Ma jiraan rukhsado gaar ah oo loo qeexay doorkan.</li>
          )}
        </ul>
        <p className="text-xs text-mediumGray dark:text-gray-400 mt-2">
          <Info size={14} className="inline mr-1" /> Rukhsadahani waa kuwo lagu daydayo. Nidaamka rukhsadaha dhabta ah ayaa la fulin doonaa mustaqbalka.
        </p>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          Jooji
        </button>
        <button
          type="submit"
          className="bg-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Plus size={20} className="mr-2" />}
          {editingUser ? 'Cusboonaysii User' : 'Ku Dar User'}
        </button>
      </div>
    </form>
  );
};

// --- Main Page ---
export default function UserManagementSettingsPage() {
  const { data: session } = useSession();
  const [companyId, setCompanyId] = useState("");
  const currentUserId = (session?.user as any)?.id || '';
  const currentUserRole = (session?.user as any)?.role || '';

  // Fetch current user's companyId from session
  const fetchCompanyId = async () => {
    try {
      const res = await fetch('/api/settings/users/me');
      const data = await res.json();
      if (res.ok && data.user?.companyId) {
        setCompanyId(data.user.companyId);
      }
    } catch (error) {
      setCompanyId("");
    }
  };
  useEffect(() => { if (session) fetchCompanyId(); }, [session]);

  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // --- API Functions ---
  const fetchUsers = async () => {
    setPageLoading(true);
    try {
      if (!companyId) return;
      const response = await fetch(`/api/settings/users?companyId=${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka users-ka la soo gelinayay.', type: 'error' });
      setUsers([]);
    } finally {
      setPageLoading(false);
    }
  };

  // Step 2: useEffect for companyId
  useEffect(() => { if (companyId) fetchUsers(); }, [companyId]);

  const handleAddUser = async (newUserData: any) => {
    try {
      // Step 4: Always attach companyId
      const payload = { ...newUserData, companyId };
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add user');
      setToastMessage({ message: data.message || 'User-ka si guul leh ayaa loo daray!', type: 'success' });
      setShowAddEditModal(false);
      fetchUsers();
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka user-ka la darayay.', type: 'error' });
    }
  };

  const handleEditUser = async (updatedUserData: any) => {
    try {
      const response = await fetch(`/api/settings/users/${updatedUserData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUserData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update user');
      setToastMessage({ message: data.message || 'User-ka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      setShowAddEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka user-ka la cusboonaysiinayay.', type: 'error' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad doonayso inaad tirtirto user-kan?')) {
      try {
        const response = await fetch(`/api/settings/users/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete user');
        setToastMessage({ message: data.message || 'User-ka si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchUsers();
        setSelectedUserIds((prev) => prev.filter((userId) => userId !== id));
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka user-ka la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/settings/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to change user status');
      setToastMessage({ message: data.message || `User-ka status-kiisa waa la beddelay ${newStatus}!`, type: 'success' });
      fetchUsers();
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka status-ka la beddelayay.', type: 'error' });
    }
  };

  const openEditModal = (id: string) => {
    const userToEdit = users.find((user) => user.id === id);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setShowAddEditModal(true);
    }
  };

  // --- Bulk Actions ---
  const handleSelectUser = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUserIds((prev) => [...prev, id]);
    } else {
      setSelectedUserIds((prev) => prev.filter((userId) => userId !== id));
    }
  };

  const handleSelectAllUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map((user) => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Ma hubtaa inaad tirtirto ${selectedUserIds.length} user?`)) {
      try {
        const response = await fetch('/api/settings/users/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: selectedUserIds }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete selected users');
        setToastMessage({ message: data.message || `${selectedUserIds.length} users si guul leh ayaa loo tirtiray!`, type: 'success' });
        fetchUsers();
        setSelectedUserIds([]);
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka users-ka la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleBulkChangeStatus = async (newStatus: string) => {
    try {
      const response = await fetch('/api/settings/users/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds, status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to change status for selected users');
      setToastMessage({ message: data.message || `${selectedUserIds.length} users status-kooda waa la beddelay ${newStatus}!`, type: 'success' });
      fetchUsers();
      setSelectedUserIds([]);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka status-ka la beddelayay.', type: 'error' });
    }
  };

  const filteredUsers = users.filter((user) => {
    // Step 3: Only show users with allowed roles for this company
    const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.MEMBER, USER_ROLES.VIEWER];
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    const matchesCompany = user.companyId === companyId;
    const allowed = allowedRoles.includes(user.role);
    return matchesSearch && matchesRole && matchesStatus && matchesCompany && allowed;
  });

  const roles = ['All', USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.MEMBER, USER_ROLES.VIEWER];
  const statuses = ['All', 'Active', 'Inactive'];

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Users...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          User Management
        </h1>
        <button
          onClick={() => {
            setShowAddEditModal(true);
            setEditingUser(null);
          }}
          className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
        >
          <Plus size={20} className="mr-2" /> Ku Dar User
        </button>
      </div>

      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Users-ka</h4>
          <p className="text-3xl font-extrabold text-primary">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Users-ka Firfircoon</h4>
          <p className="text-3xl font-extrabold text-secondary">{users.filter((user) => user.status === 'Active').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Admins</h4>
          <p className="text-3xl font-extrabold text-redError">{users.filter((user) => user.role === USER_ROLES.ADMIN).length}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Role */}
        <div className="relative w-full md:w-48">
          <Tag size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by role"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Status */}
        <div className="relative w-full md:w-48">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by status"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-8 flex items-center justify-between animate-fade-in">
          <span className="text-mediumGray dark:text-gray-400 text-sm">{selectedUserIds.length} Users Selected</span>
          <div className="flex space-x-3">
            <button
              onClick={handleBulkDelete}
              className="bg-redError/10 text-redError py-2 px-4 rounded-lg text-sm font-semibold hover:bg-redError hover:text-white transition duration-200"
              disabled={currentUserRole !== USER_ROLES.ADMIN}
            >
              <Trash2 size={16} className="inline mr-1" /> Delete Selected
            </button>
            <div className="relative group">
              <button
                className="bg-primary/10 text-primary py-2 px-4 rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition duration-200 flex items-center space-x-1"
                disabled={currentUserRole !== USER_ROLES.ADMIN}
              >
                <UserCog size={16} /> <span>Change Status</span> <ChevronRight size={16} className="transform rotate-90" />
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-xl py-1 hidden group-hover:block z-10">
                <button
                  onClick={() => handleBulkChangeStatus('Active')}
                  className="block w-full text-left px-4 py-2 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-600 text-sm"
                >
                  <UserCheck size={16} className="inline mr-2" /> Set Active
                </button>
                <button
                  onClick={() => handleBulkChangeStatus('Inactive')}
                  className="block w-full text-left px-4 py-2 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-600 text-sm"
                >
                  <UserX size={16} className="inline mr-2" /> Set Inactive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users View - Responsive */}
      {/* Mobile: Cards View */}
      <div className="block md:hidden">
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border-l-4 border-primary relative">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
                    <UserIcon size={20} className="text-primary" /> <span>{user.fullName}</span>
                  </h4>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button onClick={() => openEditModal(user.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit User">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete User">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                  <Tag size={14} /> <span>Doorka: {user.role}</span>
                </p>
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                  <CheckCircle size={14} className={user.status === 'Active' ? 'text-secondary' : 'text-mediumGray'} /> <span>Xaaladda: {user.status}</span>
                </p>
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                  <Mail size={14} /> <span>Email: {user.email}</span>
                </p>
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                  <Calendar size={14} /> <span>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</span>
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
              Ma jiraan users la helay.
              <button
                onClick={() => {
                  setShowAddEditModal(true);
                  setEditingUser(null);
                }}
                className="mt-4 bg-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700"
              >
                Ku Dar User Cusub
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Desktop: Table View */}
      <div className="hidden md:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      title="Select all users"
                      placeholder="Select all users"
                      onChange={handleSelectAllUsers}
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                      className="h-4 w-4 text-primary rounded border-mediumGray dark:border-gray-600 focus:ring-primary"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Magaca
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Doorka
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Xaaladda
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">
                    Ficillo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onEdit={openEditModal}
                      onDelete={handleDeleteUser}
                      onChangeStatus={handleChangeStatus}
                      onSelect={handleSelectUser}
                      isSelected={selectedUserIds.includes(user.id)}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-mediumGray dark:text-gray-400">
                      Ma jiraan users la helay.
                      <button
                        onClick={() => {
                          setShowAddEditModal(true);
                          setEditingUser(null);
                        }}
                        className="mt-4 bg-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700"
                      >
                        Ku Dar User Cusub
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Placeholder */}
          <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
            <span className="text-sm text-darkGray dark:text-gray-100">
              Bogga 1 ee {Math.ceil(filteredUsers.length / 10) || 1}
            </span>
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddEditModal && (
        <Modal
          title={editingUser ? 'Cusboonaysii User' : 'Ku Dar User Cusub'}
          onClose={() => {
            setShowAddEditModal(false);
            setEditingUser(null);
          }}
        >
          <UserForm
            onSubmit={editingUser ? handleEditUser : handleAddUser}
            onCancel={() => {
              setShowAddEditModal(false);
              setEditingUser(null);
            }}
            editingUser={editingUser}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </Modal>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}