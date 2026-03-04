'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Layout from '@/components/layouts/Layout';
import { QrCode, Smartphone, RefreshCw, LogOut, CheckCircle2, XCircle, Search, MessageSquare, Send } from 'lucide-react';

export default function WhatsAppSettingsPage() {
    const [status, setStatus] = useState<string>('DISCONNECTED');
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [testPhone, setTestPhone] = useState('');
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [testResult, setTestResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchSessionStatus = async () => {
        try {
            const response = await fetch('/api/settings/whatsapp');
            if (response.ok) {
                const data = await response.json();
                setStatus(data.status);
                setQrCodeDataUrl(data.qrCodeDataUrl);
                setPhoneNumber(data.phoneNumber);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessionStatus();

        // Poll for status automatically if not connected
        const interval = setInterval(() => {
            if (status !== 'CONNECTED') {
                fetchSessionStatus();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [status]);

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone) return;

        setIsSendingTest(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/settings/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: testPhone }),
            });

            const data = await response.json();
            if (response.ok) {
                setTestResult({ type: 'success', message: data.message });
            } else {
                setTestResult({ type: 'error', message: data.message });
            }
        } catch (error) {
            setTestResult({ type: 'error', message: 'Cilad ayaa dhacday marka farriinta la dirayay' });
        } finally {
            setIsSendingTest(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/settings/whatsapp', { method: 'DELETE' });
            if (response.ok) {
                alert('Waa laga baxay WhatsApp-ka');
                fetchSessionStatus();
            } else {
                alert('Ku fashilmay in laga baxo');
            }
        } catch (error) {
            alert('Cilad ayaa dhacday');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Ma hubtaa inaad rabto inaad dib u bilawdo xidhiidhka? Tani waxay tirtiri doontaa fadhiga hadda jira.')) return;

        setIsLoading(true);
        try {
            // First logout/delete
            await fetch('/api/settings/whatsapp', { method: 'DELETE' });
            // Then fetch again to trigger new initialization
            await fetchSessionStatus();
        } catch (error) {
            alert('Cilad ayaa dhacday dib u dejinta');
        } finally {
            setIsLoading(false);
        }
    };

    // Badge mapping
    const badgeColors: Record<string, string> = {
        CONNECTED: 'bg-green-100 text-green-800 border-green-200',
        CONNECTING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        DISCONNECTED: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
        <Layout>
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
                        Is-xirka WhatsApp (WhatsApp Integration)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Kudar nambarka WhatsApp ee shirkadda si xawilaadyaha (rasiidada) si toos ah loogu diro macaamiisha iyo shirkadaha aad alaabta ka iibsato.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border-t-4 border-t-blue-600 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Smartphone className="w-5 h-5 text-blue-600" />
                                    Xaaladda Isku-xirka (Connection Status)
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                                    Isticmaal boggan si aad ugu xirto WhatsApp-ka shirkadda.
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${badgeColors[status] || badgeColors.DISCONNECTED}`}>
                                {status === 'CONNECTED' ? 'WAXAAN KU XIRAN TAHAY' : status === 'CONNECTING' ? 'WAXAAN SUGAYNAA QR...' : 'GO\'AN'}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <RefreshCw className="w-12 h-12 text-gray-400 animate-spin" />
                                <p className="text-gray-500 font-medium">Fadlan sug inta aan hubinayno WhatsApp-ka...</p>
                            </div>
                        ) : status === 'CONNECTED' ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-inner">
                                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Si guul leh ayuu u xiran yahay!</h3>
                                    <p className="text-lg flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
                                        <Smartphone className="w-5 h-5" /> Nambarka: <span className="font-bold text-gray-900 dark:text-white">{phoneNumber?.split('@')[0]}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                        Hadda wixii ka dambeeya, marka aad bixiso kharash (Paid Expense) oo aad doorato Vendor, Revlo si toos ah ayuu ugu dirayaa fariinta WhatsApp nambar-kooda.
                                    </p>
                                </div>

                                {/* Test Connection Section */}
                                <div className="w-full max-w-md bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30 text-left">
                                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Tijaabi Isku-xirka (Test Connection)
                                    </h4>
                                    <form onSubmit={handleSendTest} className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nambarka tijaabada (tusaale: 09...)"
                                                value={testPhone}
                                                onChange={(e) => setTestPhone(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSendingTest || !testPhone}
                                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                {isSendingTest ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {testResult && (
                                            <div className={`text-xs p-2 rounded flex items-center gap-2 ${testResult.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {testResult.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {testResult.message}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-gray-400 italic">
                                            Fiiro gaar ah: Nambarka hadduu 0 ka bilaabo, Revlo wuxuu si toos ah ugu darayaa 251.
                                        </p>
                                    </form>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-100 dark:border-gray-700 w-full max-w-md mt-4">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Hagaajin</p>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg shadow-sm font-medium transition"
                                    >
                                        <LogOut className="w-4 h-4" /> Bixi WhatsApp-kan (Disconnect)
                                    </button>
                                </div>
                            </div>
                        ) : (status === 'CONNECTING' && qrCodeDataUrl) ? (
                            <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-6">
                                <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-200 shadow-sm relative group">
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                        <Search className="w-10 h-10 text-gray-700" />
                                    </div>
                                    <img src={qrCodeDataUrl} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                                </div>
                                <div className="space-y-6 max-w-sm text-left">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                                            <QrCode className="w-5 h-5" /> Sida loo Iskaan gareeyo:
                                        </h3>
                                        <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            <li>Fur WhatsApp taleefankaaga.</li>
                                            <li>Guji <span className="font-bold text-gray-900 dark:text-white">Settings</span> (geeska hoose).</li>
                                            <li>Dooro <span className="font-bold text-gray-900 dark:text-white">Linked Devices</span>.</li>
                                            <li>Guji badhanka buluugga ah ee <span className="font-bold text-blue-600 dark:text-blue-400">"Link a Device"</span>.</li>
                                            <li>Ku qabo kaamerada QR code-ka halkan ku yaalla!</li>
                                        </ol>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                        <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                                        <p>Waxaan sugeynaa inta aad ka iskaan garaynayso... si toos ah ayuu isku beddelayaa.</p>
                                    </div>
                                </div>
                            </div>
                        ) : status === 'CONNECTING' ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                <RefreshCw className="w-12 h-12 text-blue-400 animate-spin" />
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">QR Code-ka ayaa la diyaarinayaa...</h3>
                                    <p className="text-gray-500 max-w-sm">
                                        Fadlan sug dhowr ilbiriqsi, WhatsApp-ka ayaa bilaabanaya. Haddii ay tani muddo dheer kugu qaadato, isku day inaad dib u dejiso xidhiidhka.
                                    </p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                >
                                    Dib u deji (Reset Connection)
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <XCircle className="w-16 h-16 text-red-500 opacity-80" />
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Kuma xirna</h3>
                                <p className="text-gray-500 text-center max-w-sm">Dhibaato ayaa ka dhacday abuurista QR code-ka. Fadlan ku dhufo batoonka hoose si aad dib ugu daydo.</p>
                                <button
                                    onClick={fetchSessionStatus}
                                    className="mt-4 shadow-sm flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white transition"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" /> Isku-day Markale
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
