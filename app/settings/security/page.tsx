// app/settings/security/page.tsx - Security Settings Page (10000% Design)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Key, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info, 
  Lock, ShieldCheck, Fingerprint, RefreshCw, Eye, EyeOff, CheckCircle, XCircle,
  Clock, Mail, Smartphone, Bell, AlertTriangle, User as UserIcon, Activity, ArrowRight // General icons
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Dummy Data ---
const dummySecuritySettings = {
  twoFactorEnabled: true,
  lastPasswordChange: '2025-06-15',
  activeSessions: [
    { id: 'sess001', device: 'Desktop (Chrome)', location: 'Hargeisa', ipAddress: '192.168.1.100', loginTime: '2025-07-24T10:00:00Z', current: true },
    { id: 'sess002', device: 'Mobile (Android)', location: 'Berbera', ipAddress: '10.0.0.5', loginTime: '2025-07-23T18:00:00Z', current: false },
  ],
  recentLoginAttempts: [
    { id: 'log001', date: '2025-07-24T10:00:00Z', ipAddress: '192.168.1.100', status: 'Successful', user: 'Axmed Cali' },
    { id: 'log002', date: '2025-07-24T09:55:00Z', ipAddress: '192.168.1.101', status: 'Failed (Wrong Password)', user: 'Unknown' },
    { id: 'log003', date: '2025-07-23T18:00:00Z', ipAddress: '10.0.0.5', status: 'Successful', user: 'Axmed Cali' },
  ]
};

