// components/common/Toast.tsx
'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, Info as InfoIcon } from 'lucide-react'; // Added InfoIcon

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info'; // MUHIIM: Added 'info' type
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  let bgColor = '';
  let borderColor = '';
  let icon = null;

  switch (type) {
    case 'success':
      bgColor = 'bg-secondary';
      borderColor = 'border-secondary';
      icon = <CheckCircle size={24} />;
      break;
    case 'error':
      bgColor = 'bg-redError';
      borderColor = 'border-redError';
      icon = <XCircle size={24} />;
      break;
    case 'info': // New info style
      bgColor = 'bg-primary'; // Using primary color for info
      borderColor = 'border-primary';
      icon = <InfoIcon size={24} />;
      break;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in`}>
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm animate-fade-in-up flex items-center space-x-3 ${bgColor} border ${borderColor}`}>
        {icon}
        <span className="font-semibold">{message}</span>
        <button onClick={onClose} className="ml-auto text-white opacity-70 hover:opacity-100">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toast;