import React from 'react';
import ShopSidebar from '@/components/shop/ShopSidebar';
import ShopHeader from '@/components/shop/ShopHeader';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-[#0b1120] font-sans selection:bg-[#3498DB]/30 selection:text-[#3498DB]">
            {/* Sidebar */}
            <ShopSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">

                {/* Background Blobs/Glows for Premium Feel */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#3498DB]/5 blur-[120px] dark:bg-[#3498DB]/10" />
                    <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#2ECC71]/5 blur-[120px] dark:bg-[#2ECC71]/10" />
                </div>

                {/* Header */}
                <ShopHeader />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <div className="w-full h-full p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
