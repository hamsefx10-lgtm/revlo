import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Smartphone, Globe, Shield, Zap } from 'lucide-react';
import { notFound } from 'next/navigation';

// Allowed slugs to prevent 404s for arbitrary URLs
const VALID_SLUGS = [
    'erp-software',
    'pos-system',
    'accounting-software',
    'inventory-management',
    'manufacturing-erp',
    'project-management-software',
    'somali-business-software',
];

type Props = {
    params: { slug: string };
};

// Start Generation of Metadata based on the slug
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const title = params.slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
        title: `${title} - Revlo Business Solutions`,
        description: `Discover how Revlo's ${title} can transform your business. The best solution for Somali and global markets.`,
        alternates: {
            canonical: `https://revlo.me/solutions/${params.slug}`,
        },
    };
}

export default function SolutionPage({ params }: Props) {
    if (!VALID_SLUGS.includes(params.slug)) {
        notFound();
    }

    const title = params.slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-6 text-center">

                {/* Hero Section of Landing Page */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-full text-sm font-bold mb-6">
                        <Zap size={16} /> Solution for {title}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-darkGray dark:text-white mb-6">
                        The World's Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{title}</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
                        Revlo provides a complete, all-in-one platform designed to handle {title} with ease.
                        Perfect for businesses in Somalia and around the world.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/signup" className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-lg hover:shadow-primary/30">
                            Start Your Free Trial
                        </Link>
                        <Link href="/demo" className="bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all">
                            Watch Demo
                        </Link>
                    </div>
                </div>

                {/* Dynamic Content Features */}
                <div className="grid md:grid-cols-3 gap-8 text-left mb-20">
                    <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
                        <Globe className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-xl font-bold dark:text-white mb-2">Global Standard</h3>
                        <p className="text-gray-500 dark:text-gray-400">Trusted by businesses worldwide for {title}.</p>
                    </div>
                    <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
                        <Smartphone className="w-10 h-10 text-secondary mb-4" />
                        <h3 className="text-xl font-bold dark:text-white mb-2">Mobile Ready</h3>
                        <p className="text-gray-500 dark:text-gray-400">Manage your {title} from your phone, anywhere.</p>
                    </div>
                    <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl">
                        <Shield className="w-10 h-10 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold dark:text-white mb-2">Production Secure</h3>
                        <p className="text-gray-500 dark:text-gray-400">Your data is encrypted and safe with us.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
