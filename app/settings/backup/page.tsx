// app/settings/backup/page.tsx - Backup & Restore Settings Page (10000% Design)
'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Database, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info, 
  UploadCloud, Download, FileText, CheckCircle, XCircle, Calendar, RefreshCw, Save 
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Dummy Data ---
const dummyBackupHistory = [
  { id: 'bak001', date: '2025-07-23', type: 'Manual', format: 'JSON', status: 'Success', size: '1.2MB' },
  { id: 'bak002', date: '2025-07-20', type: 'Auto', format: 'CSV', status: 'Success', size: '0.8MB' },
  { id: 'bak003', date: '2025-07-15', type: 'Manual', format: 'JSON', status: 'Failed', size: '0.0MB' },
];

// --- Backup History Table Row Component ---
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
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Download Backup">
          <Download size={18} />
        </button>
        <button className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Backup Record">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
);


// Main Backup & Restore Page Component
export default function BackupRestoreSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async (format: 'json' | 'csv') => {
    setLoading(true);
    setToastMessage(null);
    try {
      // Simulate data fetching from backend
      const dummyData = [
        { id: 'proj001', name: 'Furniture Project A', amount: 15000, status: 'Active' },
        { id: 'exp001', description: 'Wood purchase', amount: 3000, category: 'Material' },
      ]; // Example data to export

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(dummyData, null, 2);
        filename = 'revlo_backup.json';
        mimeType = 'application/json';
      } else {
        const headers = Object.keys(dummyData[0] || {}).join(',');
        const rows = dummyData.map(row => Object.values(row).join(',')).join('\n');
        content = headers + '\n' + rows;
        filename = 'revlo_backup.csv';
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToastMessage({ message: `Xogta si guul leh ayaa loo dhoofiyay ${format.toUpperCase()}!`, type: 'success' });
    } catch (error: any) {
      console.error("Export failed:", error);
      setToastMessage({ message: `Cilad ayaa dhacday marka la dhoofinayay xogta: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setLoading(true);
      setToastMessage(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          // Simulate parsing and importing data
          console.log("Importing data:", text.substring(0, 100) + "..."); // Log first 100 chars
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

          setToastMessage({ message: 'Xogta si guul leh ayaa loo soo celiyay!', type: 'success' });
          // In a real app, you'd send this data to your backend API for processing
        } catch (parseError: any) {
          setToastMessage({ message: 'Cilad ayaa dhacday marka faylka la baarayay: ' + parseError.message, type: 'error' });
        } finally {
          setLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear file input
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRunAutoBackup = () => {
    setToastMessage({ message: 'Backup-ka otomaatiga ah waa la bilaabay!', type: 'success' });
    // Simulate API call to trigger auto backup
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Backup & Restore
        </h1>
        <button onClick={() => handleRunAutoBackup()} className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center">
          <RefreshCw size={20} className="mr-2" /> Bilaw Auto-Backup
        </button>
      </div>

      {/* Manual Backup Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-3">
          <Download size={28} className="text-primary"/> <span>Dhoofinta Xogta (Manual Backup)</span>
        </h3>
        <p className="text-mediumGray dark:text-gray-400 mb-6">
          Xogtaada si degdeg ah ugu dhoofi kombiyuutarkaaga. Waxaad dooran kartaa qaabka JSON ama CSV.
        </p>
        <div className="flex space-x-4">
          <button onClick={() => handleExportData('json')} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <FileText size={20} className="mr-2"/>} Dhoofi JSON
          </button>
          <button onClick={() => handleExportData('csv')} className="bg-accent text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <FileText size={20} className="mr-2"/>} Dhoofi CSV
          </button>
        </div>
      </div>

      {/* Manual Restore Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-3">
          <UploadCloud size={28} className="text-secondary"/> <span>Soo Celinta Xogta (Manual Restore)</span>
        </h3>
        <p className="text-mediumGray dark:text-gray-400 mb-6">
          Soo celi xogtaada adigoo soo shubaya fayl backup ah (JSON ama CSV). Fadlan taxaddar, tani waxay beddeli kartaa xogta hadda jirta.
        </p>
        <input 
          type="file" 
          accept=".json,.csv" 
          onChange={handleImportFileChange} 
          ref={fileInputRef}
          className="hidden"
          id="restore-file-upload"
        />
        <label htmlFor="restore-file-upload" className="inline-flex items-center px-6 py-3 border border-primary text-base font-medium rounded-full text-primary bg-white hover:bg-lightGray dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-200">
          {loading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <UploadCloud size={20} className="mr-2" />} Dooro Faylka Soo Celinta
        </label>
      </div>

      {/* Automated Backup Settings */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md mb-8 animate-fade-in-up">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4 flex items-center space-x-3">
          <Database size={28} className="text-accent"/> <span>Dejinta Auto-Backup</span>
        </h3>
        <p className="text-mediumGray dark:text-gray-400 mb-4">
          Habayso inta jeer ee xogtaada si otomaatig ah loo badbaadinayo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="backupFrequency" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Inta jeer ee Backup-ka</label>
                <select id="backupFrequency" className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none">
                    <option value="daily">Maalinle</option>
                    <option value="weekly">Toddobaadle</option>
                    <option value="monthly">Bil kasta</option>
                </select>
            </div>
            <div>
                <label htmlFor="backupRetention" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Inta Nuqul ee La Kaydinayo</label>
                <input type="number" id="backupRetention" defaultValue={7} min={1} className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary"/>
            </div>
        </div>
        <button className="mt-6 bg-secondary text-white py-2 px-4 rounded-lg font-bold hover:bg-green-600 transition duration-200 shadow-md flex items-center">
            <Save size={20} className="mr-2"/> Badbaadi Dejinta Auto-Backup
        </button>
      </div>

      {/* Backup History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b border-lightGray dark:border-gray-700">
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">Diiwaanka Backup-ka</h3>
          <button className="bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-100 py-2 px-4 rounded-lg font-semibold flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm">
            <RefreshCw size={18} className="mr-2"/> Cusboonaysii
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qaabka</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Xaaladda</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Size</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {dummyBackupHistory.length > 0 ? (
                dummyBackupHistory.map(backup => (
                  <BackupHistoryRow key={backup.id} backup={backup} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan diiwaan backup ah.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
