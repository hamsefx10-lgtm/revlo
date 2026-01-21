"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const startSetup = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/2fa/setup');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSecret(data.secret);

      // Generate QR Code Image URL
      const url = await QRCode.toDataURL(data.otpauth);
      setQrCodeUrl(url);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSetup = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success('2FA Enabled Successfully');
      setIsSetupComplete(true);
      setQrCodeUrl(''); // Clear sensitivity
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Security Settings</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-lg">
        <h2 className="text-xl font-semibold mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-500 mb-4">Secure your account with Google Authenticator.</p>

        {!qrCodeUrl && !isSetupComplete && (
          <button
            onClick={startSetup}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Setup 2FA'}
          </button>
        )}

        {qrCodeUrl && (
          <div className="space-y-4">
            <div className="border p-4 rounded bg-gray-50 flex justify-center">
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            <p className="text-sm text-gray-600">
              1. Open Google Authenticator<br />
              2. Scan this QR code<br />
              3. Enter the 6-digit code below
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                className="border p-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600"
                maxLength={6}
              />
              <button
                onClick={confirmSetup}
                disabled={isLoading || token.length !== 6}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {isSetupComplete && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mt-4">
            ✅ Two-Factor Authentication is currently active for your account.
          </div>
        )}
      </div>
    </div>
  );
}