// --- Active Session Row Component ---
const ActiveSessionRow: React.FC<{ session: typeof dummySecuritySettings.activeSessions[0]; onRevoke: (id: string) => void }> = ({ session, onRevoke }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <Smartphone size={18} className="text-primary"/> <span>{session.device}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{session.location}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{session.ipAddress}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{new Date(session.loginTime).toLocaleString()}</td>
    <td className="p-4 whitespace-nowrap text-center">
        {session.current ? (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">Hadda</span>
        ) : (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-mediumGray/10 text-mediumGray">Hore</span>
        )}
    </td>
    <td className="p-4 whitespace-nowrap text-right">
      {!session.current && (
        <button onClick={() => onRevoke(session.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Revoke Session">
          <XCircle size={18} />
        </button>
      )}
    </td>
  </tr>
);

// --- Login Attempt Row Component ---
const LoginAttemptRow: React.FC<{ attempt: typeof dummySecuritySettings.recentLoginAttempts[0] }> = ({ attempt }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100">{new Date(attempt.date).toLocaleString()}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{attempt.ipAddress}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{attempt.user}</td>
    <td className="p-4 whitespace-nowrap text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            attempt.status === 'Successful' ? 'bg-secondary/10 text-secondary' : 'bg-redError/10 text-redError'
        }`}>
            {attempt.status}
        </span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 truncate max-w-xs">{attempt.status === 'Failed (Wrong Password)' ? 'Password qaldan' : 'N/A'}</td>
  </tr>
);


// Main Security Settings Page Component
export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState(dummySecuritySettings);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


  const handlePasswordChange = async () => {
    const errors: { [key: string]: string } = {};
    if (!currentPassword) errors.currentPassword = 'Password-ka hadda waa waajib.';
    if (!newPassword || newPassword.length < 6) errors.newPassword = 'Password-ka cusub waa inuu ugu yaraan 6 xaraf ka koobnaadaa.';
    if (newPassword !== confirmNewPassword) errors.confirmNewPassword = 'Password-ku isku mid maaha.';
    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToastMessage({ message: 'Fadlan sax khaladaadka password-ka.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      console.log("Changing password...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      setToastMessage({ message: 'Password-ka si guul leh ayaa loo beddelay!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSettings(prev => ({ ...prev, lastPasswordChange: new Date().toISOString().split('T')[0] }));
    } catch (error: any) {
      setToastMessage({ message: 'Cilad ayaa dhacday marka password-ka la beddelayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    setLoading(true);
    try {
      console.log("Toggling 2FA...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
      setToastMessage({ message: `2-Factor Authentication waa la ${settings.twoFactorEnabled ? 'damiyay' : 'furay'}!`, type: 'success' });
    } catch (error: any) {
      setToastMessage({ message: 'Cilad ayaa dhacday marka 2FA la beddelayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = (id: string) => {
    if (window.confirm('Ma hubtaa inaad joojiso session-kan?')) {
      setSettings(prev => ({ ...prev, activeSessions: prev.activeSessions.filter(sess => sess.id !== id) }));
      setToastMessage({ message: 'Session-ka waa la joojiyay!', type: 'success' });
    }
  };

  const handleRunSecurityAudit = () => {
    setToastMessage({ message: 'Audit-ka amniga waa la bilaabay! Warbixin ayaa laguu soo diri doonaa.', type: 'info' });
  };


  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Security
        </h1>
        <button onClick={handleRunSecurityAudit} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
          <ShieldCheck size={20} className="mr-2" /> Samee Audit Amni
        </button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">2-Factor Authentication</h4>
          <p className={`text-3xl font-extrabold ${settings.twoFactorEnabled ? 'text-secondary' : 'text-redError'}`}>
            {settings.twoFactorEnabled ? 'Furay' : 'Damiyay'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Last Password Change</h4>
          <p className="text-3xl font-extrabold text-primary">{new Date(settings.lastPasswordChange).toLocaleDateString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Active Sessions</h4>
          <p className="text-3xl font-extrabold text-accent">{settings.activeSessions.filter(s => s.current).length}</p>
        </div>
      </div>

      {/* Password & Authentication Settings */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
          <Lock size={28} className="text-primary"/> <span>Password & Authentication</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Password */}
          <div className="space-y-4 p-4 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700">
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">Beddel Password-kaaga</h4>
            <div>
              <label htmlFor="currentPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Password-ka Hadda <span className="text-redError">*</span></label>
              <div className="relative">
                <input type={showCurrentPassword ? 'text' : 'password'} id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="********" className={`w-full p-3 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${passwordErrors.currentPassword ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100"><Eye size={20}/></button>
              </div>
              {passwordErrors.currentPassword && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{passwordErrors.currentPassword}</p>}
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Password Cusub <span className="text-redError">*</span></label>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="********" className={`w-full p-3 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${passwordErrors.newPassword ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100"><Eye size={20}/></button>
              </div>
              {passwordErrors.newPassword && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{passwordErrors.newPassword}</p>}
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Xaqiiji Password Cusub <span className="text-redError">*</span></label>
              <div className="relative">
                <input type={showConfirmNewPassword ? 'text' : 'password'} id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="********" className={`w-full p-3 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-primary ${passwordErrors.confirmNewPassword ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
                <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100"><Eye size={20}/></button>
              </div>
              {passwordErrors.confirmNewPassword && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{passwordErrors.confirmNewPassword}</p>}
            </div>
            <button onClick={handlePasswordChange} className="bg-secondary text-white py-2 px-4 rounded-lg font-bold hover:bg-green-600 transition duration-200 shadow-md flex items-center" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Key size={20} className="mr-2"/>} Beddel Password
            </button>
          </div>

          {/* 2-Factor Authentication */}
          <div className="space-y-4 p-4 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700">
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-2">2-Factor Authentication (2FA)</h4>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-4">
              Ku dar lakab amni oo dheeraad ah akoonkaaga. Marka la furo, waxaad u baahan doontaa code ka taleefankaaga si aad u soo gasho.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-darkGray dark:text-gray-100 font-medium">Xaaladda Hadda:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${settings.twoFactorEnabled ? 'bg-secondary/10 text-secondary' : 'bg-redError/10 text-redError'}`}>
                {settings.twoFactorEnabled ? 'Furay' : 'Damiyay'}
              </span>
            </div>
            <button onClick={handleToggle2FA} className={`w-full py-2 px-4 rounded-lg font-bold transition duration-200 shadow-md flex items-center justify-center ${settings.twoFactorEnabled ? 'bg-redError text-white hover:bg-red-700' : 'bg-primary text-white hover:bg-blue-700'}`} disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : (settings.twoFactorEnabled ? <Fingerprint size={20} className="mr-2"/> : <Fingerprint size={20} className="mr-2"/>)} {settings.twoFactorEnabled ? 'Dami 2FA' : 'Fur 2FA'}
            </button>
            <p className="text-xs text-mediumGray dark:text-gray-500 mt-2">
                <Info size={14} className="inline mr-1"/> Waxaa lagula talinayaa inaad furto 2FA si aad u ilaaliso akoonkaaga.
            </p>
          </div>
        </div>
      </div>

      {/* Active Sessions & Login Activity */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
          <Activity size={28} className="text-accent"/> <span>Dhaqdhaqaaqa Account-ka</span>
        </h3>
        {/* Active Sessions Table */}
        <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Sessions-ka Firfircoon</h4>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Device</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Location</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Login Time</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Xaaladda</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {settings.activeSessions.length > 0 ? (
                settings.activeSessions.map(session => (
                  <ActiveSessionRow key={session.id} session={session} onRevoke={handleRevokeSession} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan sessions firfircoon.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Login Attempts Table */}
        <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Diiwaanka Isku Dayga Soo Gelitaanka</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda & Waqtiga</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">User</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Xaaladda</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Fiiro Gaar Ah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {settings.recentLoginAttempts.length > 0 ? (
                settings.recentLoginAttempts.map(attempt => (
                  <LoginAttemptRow key={attempt.id} attempt={attempt} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan isku dayo soo gelitaan ah.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Security & Recovery Options */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center space-x-3">
          <ShieldCheck size={28} className="text-secondary"/> <span>Amniga Xogta & Soo Celinta</span>
        </h3>
        <div className="space-y-4 text-mediumGray dark:text-gray-400">
          <p className="flex items-center space-x-2">
            <CheckCircle size={20} className="text-secondary"/> <span>Xogtaada waa la siray (Encrypted) marka la kaydinayo iyo marka la wareejinayo.</span>
          </p>
          <p className="flex items-center space-x-2">
            <CheckCircle size={20} className="text-secondary"/> <span>Backup-yo otomaatig ah ayaa si joogto ah loo sameeyaa.</span>
          </p>
          <div className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
            <span className="font-medium text-darkGray dark:text-gray-100">Diiwaanka Audit-ka oo Buuxa:</span>
            <Link href="/settings/audit-log" className="text-primary hover:underline flex items-center space-x-1">
              <span>Fiiri Dhaqdhaqaaqa Dhammaan Users-ka</span> <ArrowRight size={16}/>
            </Link>
          </div>
          <div className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
            <span className="font-medium text-darkGray dark:text-gray-100">Xulashada Soo Celinta Account-ka:</span>
            <button className="text-primary hover:underline flex items-center space-x-1">
              <span>Bilaaw Soo Celinta Account</span> <ArrowRight size={16}/>
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg border border-lightGray dark:border-gray-600">
            <span className="font-medium text-darkGray dark:text-gray-100">Xiriirka Degdegga ah:</span>
            <button className="text-primary hover:underline flex items-center space-x-1">
              <span>Deji Xiriir Degdeg ah</span> <ArrowRight size={16}/>
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
