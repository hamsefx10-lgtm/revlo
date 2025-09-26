// app/forgot-password/page.tsx - Forgot Password Page (10000% Design)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, Lock, Loader2, Info, CheckCircle, XCircle, ArrowLeft, Send
} from 'lucide-react';
import Toast from '../../components/common/Toast'; // Reuse Toast component

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter New Password (simulated)

  const validateEmailForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email.trim()) newErrors.email = 'Email-ka waa waajib.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Fadlan geli email sax ah.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!newPassword || newPassword.length < 6) newErrors.newPassword = 'Password-ka cusub waa inuu ugu yaraan 6 xaraf ka koobnaadaa.';
    if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = 'Password-ka cusub iyo xaqiijinta password-ka isku mid maaha.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setToastMessage(null);

    if (!validateEmailForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan geli email sax ah.', type: 'error' });
      return;
    }

    try {
      // Simulate sending reset link (in a real app, this would trigger an email)
      // For this example, we directly move to step 2 after email submission
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      setToastMessage({ message: 'Haddii email-kaagu uu ku jiro nidaamkeena, waxaad heli doontaa email dib u dejinta password-ka.', type: 'info' });
      setStep(2); // Move to password entry step
    } catch (error: any) {
      console.error('Send Reset Link error:', error);
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setToastMessage(null);

    if (!validatePasswordForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka password-ka.', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, confirmNewPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage({ message: data.message || 'Password-kaaga si guul leh ayaa dib loogu dejiyay!', type: 'success' });
        router.push('/login'); // Redirect to login page
      } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka password-ka la dejinayay.', type: 'error' });
      }
    } catch (error: any) {
      console.error('Password Reset API error:', error);
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightGray dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-darkGray dark:text-gray-100 mb-2">Revl<span className="text-primary">o</span></h1>
          <p className="text-mediumGray dark:text-gray-400 text-lg">Password Dib U Dejin</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendResetLink} className="space-y-6 animate-fade-in">
            <p className="text-mediumGray dark:text-gray-400 text-sm text-center mb-4">
              Fadlan geli email-ka akoonkaaga. Waxaanu kuu soo diri doonaa email dib u dejinta password-ka.
            </p>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tusaale@ganacsi.com"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.email ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.email && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.email}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Send className="mr-2" size={20} />
              )}
              {loading ? 'Diraya Link-ga...' : 'Dir Link-ga Dib U Dejinta'}
            </button>

            {/* Back to Login */}
            <p className="text-center text-mediumGray dark:text-gray-400 text-sm mt-6">
              <Link href="/login" className="text-secondary font-semibold hover:underline flex items-center justify-center">
                <ArrowLeft size={18} className="mr-1"/> Ku Noqo Soo Galitaanka
              </Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handlePasswordReset} className="space-y-6 animate-fade-in">
            <p className="text-mediumGray dark:text-gray-400 text-sm text-center mb-4">
              Fadlan geli password-kaaga cusub.
            </p>
            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Password Cusub</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.newPassword ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.newPassword && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.newPassword}</p>}
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label htmlFor="confirmNewPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Xaqiiji Password Cusub</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="********"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.confirmNewPassword ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.confirmNewPassword && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.confirmNewPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Lock className="mr-2" size={20} />
              )}
              {loading ? 'Dejinaya Password...' : 'Deji Password'}
            </button>

            {/* Back to Login */}
            <p className="text-center text-mediumGray dark:text-gray-400 text-sm mt-6">
              <Link href="/login" className="text-secondary font-semibold hover:underline flex items-center justify-center">
                <ArrowLeft size={18} className="mr-1"/> Ku Noqo Soo Galitaanka
              </Link>
            </p>
          </form>
        )}
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
