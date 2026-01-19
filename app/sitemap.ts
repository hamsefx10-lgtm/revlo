import { MetadataRoute } from 'next';

const BASE_URL = 'https://revlo.me'; // Your actual domain

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        '',
        '/download',
        '/login',
        '/signup',
        '/contact',
        '/demo',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // Add specialized landing page routes for high-ranking keywords (Virtual SEO Pages)
    // Even if these map to the homepage for now, listing them helps SEO structure.
    // In the future, you should build dedicated pages for these.
    const solutions = [
        'erp-software',
        'pos-system',
        'accounting-software',
        'inventory-management',
        'manufacturing-erp',
        'project-management-software',
        'somali-business-software', // Niche dominance
    ].map((slug) => ({
        url: `${BASE_URL}/solutions/${slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    return [...routes, ...solutions];
}
