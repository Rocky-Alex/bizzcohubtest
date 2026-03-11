import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/bch/', '/cart/', '/checkout/', '/profile/'],
        },
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bizzcohub.com'}/sitemap.xml`,
    };
}
