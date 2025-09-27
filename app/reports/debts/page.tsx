// app/reports/debts/page.tsx - Debts Overview Report Page (10000% Design - Final Update)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { 
  ArrowLeft, Scale, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, User, Briefcase, CheckCircle, XCircle, ChevronRight, 
  TrendingUp, TrendingDown, Eye, Edit, Trash2, CreditCard, Clock as ClockIcon,
  Download, Upload, FileText, Bell, Tag, Info as InfoIcon, Phone, Mail, MapPin,
  Building, Hash, Percent, FileText as FileTextIcon, AlertTriangle, 
  Save, X, Check, ExternalLink, MoreVertical, History
} from 'lucide-react';
import Toast from '@/components/common/Toast'; // Reuse Toast component

// --- Enhanced Types ---
type Debt = {
  id: string;
  lender: string;
  lenderId: string;
  type: string;
  amount: number;
  paid: number;
  remaining: number;
  issueDate: string;
  dueDate: string;
  status: 'Active' | 'Upcoming' | 'Overdue' | 'Paid';
  project?: string;
  projectId?: string;
  description?: string;
  account?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  lastPaymentDate?: string;
  interestRate?: number;
  paymentTerms?: string;
  notes?: string;
  companyId?: string;
  companyName?: string;
};

type Receivable = {
  id: string;
  client: string;
  clientId: string;
  project: string;
  projectId: string;
  amount: number;
  received: number;
  remaining: number;
  dueDate: string;
  status: 'Upcoming' | 'Overdue' | 'Paid';
  description?: string;
  account?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  lastPaymentDate?: string;
  paymentTerms?: string;
  notes?: string;
  projectStatus?: string;
  projectValue?: number;
  companyId?: string;
  companyName?: string;
};

type DebtRepayment = {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  reference?: string;
};

type ReceivablePayment = {
  id: string;
  receivableId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  reference?: string;
};

