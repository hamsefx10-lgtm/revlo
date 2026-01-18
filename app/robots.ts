import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',       // Hide API routes
                '/admin/',     // Hide Admin panel
                '/shop/',      // Hide specific user shops from global index (optional, keeps index clean)
                '/manufacturing/',
                '/accounting/',
            ],
        },
        sitemap: 'https://revlo.me/sitemap.xml', // Actual domain
    };
}
