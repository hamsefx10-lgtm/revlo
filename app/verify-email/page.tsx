import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface VerifyEmailPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
    const token = searchParams.token;

    if (!token || typeof token !== 'string') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Token Invalid</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Link-gan ma shaqaynayo ama waa qaldan yahay.</p>
                    <Link href="/login" className="text-primary hover:underline font-medium">Ku noqo Login-ka</Link>
                </div>
            </div>
        );
    }

    // 1. Verify Token from Database
    const existingToken = await prisma.verificationToken.findUnique({
        where: { token },
    });

    if (!existingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Expired or Invalid Token</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Token-kan wuu dhacay ama horey ayaa loo isticmaalay.</p>
                    <Link href="/login" className="text-primary hover:underline font-medium">Ku noqo Login-ka</Link>
                </div>
            </div>
        );
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
                    <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Token Expired</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Waqtigii wuu ka dhacay link-gan. Fadlan isku day inaad mar kale code soo dalbato.</p>
                    <Link href="/login" className="text-primary hover:underline font-medium">Login & Resend</Link>
                </div>
            </div>
        );
    }

    // 2. Update User Verification Status
    const user = await prisma.user.findUnique({
        where: { email: existingToken.identifier },
    });

    if (!user) {
        return <div>User not found</div>;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: new Date(),
        },
    });

    // 3. Delete Token (One-time use)
    await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: existingToken.identifier, token } },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Guul!</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    Email-kaaga si guul leh ayaa loo xaqiijiyay (`Verified`). Hadda waad gali kartaa akoonkaaga.
                </p>

                <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full py-3.5 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                    Gasho Akoonka (Login) <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