// --- Enhanced Debt Table Row Component ---
const DebtRow: React.FC<{ debt: Debt; onRecordPayment: (id: string) => void; onDelete: (id: string) => void; onViewDetails: (id: string) => void }> = ({ debt, onRecordPayment, onDelete, onViewDetails }) => {
  let statusClass = '';
  let statusBgClass = '';
  let statusIcon: React.ReactNode;
  switch (debt.status) {
    case 'Overdue':
      statusClass = 'text-redError';
      statusBgClass = 'bg-redError/10';
      statusIcon = <XCircle size={16} />;
      break;
    case 'Upcoming':
      statusClass = 'text-primary';
      statusBgClass = 'bg-primary/10';
      statusIcon = <ClockIcon size={16} />;
      break;
    case 'Active':
      statusClass = 'text-accent';
      statusBgClass = 'bg-accent/10';
      statusIcon = <InfoIcon size={16} />;
      break;
    case 'Paid':
      statusClass = 'text-secondary';
      statusBgClass = 'bg-secondary/10';
      statusIcon = <CheckCircle size={16} />;
      break;
    default:
      statusClass = 'text-mediumGray';
      statusBgClass = 'bg-mediumGray/10';
      statusIcon = <InfoIcon size={16} />;
  }

  const isOverdue = debt.status === 'Overdue';
  const rowClass = isOverdue ? 'bg-redError/5 border-l-4 border-redError' : '';

  return (
    <tr className={`hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0 ${rowClass}`}>
      <td className="p-4 text-darkGray dark:text-gray-100 font-medium w-[18%]">
        <div className="flex items-center space-x-2">
          <User size={18} className="text-primary"/>
          <div>
            <div className="font-semibold">{debt.lender}</div>
            {debt.phoneNumber && (
              <div className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
                <Phone size={12} />
                <span>{debt.phoneNumber}</span>
              </div>
            )}
            {debt.project && (
              <div className="text-xs text-accent flex items-center space-x-1">
                <Briefcase size={12} />
                <span>{debt.project}</span>
              </div>
            )}
            {debt.companyName && (
              <div className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
                <Building size={12} />
                <span>{debt.companyName}</span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 text-mediumGray dark:text-gray-300 w-[12%]">
        <div className="flex items-center space-x-2">
          <Tag size={16} className="text-secondary"/>
          <span>{debt.type}</span>
        </div>
        {debt.interestRate && (
          <div className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1 mt-1">
            <Percent size={12} />
            <span>{debt.interestRate}%</span>
          </div>
        )}
      </td>
      <td className="p-4 text-darkGray dark:text-gray-100 font-semibold text-right w-[10%]">
        <div>${debt.amount.toLocaleString()}</div>
        {debt.description && (
          <div className="text-xs text-mediumGray dark:text-gray-400 mt-1 truncate" title={debt.description}>
            {debt.description}
          </div>
        )}
      </td>
      <td className="p-4 text-mediumGray dark:text-gray-300 text-right w-[10%]">
        <div>${debt.paid.toLocaleString()}</div>
        {debt.lastPaymentDate && (
          <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
            {new Date(debt.lastPaymentDate).toLocaleDateString()}
          </div>
        )}
      </td>
      <td className="p-4 text-redError font-semibold text-right w-[10%]">
        <div className="flex items-center justify-end space-x-1">
          <span>${debt.remaining.toLocaleString()}</span>
          {isOverdue && <AlertTriangle size={14} className="text-redError" />}
        </div>
        <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
          {((debt.paid / debt.amount) * 100).toFixed(1)}% paid
        </div>
      </td>
      <td className="p-4 text-mediumGray dark:text-gray-300 text-right w-[12%]">
        <div>{new Date(debt.dueDate).toLocaleDateString()}</div>
        <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
          {debt.paymentTerms || 'Standard'}
        </div>
      </td>
      <td className="p-4 text-center w-[10%]">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 ${statusClass} ${statusBgClass}`}>
          {statusIcon} <span>{debt.status}</span>
        </span>
      </td>
      <td className="p-4 text-right w-[18%]">
        <div className="flex items-center justify-end space-x-1">
          <button onClick={() => onViewDetails(debt.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="View Details">
            <Eye size={16} />
          </button>
          {debt.status !== 'Paid' && (
            <button onClick={() => onRecordPayment(debt.id)} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Record Repayment">
              <CreditCard size={16} />
            </button>
          )}
          <button onClick={() => onDelete(debt.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Debt Record">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Mobile Debt Card Component ---
const MobileDebtCard: React.FC<{ debt: Debt; onRecordPayment: (id: string) => void; onDelete: (id: string) => void; onViewDetails: (id: string) => void }> = ({ debt, onRecordPayment, onDelete, onViewDetails }) => {
  let statusClass = '';
  let statusBgClass = '';
  let statusIcon: React.ReactNode;
  let borderColor = 'border-lightGray dark:border-gray-700';
  
  switch (debt.status) {
    case 'Overdue':
      statusClass = 'text-redError';
      statusBgClass = 'bg-redError/10';
      statusIcon = <XCircle size={14} />;
      borderColor = 'border-redError';
      break;
    case 'Upcoming':
      statusClass = 'text-primary';
      statusBgClass = 'bg-primary/10';
      statusIcon = <ClockIcon size={14} />;
      borderColor = 'border-primary';
      break;
    case 'Active':
      statusClass = 'text-accent';
      statusBgClass = 'bg-accent/10';
      statusIcon = <InfoIcon size={14} />;
      borderColor = 'border-accent';
      break;
    case 'Paid':
      statusClass = 'text-secondary';
      statusBgClass = 'bg-secondary/10';
      statusIcon = <CheckCircle size={14} />;
      borderColor = 'border-secondary';
      break;
    default:
      statusClass = 'text-mediumGray';
      statusBgClass = 'bg-mediumGray/10';
      statusIcon = <InfoIcon size={14} />;
  }

  const isOverdue = debt.status === 'Overdue';

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 ${borderColor} ${isOverdue ? 'bg-redError/5' : ''}`}>
      {/* Header with lender and actions */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-darkGray dark:text-gray-100 text-base flex items-center space-x-2 truncate">
            <User size={18} className="text-primary flex-shrink-0" />
            <span className="truncate">{debt.lender}</span>
          </h4>
          {debt.phoneNumber && (
            <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1 mt-1">
              <Phone size={12} className="flex-shrink-0" />
              <span className="truncate">{debt.phoneNumber}</span>
            </p>
          )}
        </div>
        <div className="flex space-x-1 flex-shrink-0 ml-2">
          <button onClick={() => onViewDetails(debt.id)} className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View">
            <Eye size={14} />
          </button>
          {debt.status !== 'Paid' && (
            <button onClick={() => onRecordPayment(debt.id)} className="p-1.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors duration-200" title="Record Payment">
              <CreditCard size={14} />
            </button>
          )}
          <button onClick={() => onDelete(debt.id)} className="p-1.5 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {/* Amount and status */}
      <div className="mb-3">
        <div className="text-xl font-bold text-darkGray dark:text-gray-100 mb-1">
          ${debt.amount.toLocaleString()}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit ${statusClass} ${statusBgClass}`}>
            {statusIcon}
            <span className="ml-1">{debt.status}</span>
          </span>
          {isOverdue && <AlertTriangle size={14} className="text-redError" />}
        </div>
      </div>
      
      {/* Debt details */}
      <div className="space-y-2">
        <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <Tag size={12} className="flex-shrink-0" />
          <span className="truncate">{debt.type}</span>
          {debt.interestRate && (
            <span className="text-accent">({debt.interestRate}%)</span>
          )}
        </p>
        <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <Calendar size={12} className="flex-shrink-0" />
          <span className="truncate">Due: {new Date(debt.dueDate).toLocaleDateString()}</span>
        </p>
        <div className="flex justify-between text-xs">
          <span className="text-secondary">Paid: ${debt.paid.toLocaleString()}</span>
          <span className="text-redError">Remaining: ${debt.remaining.toLocaleString()}</span>
        </div>
        <div className="text-xs text-mediumGray dark:text-gray-400">
          {((debt.paid / debt.amount) * 100).toFixed(1)}% paid
        </div>
        {debt.project && (
          <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-2">
            <Briefcase size={12} className="flex-shrink-0" />
            <span className="truncate">{debt.project}</span>
          </p>
        )}
        {debt.description && (
          <p className="text-xs text-mediumGray dark:text-gray-400 truncate" title={debt.description}>
            {debt.description}
          </p>
        )}
      </div>
    </div>
  );
};

// --- Mobile Receivable Card Component ---
const MobileReceivableCard: React.FC<{ receivable: Receivable; onRecordReceipt: (id: string) => void; onSendReminder: (id: string) => void; onViewDetails: (id: string) => void }> = ({ receivable, onRecordReceipt, onSendReminder, onViewDetails }) => {
  let statusClass = '';
  let statusBgClass = '';
  let statusIcon: React.ReactNode;
  let borderColor = 'border-lightGray dark:border-gray-700';
  
  switch (receivable.status) {
    case 'Overdue':
      statusClass = 'text-redError';
      statusBgClass = 'bg-redError/10';
      statusIcon = <XCircle size={14} />;
      borderColor = 'border-redError';
      break;
    case 'Upcoming':
      statusClass = 'text-primary';
      statusBgClass = 'bg-primary/10';
      statusIcon = <ClockIcon size={14} />;
      borderColor = 'border-primary';
      break;
    case 'Paid':
      statusClass = 'text-secondary';
      statusBgClass = 'bg-secondary/10';
      statusIcon = <CheckCircle size={14} />;
      borderColor = 'border-secondary';
      break;
    default:
      statusClass = 'text-mediumGray';
      statusBgClass = 'bg-mediumGray/10';
      statusIcon = <InfoIcon size={14} />;
  }

  const isOverdue = receivable.status === 'Overdue';

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 ${borderColor} ${isOverdue ? 'bg-redError/5' : ''}`}>
      {/* Header with client and actions */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-darkGray dark:text-gray-100 text-base flex items-center space-x-2 truncate">
            <User size={18} className="text-primary flex-shrink-0" />
            <span className="truncate">{receivable.client}</span>
          </h4>
          {receivable.phoneNumber && (
            <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1 mt-1">
              <Phone size={12} className="flex-shrink-0" />
              <span className="truncate">{receivable.phoneNumber}</span>
            </p>
          )}
        </div>
        <div className="flex space-x-1 flex-shrink-0 ml-2">
          <button onClick={() => onViewDetails(receivable.id)} className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View">
            <Eye size={14} />
          </button>
          {receivable.status !== 'Paid' && (
            <button onClick={() => onRecordReceipt(receivable.id)} className="p-1.5 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors duration-200" title="Record Receipt">
              <DollarSign size={14} />
            </button>
          )}
          {receivable.status === 'Overdue' && (
            <button onClick={() => onSendReminder(receivable.id)} className="p-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Send Reminder">
              <Bell size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* Amount and status */}
      <div className="mb-3">
        <div className="text-xl font-bold text-darkGray dark:text-gray-100 mb-1">
          ${receivable.amount.toLocaleString()}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit ${statusClass} ${statusBgClass}`}>
            {statusIcon}
            <span className="ml-1">{receivable.status}</span>
          </span>
          {isOverdue && <AlertTriangle size={14} className="text-redError" />}
        </div>
      </div>
      
      {/* Receivable details */}
      <div className="space-y-2">
        <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <Briefcase size={12} className="flex-shrink-0" />
          <span className="truncate">{receivable.project}</span>
        </p>
        <p className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-2">
          <Calendar size={12} className="flex-shrink-0" />
          <span className="truncate">Due: {new Date(receivable.dueDate).toLocaleDateString()}</span>
        </p>
        <div className="flex justify-between text-xs">
          <span className="text-secondary">Received: ${receivable.received.toLocaleString()}</span>
          <span className="text-redError">Remaining: ${receivable.remaining.toLocaleString()}</span>
        </div>
        <div className="text-xs text-mediumGray dark:text-gray-400">
          {((receivable.received / receivable.amount) * 100).toFixed(1)}% received
        </div>
        {receivable.description && (
          <p className="text-xs text-mediumGray dark:text-gray-400 truncate" title={receivable.description}>
            {receivable.description}
          </p>
        )}
      </div>
    </div>
  );
};

// --- Enhanced Receivable Table Row Component ---
const ReceivableRow: React.FC<{ receivable: Receivable; onRecordReceipt: (id: string) => void; onSendReminder: (id: string) => void; onViewDetails: (id: string) => void }> = ({ receivable, onRecordReceipt, onSendReminder, onViewDetails }) => {
    let statusClass = '';
    let statusBgClass = '';
    let statusIcon: React.ReactNode;

    switch (receivable.status) {
        case 'Overdue':
            statusClass = 'text-redError';
            statusBgClass = 'bg-redError/10';
            statusIcon = <XCircle size={16} />;
            break;
        case 'Upcoming':
            statusClass = 'text-primary';
            statusBgClass = 'bg-primary/10';
            statusIcon = <ClockIcon size={16} />;
            break;
        case 'Paid':
            statusClass = 'text-secondary';
            statusBgClass = 'bg-secondary/10';
            statusIcon = <CheckCircle size={16} />;
            break;
        default:
            statusClass = 'text-mediumGray';
            statusBgClass = 'bg-mediumGray/10';
            statusIcon = <InfoIcon size={16} />;
    }

    const isOverdue = receivable.status === 'Overdue';
    const rowClass = isOverdue ? 'bg-redError/5 border-l-4 border-redError' : '';

    return (
        <tr className={`hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0 ${rowClass}`}>
            <td className="p-4 text-darkGray dark:text-gray-100 font-medium w-[18%]">
                <div className="flex items-center space-x-2">
                    <User size={18} className="text-primary"/>
                    <div>
                        <div className="font-semibold">{receivable.client}</div>
                        {receivable.phoneNumber && (
                            <div className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
                                <Phone size={12} />
                                <span>{receivable.phoneNumber}</span>
                            </div>
                        )}
            {receivable.email && (
              <div className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
                <Mail size={12} />
                <span>{receivable.email}</span>
              </div>
            )}
            {receivable.companyName && (
              <div className="text-xs text-mediumGray dark:text-gray-400 flex items-center space-x-1">
                <Building size={12} />
                <span>{receivable.companyName}</span>
              </div>
            )}
                    </div>
                </div>
            </td>
            <td className="p-4 text-mediumGray dark:text-gray-300 w-[15%]">
                <div className="flex items-center space-x-2">
                    <Briefcase size={16} className="text-accent"/>
                    <div>
                        <div>{receivable.project}</div>
                        {receivable.projectStatus && (
                            <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                                Status: {receivable.projectStatus}
                            </div>
                        )}
                        {receivable.projectValue && (
                            <div className="text-xs text-accent mt-1">
                                Value: ${receivable.projectValue.toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="p-4 text-darkGray dark:text-gray-100 font-semibold text-right w-[10%]">
                <div>${receivable.amount.toLocaleString()}</div>
                {receivable.description && (
                    <div className="text-xs text-mediumGray dark:text-gray-400 mt-1 truncate" title={receivable.description}>
                        {receivable.description}
                    </div>
                )}
            </td>
            <td className="p-4 text-secondary font-semibold text-right w-[10%]">
                <div>${receivable.received.toLocaleString()}</div>
                {receivable.lastPaymentDate && (
                    <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                        {new Date(receivable.lastPaymentDate).toLocaleDateString()}
                    </div>
                )}
            </td>
            <td className="p-4 text-redError font-semibold text-right w-[10%]">
                <div className="flex items-center justify-end space-x-1">
                    <span>${receivable.remaining.toLocaleString()}</span>
                    {isOverdue && <AlertTriangle size={14} className="text-redError" />}
                </div>
                <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                    {((receivable.received / receivable.amount) * 100).toFixed(1)}% received
                </div>
            </td>
            <td className="p-4 text-mediumGray dark:text-gray-300 text-right w-[12%]">
                <div>{new Date(receivable.dueDate).toLocaleDateString()}</div>
                <div className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                    {receivable.paymentTerms || 'Standard'}
                </div>
            </td>
            <td className="p-4 text-center w-[10%]">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 ${statusClass} ${statusBgClass}`}>
                    {statusIcon} <span>{receivable.status}</span>
                </span>
            </td>
            <td className="p-4 text-right w-[15%]">
                <div className="flex items-center justify-end space-x-1">
                    <button onClick={() => onViewDetails(receivable.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="View Details">
                        <Eye size={16} />
                    </button>
                    {receivable.status !== 'Paid' && (
                        <button onClick={() => onRecordReceipt(receivable.id)} className="p-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors duration-200" title="Record Receipt">
                            <CreditCard size={16} />
                        </button>
                    )}
                    {receivable.remaining > 0 && (
                        <button onClick={() => onSendReminder(receivable.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Send Reminder">
                            <Bell size={16} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

// --- Enhanced Debt Card Component (for Mobile View) ---
const DebtCard: React.FC<{ debt: Debt; onRecordPayment: (id: string) => void; onDelete: (id: string) => void; onViewDetails: (id: string) => void }> = ({ debt, onRecordPayment, onDelete, onViewDetails }) => {
    const remaining = debt.remaining;
    let statusClass = '';
    let statusBgClass = '';

    switch (debt.status) {
        case 'Overdue': statusClass = 'text-redError'; statusBgClass = 'bg-redError/10'; break;
        case 'Upcoming': statusClass = 'text-primary'; statusBgClass = 'bg-primary/10'; break;
        case 'Active': statusClass = 'text-accent'; statusBgClass = 'bg-accent/10'; break;
        case 'Paid': statusClass = 'text-secondary'; statusBgClass = 'bg-secondary/10'; break;
        default: statusClass = 'text-mediumGray'; statusBgClass = 'bg-mediumGray/10';
    }

    return (
        <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 ${remaining > 0 ? 'border-redError' : 'border-secondary'} relative`}>
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
                    <User size={20} className="text-primary"/> <span>{debt.lender}</span>
                </h4>
                <div className="flex space-x-1 flex-shrink-0">
                    <button onClick={() => onViewDetails(debt.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="View Details">
                        <Eye size={16} />
                    </button>
                    {debt.status !== 'Paid' && (
                        <button onClick={() => onRecordPayment(debt.id)} className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Record Repayment">
                            <CreditCard size={16} />
                        </button>
                    )}
                    <button onClick={() => onDelete(debt.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            
            {debt.project && (
                <p className="text-sm text-accent mb-1 flex items-center space-x-2">
                    <Briefcase size={14}/> <span>Mashruuc: {debt.project}</span>
                </p>
            )}
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <Tag size={14} className="text-secondary"/> <span>Nooca: {debt.type}</span>
            </p>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14} className="text-darkGray"/> <span>Qiimaha: ${debt.amount.toLocaleString()}</span>
            </p>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14} className="text-secondary"/> <span>La Bixiyay: ${debt.paid.toLocaleString()}</span>
            </p>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14} className="text-redError"/> <span>Hadhay: ${remaining.toLocaleString()}</span>
            </p>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <Calendar size={14}/> <span>La Sugayo: {new Date(debt.dueDate).toLocaleDateString()}</span>
            </p>
            
            {debt.phoneNumber && (
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                    <Phone size={14}/> <span>{debt.phoneNumber}</span>
                </p>
            )}
            
            {debt.email && (
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                    <Mail size={14}/> <span>{debt.email}</span>
                </p>
            )}
            
            {debt.companyName && (
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                    <Building size={14}/> <span>{debt.companyName}</span>
                </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 ${statusClass} ${statusBgClass}`}>
                    <span>{debt.status}</span>
                </div>
                <div className="text-xs text-mediumGray dark:text-gray-400">
                    {((debt.paid / debt.amount) * 100).toFixed(1)}% paid
                </div>
            </div>
        </div>
    );
};

// --- Enhanced Receivable Card Component (for Mobile View) ---
const ReceivableCard: React.FC<{ receivable: Receivable; onRecordReceipt: (id: string) => void; onSendReminder: (id: string) => void; onViewDetails: (id: string) => void }> = ({ receivable, onRecordReceipt, onSendReminder, onViewDetails }) => {
    const remaining = receivable.remaining;
    let statusClass = '';
    let statusBgClass = '';

    switch (receivable.status) {
        case 'Overdue': statusClass = 'text-redError'; statusBgClass = 'bg-redError/10'; break;
        case 'Upcoming': statusClass = 'text-primary'; statusBgClass = 'bg-primary/10'; break;
        case 'Paid': statusClass = 'text-secondary'; statusBgClass = 'bg-secondary/10'; break;
        default: statusClass = 'text-mediumGray'; statusBgClass = 'bg-mediumGray/10';
    }

    return (
        <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 ${remaining > 0 ? 'border-redError' : 'border-secondary'} relative`}>
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
                    <User size={20} className="text-primary"/> <span>{receivable.client}</span>
                </h4>
                <div className="flex space-x-1 flex-shrink-0">
                    <button onClick={() => onViewDetails(receivable.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="View Details">
                        <Eye size={16} />
                    </button>
                    {receivable.status !== 'Paid' && (
                        <button onClick={() => onRecordReceipt(receivable.id)} className="p-1 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-colors duration-200" title="Record Receipt">
                            <CreditCard size={16} />
                        </button>
                    )}
                    {remaining > 0 && (
                        <button onClick={() => onSendReminder(receivable.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Send Reminder">
                            <Bell size={16} />
                        </button>
                    )}
                </div>
            </div>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <Briefcase size={14}/> <span>Mashruuc: {receivable.project}</span>
            </p>
            
            {receivable.projectStatus && (
                <p className="text-sm text-accent mb-1 flex items-center space-x-2">
                    <InfoIcon size={14}/> <span>Xaaladda: {receivable.projectStatus}</span>
                </p>
            )}
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14} className="text-darkGray"/> <span>Qiimaha: ${receivable.amount.toLocaleString()}</span>
            </p>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14} className="text-secondary"/> <span>La Helay: ${receivable.received.toLocaleString()}</span>
            </p>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14} className="text-redError"/> <span>Hadhay: ${remaining.toLocaleString()}</span>
            </p>
            
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <Calendar size={14}/> <span>La Sugayo: {new Date(receivable.dueDate).toLocaleDateString()}</span>
            </p>
            
            {receivable.phoneNumber && (
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                    <Phone size={14}/> <span>{receivable.phoneNumber}</span>
                </p>
            )}
            
            {receivable.email && (
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                    <Mail size={14}/> <span>{receivable.email}</span>
                </p>
            )}
            
            {receivable.companyName && (
                <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                    <Building size={14}/> <span>{receivable.companyName}</span>
                </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 ${statusClass} ${statusBgClass}`}>
                    <span>{receivable.status}</span>
                </div>
                <div className="text-xs text-mediumGray dark:text-gray-400">
                    {((receivable.received / receivable.amount) * 100).toFixed(1)}% received
                </div>
            </div>
        </div>
    );
};


// --- Debt Repayment Modal Component ---
const DebtRepaymentModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  debt: Debt | null; 
  onRecordPayment: (debtId: string, amount: number, paymentMethod: string, notes: string) => void 
}> = ({ isOpen, onClose, debt, onRecordPayment }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt || !amount) return;
    
    setLoading(true);
    try {
      await onRecordPayment(debt.id, parseFloat(amount), paymentMethod, notes);
      setAmount('');
      setNotes('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !debt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">Record Debt Repayment</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-lightGray dark:hover:bg-gray-700 transition-colors" title="Close Modal">
              <X size={20} className="text-mediumGray dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Debt to: {debt.lender}
            </label>
            <div className="text-sm text-mediumGray dark:text-gray-400">
              Total: ${debt.amount.toLocaleString()} | Remaining: ${debt.remaining.toLocaleString()}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={debt.remaining}
              step="0.01"
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter payment amount"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Payment Method
            </label>
            <select
              title="Select payment method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Optional notes about this payment"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-lightGray dark:border-gray-700 text-mediumGray dark:text-gray-400 rounded-lg hover:bg-lightGray dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > debt.remaining}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} className="mr-2" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Receivable Payment Modal Component ---
const ReceivablePaymentModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  receivable: Receivable | null; 
  onRecordReceipt: (receivableId: string, amount: number, paymentMethod: string, notes: string) => void 
}> = ({ isOpen, onClose, receivable, onRecordReceipt }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivable || !amount) return;
    
    setLoading(true);
    try {
      await onRecordReceipt(receivable.id, parseFloat(amount), paymentMethod, notes);
      setAmount('');
      setNotes('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !receivable) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-lightGray dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">Record Payment Received</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-lightGray dark:hover:bg-gray-700 transition-colors" title="Close Modal">
              <X size={20} className="text-mediumGray dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Payment from: {receivable.client}
            </label>
            <div className="text-sm text-mediumGray dark:text-gray-400">
              Project: {receivable.project} | Remaining: ${receivable.remaining.toLocaleString()}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={receivable.remaining}
              step="0.01"
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter payment amount"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Payment Method
            </label>
            <select
              title="Select payment method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Optional notes about this payment"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-lightGray dark:border-gray-700 text-mediumGray dark:text-gray-400 rounded-lg hover:bg-lightGray dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > receivable.remaining}
              className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} className="mr-2" />}
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Debts Overview Page Component
export default function DebtsOverviewReportPage() {
  const [activeTab, setActiveTab] = useState('Company Debts'); // 'Company Debts', 'Project Debts', or 'Receivables'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  
  // NEW: Advanced filtering states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [amountFilter, setAmountFilter] = useState<{min: string, max: string}>({min: '', max: ''});
  const [overdueOnlyFilter, setOverdueOnlyFilter] = useState(false);
  const [projectFilter, setProjectFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'amount' | 'dueDate' | 'lender' | 'remaining'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [debtRepaymentModal, setDebtRepaymentModal] = useState<{ isOpen: boolean; debt: Debt | null }>({ isOpen: false, debt: null });
  const [receivablePaymentModal, setReceivablePaymentModal] = useState<{ isOpen: boolean; receivable: Receivable | null }>({ isOpen: false, receivable: null });
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);

  const debtTypes: string[] = ['All', 'Supplier Credit', 'Loan', 'Investor Loan', 'Equipment Purchase', 'Service Payment', 'Other'];
  const debtStatuses: string[] = ['All', 'Active', 'Upcoming', 'Overdue', 'Paid'];
  const receivableStatuses: string[] = ['All', 'Upcoming', 'Overdue', 'Paid'];
  const dateRanges: string[] = ['All', 'Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];
  
  // NEW: Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterType('All');
    setFilterStatus('All');
    setFilterDateRange('All');
    setAmountFilter({min: '', max: ''});
    setOverdueOnlyFilter(false);
    setProjectFilter('All');
    setSortBy('dueDate');
    setSortOrder('desc');
  };

  // NEW: Export to CSV function
  const exportToCSV = () => {
    const data = getCurrentDebts();
    const headers = activeTab === 'Receivables' 
      ? ['ID', 'Client', 'Project', 'Amount', 'Received', 'Remaining', 'Status', 'Due Date']
      : ['ID', 'Lender', 'Type', 'Amount', 'Paid', 'Remaining', 'Status', 'Due Date', 'Project'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        activeTab === 'Receivables' 
          ? [item.id, (item as Receivable).client, (item as Receivable).project, item.amount, (item as Receivable).received, item.remaining, item.status, item.dueDate].join(',')
          : [item.id, (item as Debt).lender, (item as Debt).type, item.amount, (item as Debt).paid, item.remaining, item.status, item.dueDate, (item as Debt).project || ''].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToastMessage({ message: 'Faylka CSV si guul leh ayaa loo soo dejiyay!', type: 'success' });
  };


  useEffect(() => {
    async function fetchDebts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reports/debts');
        if (!res.ok) throw new Error('Failed to fetch debts data');
        const data = await res.json();
        
        if (data.success) {
          // Use the new API format with pre-processed data
          setDebts(data.debts || []);
          setReceivables(data.receivables || []);
          setToastMessage({ message: 'Warbixinta si guul leh ayaa la soo geliyay!', type: 'success' });
        } else {
          // Fallback to legacy format if needed
          const vendorMap: Record<string, any> = {};
          [...(data.companyDebts || []), ...(data.projectDebts || [])].forEach((d: any) => {
            const key = d.vendor?.id || d.vendorId || d.id;
            if (!vendorMap[key]) {
              vendorMap[key] = {
                id: d.id,
                lender: d.vendor?.name || 'Unknown Vendor',
                lenderId: d.vendor?.id || d.vendorId || d.id,
                type: d.type || 'Supplier Credit',
                amount: 0,
                paid: 0,
                remaining: 0,
                issueDate: d.transactionDate || new Date().toISOString(),
                dueDate: d.transactionDate || new Date().toISOString(),
                status: 'Active',
                project: d.project?.name || '',
                projectId: d.projectId || '',
                description: d.description || '',
                account: d.account?.name || '',
                phoneNumber: d.vendor?.phoneNumber || '',
                email: d.vendor?.email || '',
                address: d.vendor?.address || '',
                lastPaymentDate: null,
                interestRate: null,
                paymentTerms: 'Standard',
                notes: d.description || ''
              };
            }
            if (d.type === 'DEBT_TAKEN') vendorMap[key].amount += Number(d.amount);
            if (d.type === 'DEBT_REPAID') {
              vendorMap[key].paid += Number(d.amount);
              vendorMap[key].lastPaymentDate = d.transactionDate;
            }
          });
          
          Object.values(vendorMap).forEach((v: any) => {
            v.remaining = v.amount - v.paid;
            if (v.remaining <= 0) v.status = 'Paid';
            else if (new Date(v.dueDate) < new Date()) v.status = 'Overdue';
            else v.status = 'Active';
          });
          
          const debts = Object.values(vendorMap);

          // Group receivables by customer
          const clientMap: Record<string, any> = {};
          [...(data.clientReceivables || []), ...(data.projectReceivables || [])].forEach((r: any) => {
            const key = r.customer?.id || r.customerId || r.id;
            if (!clientMap[key]) {
              clientMap[key] = {
                id: r.id,
                client: r.customer?.name || 'Unknown Client',
                clientId: r.customer?.id || r.customerId || r.id,
                project: r.project?.name || 'General',
                projectId: r.projectId || '',
                amount: 0,
                received: 0,
                remaining: 0,
                dueDate: r.transactionDate || new Date().toISOString(),
                status: 'Upcoming',
                description: r.description || '',
                account: r.account?.name || '',
                phoneNumber: r.customer?.phoneNumber || '',
                email: r.customer?.email || '',
                address: r.customer?.address || '',
                lastPaymentDate: null,
                paymentTerms: 'Standard',
                notes: r.description || '',
                projectStatus: r.project?.status || 'Active',
                projectValue: r.project?.budget ? Number(r.project.budget) : 0
              };
            }
            if (r.type === 'DEBT_TAKEN') clientMap[key].amount += Number(r.amount);
            if (r.type === 'DEBT_REPAID') {
              clientMap[key].received += Number(r.amount);
              clientMap[key].lastPaymentDate = r.transactionDate;
            }
          });
          
          Object.values(clientMap).forEach((c: any) => {
            c.remaining = c.amount - c.received;
            if (c.remaining <= 0) c.status = 'Paid';
            else if (new Date(c.dueDate) < new Date()) c.status = 'Overdue';
            else c.status = 'Upcoming';
          });
          
          const receivables = Object.values(clientMap);
          setDebts(debts);
          setReceivables(receivables);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching debts data');
        setToastMessage({ message: 'Cilad ayaa dhacday marka warbixinta la soo gelinayay.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchDebts();
  }, []);


  // Separate project and company debts
  const projectDebts = debts.filter(debt => debt.projectId && debt.project);
  const companyDebts = debts.filter(debt => !debt.projectId || !debt.project);

  // Enhanced Statistics for Debts Owed
  const totalDebtsOwed = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
  const totalDebtsPaid = debts.reduce((sum, debt) => sum + (debt.paid || 0), 0);
  const remainingDebtsOwed = debts.reduce((sum, debt) => sum + (debt.remaining || 0), 0);
  const overdueDebtsOwed = debts.filter(debt => debt.status === 'Overdue').reduce((sum, debt) => sum + (debt.remaining || 0), 0);
  const activeDebtsCount = debts.filter(debt => debt.status === 'Active').length;
  const paidDebtsCount = debts.filter(debt => debt.status === 'Paid').length;

  // Enhanced Statistics for Receivables
  const totalReceivableAmount = receivables.reduce((sum, rec) => sum + (rec.amount || 0), 0);
  const totalReceivableReceived = receivables.reduce((sum, rec) => sum + (rec.received || 0), 0);
  const remainingReceivableAmount = receivables.reduce((sum, rec) => sum + (rec.remaining || 0), 0);
  const overdueReceivableAmount = receivables.filter(rec => rec.status === 'Overdue').reduce((sum, rec) => sum + (rec.remaining || 0), 0);
  const upcomingReceivablesCount = receivables.filter(rec => rec.status === 'Upcoming').length;
  const paidReceivablesCount = receivables.filter(rec => rec.status === 'Paid').length;


  // Get current debts based on active tab
  const getCurrentDebts = () => {
    switch (activeTab) {
      case 'Company Debts':
        return companyDebts;
      case 'Project Debts':
        return projectDebts;
      case 'Receivables':
        return receivables;
      default:
        return debts;
    }
  };

  const filteredDebts = getCurrentDebts().filter(item => {
    // Type-safe filtering based on active tab
    if (activeTab === 'Receivables') {
      const debt = item as Receivable;
      const matchesSearch = searchTerm === '' || 
        debt.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.phoneNumber?.includes(searchTerm) ||
        debt.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'All' || debt.status === filterStatus;
      const matchesDate = filterDateRange === 'All' ? true : true;
      
      const matchesProject = projectFilter === 'All' || debt.project === projectFilter;
      const matchesAmount = (!amountFilter.min || debt.amount >= parseFloat(amountFilter.min)) &&
                           (!amountFilter.max || debt.amount <= parseFloat(amountFilter.max));
      const matchesOverdue = !overdueOnlyFilter || debt.status === 'Overdue';
      
      return matchesSearch && matchesStatus && matchesDate && matchesProject && matchesAmount && matchesOverdue;
    } else {
      const debt = item as Debt;
      const matchesSearch = searchTerm === '' || 
        debt.lender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.phoneNumber?.includes(searchTerm) ||
        debt.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'All' || debt.type === filterType;
      const matchesStatus = filterStatus === 'All' || debt.status === filterStatus;
      const matchesDate = filterDateRange === 'All' ? true : true;
      
      const matchesProject = projectFilter === 'All' || debt.project === projectFilter;
      const matchesAmount = (!amountFilter.min || debt.amount >= parseFloat(amountFilter.min)) &&
                           (!amountFilter.max || debt.amount <= parseFloat(amountFilter.max));
      const matchesOverdue = !overdueOnlyFilter || debt.status === 'Overdue';
    
      return matchesSearch && matchesType && matchesStatus && matchesDate && matchesProject && matchesAmount && matchesOverdue;
    }
  }).sort((a, b) => {
    // NEW: Type-safe sorting logic
    let comparison = 0;
    switch (sortBy) {
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'remaining':
        comparison = a.remaining - b.remaining;
        break;
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'lender':
        if (activeTab === 'Receivables') {
          comparison = (a as Receivable).client.localeCompare((b as Receivable).client);
        } else {
          comparison = (a as Debt).lender.localeCompare((b as Debt).lender);
        }
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredReceivables = receivables.filter(rec => {
    const matchesSearch = searchTerm === '' || 
      rec.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.phoneNumber?.includes(searchTerm) ||
      rec.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || rec.status === filterStatus;
    const matchesDate = filterDateRange === 'All' ? true : true; // Add date filtering logic if needed
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Enhanced handler functions
  const handleRecordRepayment = (id: string) => {
    const debtToUpdate = debts.find(d => d.id === id);
    if (debtToUpdate) {
      if (debtToUpdate.remaining <= 0) {
        setToastMessage({ message: 'Deyntan horey ayaa loo bixiyay!', type: 'info' });
        return;
      }
      setDebtRepaymentModal({ isOpen: true, debt: debtToUpdate });
    }
  };

  const handleRecordReceipt = (id: string) => {
    const receivableToUpdate = receivables.find(r => r.id === id);
    if (receivableToUpdate) {
        if (receivableToUpdate.remaining <= 0) {
            setToastMessage({ message: 'Lacagtan horey ayaa loo helay!', type: 'info' });
            return;
        }
        setReceivablePaymentModal({ isOpen: true, receivable: receivableToUpdate });
    }
  };

  const handleSendReminder = (id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (receivable) {
      console.log(`Sending reminder for receivable ID: ${id} to client ${receivable.client}`);
      setToastMessage({ message: `Xasuusin ayaa loo diray macmiilka "${receivable.client}"!`, type: 'success' });
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto diiwaanka deyntan?')) {
      try {
        // In a real app, you would delete the debt record via API
        // For now, we'll just remove it from local state
        setDebts(prevDebts => prevDebts.filter(debt => debt.id !== id));
        setToastMessage({ message: 'Diiwaanka deynta waa la tirtiray!', type: 'success' });
      } catch (error) {
        setToastMessage({ message: 'Cilad ayaa dhacday marka diiwaanka la tirtirayay!', type: 'error' });
      }
    }
  };

  const handleViewDetails = (id: string) => {
    if (activeTab === 'Debts Owed') {
      const debt = debts.find(d => d.id === id);
      if (debt) {
        setSelectedDebt(debt);
        // You can add a details modal here
        setToastMessage({ message: `Viewing details for debt: ${debt.lender}`, type: 'info' });
      }
    } else {
      const receivable = receivables.find(r => r.id === id);
      if (receivable) {
        setSelectedReceivable(receivable);
        // You can add a details modal here
        setToastMessage({ message: `Viewing details for receivable: ${receivable.client}`, type: 'info' });
      }
    }
  };

  // Enhanced payment recording functions with API integration
  const handleDebtPayment = async (debtId: string, amount: number, paymentMethod: string, notes: string) => {
    try {
      // Create a new transaction record for the payment
      const response = await fetch('/api/accounting/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'DEBT_REPAID',
          amount: amount,
          description: `Debt repayment - ${paymentMethod}${notes ? ` - ${notes}` : ''}`,
          transactionDate: new Date().toISOString(),
          vendorId: debtId,
          accountId: 1, // Default account, should be selected by user
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      // Update local state
      setDebts(prevDebts => 
        prevDebts.map(debt => 
          debt.id === debtId 
            ? { 
                ...debt, 
                paid: debt.paid + amount, 
                remaining: debt.remaining - amount,
                status: debt.remaining - amount <= 0 ? 'Paid' : debt.status,
                lastPaymentDate: new Date().toISOString()
              }
            : debt
        )
      );
      
      setToastMessage({ 
        message: `Deyn bixin ayaa loo diiwaan geliyay! ${amount.toLocaleString()} ${paymentMethod}`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Payment recording error:', error);
      setToastMessage({ 
        message: 'Cilad ayaa dhacday marka bixinta la diiwaan gelinayay!', 
        type: 'error' 
      });
    }
  };

  const handleReceivablePayment = async (receivableId: string, amount: number, paymentMethod: string, notes: string) => {
    try {
      // Create a new transaction record for the payment received
      const response = await fetch('/api/accounting/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'DEBT_REPAID',
          amount: amount,
          description: `Payment received - ${paymentMethod}${notes ? ` - ${notes}` : ''}`,
          transactionDate: new Date().toISOString(),
          customerId: receivableId,
          accountId: 1, // Default account, should be selected by user
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      // Update local state
      setReceivables(prevReceivables => 
        prevReceivables.map(receivable => 
          receivable.id === receivableId 
            ? { 
                ...receivable, 
                received: receivable.received + amount, 
                remaining: receivable.remaining - amount,
                status: receivable.remaining - amount <= 0 ? 'Paid' : receivable.status,
                lastPaymentDate: new Date().toISOString()
              }
            : receivable
        )
      );
      
      setToastMessage({ 
        message: `Lacagta laga sugayay waa la helay! ${amount.toLocaleString()} ${paymentMethod}`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Payment recording error:', error);
      setToastMessage({ 
        message: 'Cilad ayaa dhacday marka lacagta la diiwaan gelinayay!', 
        type: 'error' 
      });
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
        <span className="animate-spin mr-3"><Scale size={32} className="text-primary" /></span> Warbixinta Deymaha & Lacagaha la sugayo ayaa soo dhacaya...
      </div>
    </Layout>
  );
  if (error) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={32} className="mb-2 text-redError" />
        <div className="text-redError text-lg font-bold mb-2">{error}</div>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold mt-2">Reload</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Mobile-Optimized Header */}
      <div className="mb-6 md:mb-8">
        {/* Mobile Header - Stacked Layout */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          {/* Title Section */}
          <div className="flex items-center">
            <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 md:mr-4">
              <ArrowLeft size={24} className="md:w-7 md:h-7" />
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold text-darkGray dark:text-gray-100">
              Debts Overview
            </h1>
          </div>
          
          {/* Mobile Action Buttons */}
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
            {/* Download Dropdown - Mobile Optimized */}
            <div className="relative group">
              <button className="bg-primary text-white py-2 px-4 md:py-2.5 md:px-6 rounded-lg font-semibold text-sm md:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center w-full md:w-auto">
                <Download size={16} className="mr-2" /> 
                <span className="hidden sm:inline">Soo Deji</span>
                <span className="sm:hidden">Download</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-lightGray dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-2">
                  <button 
                    onClick={() => exportToCSV()}
                    className="w-full text-left px-4 py-2 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700 flex items-center"
                  >
                    <FileText size={16} className="mr-2" /> CSV
                  </button>
                  <button 
                    onClick={() => {/* PDF export */}}
                    className="w-full text-left px-4 py-2 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700 flex items-center"
                  >
                    <FileTextIcon size={16} className="mr-2" /> PDF
                  </button>
                  <button 
                    onClick={() => {/* Excel export */}}
                    className="w-full text-left px-4 py-2 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700 flex items-center"
                  >
                    <FileText size={16} className="mr-2" /> Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Debt Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-redError">
          <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Wadarta Deynaha an leenahay</h4>
          <p className="text-2xl md:text-3xl font-extrabold text-redError mb-1">-${remainingDebtsOwed.toLocaleString()}</p>
          <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400">Guud: ${totalDebtsOwed.toLocaleString()} | La bixiyay: ${totalDebtsPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center border-l-4 border-redError">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Deynaha Dib U Dhacay</h4>
          <p className="text-3xl font-extrabold text-redError mb-1">-${overdueDebtsOwed.toLocaleString()}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">Tirada: {debts.filter(d => d.status === 'Overdue').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center border-l-4 border-secondary">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Wadarta Lacagaha La Sugayo</h4>
          <p className="text-3xl font-extrabold text-secondary mb-1">${remainingReceivableAmount.toLocaleString()}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">Guud: ${totalReceivableAmount.toLocaleString()} | La helay: ${totalReceivableReceived.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center border-l-4 border-redError">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Lacagaha La Sugayo ee Dib U Dhacay</h4>
          <p className="text-3xl font-extrabold text-redError mb-1">${overdueReceivableAmount.toLocaleString()}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">Tirada: {receivables.filter(r => r.status === 'Overdue').length}</p>
        </div>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center border-l-4 border-primary">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Deynaha Firfircoon</h4>
          <p className="text-3xl font-extrabold text-primary mb-1">{activeDebtsCount}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">Deynaha hadda jira</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center border-l-4 border-secondary">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Deynaha La Bixiyay</h4>
          <p className="text-3xl font-extrabold text-secondary mb-1">{paidDebtsCount}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">Deynaha dhammaan</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center border-l-4 border-accent">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Lacagaha La Sugayo</h4>
          <p className="text-3xl font-extrabold text-accent mb-1">{upcomingReceivablesCount}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">Lacago la sugayo</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center border-l-4 border-secondary">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Lacagaha La Helay</h4>
          <p className="text-3xl font-extrabold text-secondary mb-1">{paidReceivablesCount}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">Lacago la helay</p>
        </div>
      </div>

      {/* Mobile-Optimized Tabs for Debts Owed vs. Receivables */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in-up mb-6 md:mb-8">
        <div className="border-b border-lightGray dark:border-gray-700">
          {/* Mobile Tab Navigation - Scrollable */}
          <nav className="-mb-px flex space-x-2 md:space-x-8 px-4 md:px-6 lg:px-8 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('Company Debts')}
              className={`whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg focus:outline-none transition-colors duration-200 flex-shrink-0
                          ${activeTab === 'Company Debts' 
                            ? 'border-primary text-primary dark:text-gray-100' 
                            : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
            >
              <span className="hidden sm:inline">Deymaha shirkada lagu leyahay</span>
              <span className="sm:hidden">Shirkada </span>
              <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">({companyDebts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('Project Debts')}
              className={`whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg focus:outline-none transition-colors duration-200 flex-shrink-0
                          ${activeTab === 'Project Debts' 
                            ? 'border-primary text-primary dark:text-gray-100' 
                            : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
            >
              <span className="hidden sm:inline">Deynaha Mashruucyada</span>
              <span className="sm:hidden">Mashruuc</span>
              <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">({projectDebts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('Receivables')}
              className={`whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg focus:outline-none transition-colors duration-200 flex-shrink-0
                          ${activeTab === 'Receivables' 
                            ? 'border-primary text-primary dark:text-gray-100' 
                            : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
            >
              <span className="hidden sm:inline">daymaha customerska</span>
              <span className="sm:hidden">La Sugayo</span>
              <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">({receivables.length})</span>
            </button>
          </nav>
        </div>

        {/* Mobile-Optimized Filters for Current Tab */}
        <div className="p-4 md:p-6 flex flex-col space-y-4 border-b border-lightGray dark:border-gray-700">
          {/* Search Bar - Mobile Optimized */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Raadi ${activeTab === 'Company Debts' ? 'deynaha shirkadda' : activeTab === 'Project Debts' ? 'deynaha mashruucyada' : 'lacagaha la sugayo'}...`} 
              className="w-full p-2.5 md:p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 text-sm md:text-base"
            />
          </div>
          
          {/* Mobile Filter Row */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select 
              title="Filter by debt type"
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            >
              {activeTab === 'Debts Owed' ? (
                debtTypes.map((type: string) => <option key={type} value={type}>{type}</option>)
              ) : (
                <option value="All">Dhammaan Noocyada</option> // Receivables don't have types in dummy data
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
          <div className="relative w-full md:w-48">
            <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select 
              title="Filter by status"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            >
              {activeTab === 'Debts Owed' ? (
                debtStatuses.map((status: string) => <option key={status} value={status}>{status}</option>)
              ) : (
                receivableStatuses.map((status: string) => <option key={status} value={status}>{status}</option>)
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
          <div className="relative w-full md:w-48">
            <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <select 
              title="Filter by date range"
              value={filterDateRange} 
              onChange={(e) => setFilterDateRange(e.target.value)} 
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            >
              {dateRanges.map((range: string) => <option key={range} value={range}>{range}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400"><ChevronRight className="transform rotate-90" size={20} /></div>
          </div>
          
          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              showAdvancedFilters
                ? 'bg-primary text-white shadow-md'
                : 'bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-300 hover:bg-primary/10'
            }`}
            title="Toggle Advanced Filters"
          >
            <Filter size={20} className="inline mr-2" />
            Filtarrada Dheeraadka
          </button>

          {/* Clear Filters Button */}
          <button
            onClick={clearAllFilters}
            className="px-4 py-3 rounded-lg font-medium bg-accent text-white hover:bg-orange-600 transition-all duration-200 shadow-md"
            title="Clear All Filters"
          >
            <X size={20} className="inline mr-2" />
            Ka Saar
          </button>
        </div>

        {/* NEW: Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="p-6 bg-lightGray dark:bg-gray-700 border-t border-lightGray dark:border-gray-600">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
              <Filter size={20} className="mr-2" />
              Filtarrada Dheeraadka Ah
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Amount Range Filter */}
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha ($)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Ugu yar"
                    value={amountFilter.min}
                    onChange={(e) => setAmountFilter({...amountFilter, min: e.target.value})}
                    className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100"
                  />
                  <input
                    type="number"
                    placeholder="Ugu badan"
                    value={amountFilter.max}
                    onChange={(e) => setAmountFilter({...amountFilter, max: e.target.value})}
                    className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuc</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100"
                  title="Filter by project"
                >
                  <option value="All">Dhammaan Mashruucyada</option>
                  {/* Extract unique projects from debts */}
                  {Array.from(new Set(debts.map(d => d.project).filter(Boolean))).map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Ku kala sooc</label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100"
                    title="Sort by"
                  >
                    <option value="dueDate">Taariikhda</option>
                    <option value="amount">Qiimaha</option>
                    <option value="remaining">Hadhay</option>
                    <option value="lender">Deyn bixiyaha</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Filtarrada Degdegga</label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overdueOnlyFilter}
                      onChange={(e) => setOverdueOnlyFilter(e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-darkGray dark:text-gray-300">Kaliya kuwa dib u dhacay</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Status Indicator */}
        {(searchTerm || filterType !== 'All' || filterStatus !== 'All' || filterDateRange !== 'All' || 
          amountFilter.min || amountFilter.max || overdueOnlyFilter || projectFilter !== 'All') && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-blue-700 dark:text-blue-300">
                <InfoIcon size={16} className="mr-2" />
                <span className="text-sm font-medium">
                  Filtaryo ayaa la adeegsaday - {filteredDebts.length} ka mid ah {debts.length} deyn ayaa la muujiyay
                </span>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
              >
                Dhammaan ka saar
              </button>
            </div>
          </div>
        )}

        {/* Mobile-Optimized View Mode Toggle */}
        <div className="flex space-x-2 w-full justify-center mb-4 md:mb-6">
            <button 
              onClick={() => setViewMode('list')} 
              title="List View"
              className={`p-2 md:p-3 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}
            >
                <List size={18} className="md:w-5 md:h-5" />
            </button>
            <button 
              onClick={() => setViewMode('cards')} 
              title="Cards View"
              className={`p-2 md:p-3 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}
            >
                <LayoutGrid size={18} className="md:w-5 md:h-5" />
            </button>
        </div>

        {/* Debts/Receivables View */}
        {activeTab === 'Company Debts' || activeTab === 'Project Debts' ? (
            filteredDebts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
                    <Scale size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Ma jiraan deymo la nagugu leeyahay</h3>
                    <p className="text-sm">Haddii aad rabto inaad diiwaan geliso deyn cusub, fadlan dhagsii badhanka "Diiwaan Geli Deyn Cusub"</p>
                </div>
            ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block lg:hidden space-y-3">
                    {filteredDebts.map(item => (
                      <MobileDebtCard key={item.id} debt={item as Debt} onRecordPayment={handleRecordRepayment} onDelete={handleDeleteDebt} onViewDetails={handleViewDetails} />
                    ))}
                  </div>
                  
                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md animate-fade-in">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                      <thead className="bg-lightGray dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[18%]">Deynta Bixiyaha, Mashruuca & Shirkadda</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[12%]">Nooca & Faaiidada</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">Qiimaha Guud</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">La Bixiyay</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">Hadhay</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[12%]">Taariikhda & Shuruudaha</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">Xaaladda</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[18%]">Ficillo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {filteredDebts.map(item => (
                          <DebtRow key={item.id} debt={item as Debt} onRecordPayment={handleRecordRepayment} onDelete={handleDeleteDebt} onViewDetails={handleViewDetails} />
                        ))}
                      </tbody>
                    </table>
                    {/* Pagination Placeholder */}
                    <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
                      <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
                      <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredDebts.length / 10) || 1}</span>
                      <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
                    </div>
                  </div>
                </>
            )
        ) : ( /* Receivables Tab Content */
            filteredReceivables.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
                    <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Ma jiraan lacago la sugayo</h3>
                    <p className="text-sm">Haddii aad rabto inaad diiwaan geliso lacag la sugayo, fadlan dhagsii badhanka "Diiwaan Geli Deyn Cusub"</p>
                </div>
            ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block lg:hidden space-y-3">
                    {filteredReceivables.map(receivable => (
                      <MobileReceivableCard key={receivable.id} receivable={receivable} onRecordReceipt={handleRecordReceipt} onSendReminder={handleSendReminder} onViewDetails={handleViewDetails} />
                    ))}
                  </div>
                  
                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md animate-fade-in">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                      <thead className="bg-lightGray dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[18%]">Macmiilka, Xogta & Shirkadda</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[15%]">Mashruuca & Xaaladda</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">Qiimaha Guud</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">La Helay</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">Hadhay</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[12%]">Taariikhda & Shuruudaha</th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[10%]">Xaaladda</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider w-[15%]">Ficillo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {filteredReceivables.map(receivable => (
                          <ReceivableRow key={receivable.id} receivable={receivable} onRecordReceipt={handleRecordReceipt} onSendReminder={handleSendReminder} onViewDetails={handleViewDetails} />
                        ))}
                      </tbody>
                    </table>
                    {/* Pagination Placeholder */}
                    <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
                      <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
                      <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredReceivables.length / 10) || 1}</span>
                      <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
                    </div>
                  </div>
                </>
            )
        )}
            </div>
        );

      {/* Modals */}
      <DebtRepaymentModal
        isOpen={debtRepaymentModal.isOpen}
        onClose={() => setDebtRepaymentModal({ isOpen: false, debt: null })}
        debt={debtRepaymentModal.debt}
        onRecordPayment={handleDebtPayment}
      />

      <ReceivablePaymentModal
        isOpen={receivablePaymentModal.isOpen}
        onClose={() => setReceivablePaymentModal({ isOpen: false, receivable: null })}
        receivable={receivablePaymentModal.receivable}
        onRecordReceipt={handleReceivablePayment}
      />

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
      </div>
    </Layout>
  );
}
