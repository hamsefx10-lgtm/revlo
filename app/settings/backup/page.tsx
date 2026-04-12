// app/settings/backup/page.tsx - Backup & Restore Settings Page (10000% Design)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { 
  ArrowLeft, Database, Download, FileText, UploadCloud, Loader2, Save, CloudLightning,
  ShieldCheck, Unlock, Lock
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import { useSession } from 'next-auth/react';

// --- Dummy Data ---
const dummyBackupHistory = [
  { id: 'bak001', date: new Date().toISOString(), type: 'Auto Cloud', format: 'JSON.GZ', status: 'Success', size: '2.5MB' },
];

const BackupHistoryRow: React.FC<{ backup: typeof dummyBackupHistory[0] }> = ({ backup }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium">{new Date(backup.date).toLocaleDateString()}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{backup.type}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{backup.format}</td>
    <td className="p-4 whitespace-nowrap">
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        backup.status === 'Success' ? 'bg-secondary/10 text-secondary' : 'bg-redError/10 text-redError'
      }`}>
        {backup.status}
      </span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{backup.size}</td>
    <td className="p-4 whitespace-nowrap text-right"></td>
  </tr>
);

export default function BackupRestoreSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isCloudBackupRunning, setIsCloudBackupRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  
  const [backupEmail, setBackupEmail] = useState('');
  const [driveFolderId, setDriveFolderId] = useState('');
  const [googleClientEmail, setGoogleClientEmail] = useState('');
  const [googlePrivateKey, setGooglePrivateKey] = useState('');

  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(true);

  // Load existing configuration
  useEffect(() => {
    const fetchConfig = async () => {
      const companyId = (session?.user as any)?.companyId || 'UNKNOWN';
      try {
        const res = await fetch(`/api/settings/backup-email?companyId=${companyId}`);
        const data = await res.json();
        if (data.success && data.features) {
          setBackupEmail(data.features.backupEmail || '');
          setDriveFolderId(data.features.driveFolderId || '');
          setGoogleClientEmail(data.features.googleClientEmail || '');
          setGooglePrivateKey(data.features.googlePrivateKey || '');
          
          if (data.features.backupEmail || data.features.driveFolderId || data.features.googleClientEmail) {
             setHasExistingConfig(true);
             setIsEditingConfig(false); // Hide the forms and show the masked card
          }
        }
      } catch (err) {
        console.error('Failed to fetch backup config', err);
      }
    };
    if (session) fetchConfig();
  }, [session]);

  const handleSaveBackupEmail = async () => {
    if (!backupEmail || !backupEmail.includes('@')) {
       setToastMessage({ message: 'Fadlan geli email sax ah.', type: 'error' });
       return;
    }
    
    setIsSavingEmail(true);
    try {
      const res = await fetch('/api/settings/backup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: backupEmail, 
          companyId: (session?.user as any)?.companyId || 'UNKNOWN',
          driveFolderId,
          googleClientEmail,
          googlePrivateKey
        })
      });
      const data = await res.json();
      if(data.success) {
        setToastMessage({ message: 'Dejinta si guul leh ayaa loo keydiyay!', type: 'success' });
        setHasExistingConfig(true);
        setIsEditingConfig(false); // Lock it up again after saving
      } else {
        throw new Error(data.error);
      }
    } catch(err: any) {
      setToastMessage({ message: err.message || 'Hawsashadu way fashilantay', type: 'error' });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setToastMessage({ message: `Xogta shaqeysa waa la xakameeyay. U isticmaal Cloud Backup dhoofin dhamaystiran!`, type: 'success' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunCloudAutoBackup = async () => {
    setIsCloudBackupRunning(true);
    setToastMessage(null);
    setDriveLink(null); // Reset before running
    try {
      const res = await fetch('/api/admin/auto-backup');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Cilad dhanka Server-ka ah');
      
      setToastMessage({ message: '🎉 Cloud Backup si degdeg ah ayuu u dhammeeyay. Iimaylkaaga/Drive-ka hubi!', type: 'success' });
      if (data.driveLink) {
         setDriveLink(data.driveLink);
      }
    } catch (err: any) {
      setToastMessage({ message: err.message, type: 'error' });
    } finally {
      setIsCloudBackupRunning(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          System Backup 2.0
        </h1>
        <button 
           onClick={handleRunCloudAutoBackup} 
           disabled={isCloudBackupRunning}
           className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-xl border border-secondary/50 flex items-center disabled:opacity-50 hover:shadow-secondary/30">
          {isCloudBackupRunning ? <Loader2 size={20} className="mr-2 animate-spin" /> : <CloudLightning size={20} className="mr-2" />} 
          Run Cloud Backup Now
        </button>
      </div>

      {/* Cloud Automated Backup Settings */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl shadow-lg mb-8 animate-fade-in-up border border-primary/20 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

        <h3 className="text-2xl font-bold text-primary dark:text-primary mb-4 flex items-center space-x-3">
          <Database size={28} className="text-primary"/> <span>Xarunta Cloud Auto-Backup (Google Drive & Email)</span>
        </h3>
        <p className="text-darkGray dark:text-gray-300 font-medium mb-8 text-lg">
          Ku xidh Google Drive Server-kaaga haddii aad rabto in faylashu ay Toos ugu shubmaan Cloud-kaag, Email-kana kaliya lagaagula socodsiiyo "Link"-ga Download-ka.
        </p>

        {driveLink && (
           <div className="mb-6 p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex flex-col md:flex-row items-center justify-between shadow-sm animate-fade-in">
               <div className="flex items-center space-x-3 mb-4 md:mb-0">
                  <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
                     <CloudLightning className="text-green-600 dark:text-green-300" size={24} />
                  </div>
                  <div>
                     <h4 className="font-bold text-green-800 dark:text-green-200 text-lg">Faylkii Si Guul Leh Ayuu Ku Tagay Drive!</h4>
                     <p className="text-sm text-green-700 dark:text-green-400">Waxaad si toos ah uga furi kartaa shabakada Google Cloud.</p>
                  </div>
               </div>
               <a href={driveLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow flex items-center justify-center">
                   ☁️ Toos Uga Fur Google Drive
               </a>
           </div>
        )}

        {/* LOCKED STATE / VIEW MODE */}
        {!isEditingConfig ? (
             <div className="bg-white dark:bg-gray-900 shadow rounded-xl border border-lightGray dark:border-gray-700 relative z-10 transition-all duration-300">
                <div className="flex justify-between items-center p-6 border-b border-lightGray dark:border-gray-700">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center text-lg">
                        <ShieldCheck className="text-secondary mr-3" size={24} /> Xogtu waa Asturan Tahay (Secure)
                    </h4>
                    <button 
                        onClick={() => setIsEditingConfig(true)}
                        className="text-primary hover:text-blue-700 bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center transition-colors">
                        <Unlock size={18} className="mr-2" /> Fur si aad u beddesho
                    </button>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-mediumGray dark:text-gray-400 font-bold mb-2 uppercase tracking-wider">Email-ka Alerts-ka</p>
                        <p className="text-darkGray dark:text-gray-200 font-mono bg-lightGray/50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-transparent shadow-inner">{backupEmail || 'Lama shubin'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-mediumGray dark:text-gray-400 font-bold mb-2 uppercase tracking-wider">Google Drive Folder ID</p>
                        <div className="bg-lightGray/50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-transparent shadow-inner flex items-center select-none">
                            <Lock size={16} className="text-red-400 mr-3" />
                            <p className="text-darkGray dark:text-gray-200 font-mono blur-[3px] opacity-70">
                                {driveFolderId ? '1ARNgjdnzI-dP3i3f0aOD6ha8xXyZ' : 'Lama shubin'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-mediumGray dark:text-gray-400 font-bold mb-2 uppercase tracking-wider">Service Account Email</p>
                        <div className="bg-lightGray/50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-transparent shadow-inner flex items-center select-none">
                            <Lock size={16} className="text-red-400 mr-3" />
                            <p className="text-darkGray dark:text-gray-200 font-mono blur-[2px] opacity-70">
                                {googleClientEmail ? 'revlo-backup@revlo-erp.iam.gserviceaccount.com' : 'Lama shubin'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-mediumGray dark:text-gray-400 font-bold mb-2 uppercase tracking-wider">Google Private Key</p>
                        <div className="bg-lightGray/50 dark:bg-gray-800 px-4 py-3 rounded-lg border border-transparent shadow-inner flex items-center select-none">
                            <Lock size={16} className="text-red-400 mr-3" />
                            <p className="text-darkGray dark:text-gray-200 font-mono blur-[4px] opacity-70 overflow-hidden text-ellipsis whitespace-nowrap">
                                {googlePrivateKey ? '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASC...' : 'Lama shubin'}
                            </p>
                        </div>
                    </div>
                </div>
             </div>
        ) : (
        /* EDITING MODE */
        <div className="bg-white/80 dark:bg-gray-900/80 p-8 rounded-xl border border-primary/20 relative z-10 backdrop-blur-md shadow-lg transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                  <label className="block text-md font-bold text-darkGray dark:text-gray-200 mb-2">1. Email-ka Qofka Gaarka Ah (Backup Alerts):</label>
                  <input 
                     type="email" 
                     placeholder="macalin@shirkada.com"
                     value={backupEmail}
                     onChange={(e) => setBackupEmail(e.target.value)}
                     className="w-full p-4 border border-lightGray dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary shadow-inner"
                  />
              </div>
              
              <div className="md:col-span-2">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 border-b border-lightGray dark:border-gray-600 pb-2 mt-4 text-lg">2. Dejinta Google Drive (Ikhtiyaari / Optional)</h4>
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Google Drive Folder ID:</label>
                  <input 
                     type="text" 
                     placeholder="Tusaale: 1A2b3C4d5E6f7G8h..."
                     value={driveFolderId}
                     onChange={(e) => setDriveFolderId(e.target.value)}
                     className="w-full p-4 border border-lightGray dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary shadow-inner font-mono text-sm"
                  />
              </div>
              
              <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Google Service Account Client Email:</label>
                  <input 
                     type="text" 
                     placeholder="tusaale@gserviceaccount.com"
                     value={googleClientEmail}
                     onChange={(e) => setGoogleClientEmail(e.target.value)}
                     className="w-full p-4 border border-lightGray dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary shadow-inner font-mono text-sm"
                  />
              </div>
              
              <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Google Private Key (Ama File-kii JSON oo dhan):</label>
                  <textarea 
                     rows={5}
                     placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgk...\n-----END PRIVATE KEY-----"
                     value={googlePrivateKey}
                     onChange={(e) => setGooglePrivateKey(e.target.value)}
                     className="w-full p-4 border border-lightGray dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs font-mono focus:ring-2 focus:ring-primary shadow-inner"
                  />
                  <p className="text-xs text-mediumGray dark:text-gray-500 mt-2 italic font-medium">✨ Waxaad xurtahay inaad soo dhex tuurto JSON feylka oo idil, Serverkeenaa iska soocanaya furaha!</p>
              </div>
          </div>
          
          <div className="flex justify-end mt-4 items-center space-x-4">
             {hasExistingConfig && (
                <button 
                onClick={() => setIsEditingConfig(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 font-semibold px-4 py-2 transition-colors">
                 Cansal / Kansal
                </button>
             )}
             <button 
               onClick={handleSaveBackupEmail}
               disabled={isSavingEmail}
               className="bg-primary text-white py-3.5 px-8 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-primary/30 flex items-center justify-center disabled:opacity-50 transition duration-300">
                {isSavingEmail ? <Loader2 size={24} className="mr-2 animate-spin" /> : <Save size={24} className="mr-2"/>} 
                Xaqiiji & Keydi Isbedelada
             </button>
          </div>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700 animate-fade-in-up">
          <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-3">
            <Download size={24} className="text-primary"/> <span>Dhoofinta Xogta Xadidan</span>
          </h3>
          <p className="text-mediumGray dark:text-gray-400 mb-6 font-medium">
            Tani kaliya waxay dhoofinaysaa shaxda hor taada. Xogta oo buuxda isticmaal (Cloud Backup).
          </p>
          <div className="flex space-x-4">
            <button onClick={() => handleExportData('json')} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-200 py-3 px-5 rounded-xl font-bold hover:bg-gray-200 transition duration-200 shadow-sm flex items-center" disabled={loading}>
              <FileText size={18} className="mr-2"/> Dhoofi JSON
            </button>
            <button onClick={() => handleExportData('csv')} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-200 py-3 px-5 rounded-xl font-bold hover:bg-gray-200 transition duration-200 shadow-sm flex items-center" disabled={loading}>
              <FileText size={18} className="mr-2"/> Dhoofi CSV
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700 animate-fade-in-up">
          <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-3">
            <UploadCloud size={24} className="text-secondary"/> <span>Soo Celinta Xogta (Manual Restore)</span>
          </h3>
          <p className="text-mediumGray dark:text-gray-400 mb-6 font-medium">
            Amniga xogta aawadeed, wixii la xiriira Database dhisid dib loo shubayo waxaa toos u qabanaya Qalabka Restore Script ee Serverka.
          </p>
          <button disabled className="bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 py-3 px-8 rounded-xl font-bold cursor-not-allowed border border-dashed border-gray-300 dark:border-gray-600">
             Upload Disabled
          </button>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
