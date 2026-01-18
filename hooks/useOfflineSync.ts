'use client';

import { useEffect, useState } from 'react';
import { OfflineQueue } from '@/lib/offline-queue';
import { toast } from 'sonner';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Internet Restored - Syncing data...');
            OfflineQueue.sync().then(() => {
                toast.success('All offline data synced successfully!');
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('You are offline. Changes will be saved locally.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
