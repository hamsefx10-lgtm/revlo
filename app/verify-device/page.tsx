"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function VerifyDevicePage() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.id) {
            toast.error('User not found. Please log in again.');
            return;
        }

        if (code.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/verify-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    code, // This is now the TOTP code
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            toast.success('Device verified successfully!');
            router.push('/dashboard/projects');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="space-y-1 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Authenticator Verification
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Please enter the 6-digit code from your Google Authenticator app.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            id="code"
                            placeholder="000 000"
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-center text-2xl tracking-widest  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-50 bg-white dark:bg-gray-950"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            disabled={isLoading}
                            autoFocus
                            autoComplete="one-time-code"
                        />
                    </div>

                    <button
                        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
                        type="submit"
                        disabled={isLoading || code.length !== 6}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                            </>
                        ) : (
                            'Verify Code'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
