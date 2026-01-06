import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/products';

// Resource tool pages for sitemap
const resourcePages = [
    'lcd-check',
    'keyboard-test',
    'trackpad-test',
    'battery-status',
    'sound-test',
    'camera-test',
    'connectivity-test',
    'specification',
    'touch-test',
    'bg-remover',
    'compressor',
    'enhancer',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizzcohub.com';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/services`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/resources`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // Resource tool pages
    const resourceToolPages: MetadataRoute.Sitemap = resourcePages.map((page) => ({
        url: `${baseUrl}/resources/${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    // Dynamic product pages
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const products = await getProducts();
        productPages = products.map((product: any) => ({
            url: `${baseUrl}/products/${product.type}/${product.id}`,
            lastModified: product.createdAt ? new Date(product.createdAt) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (error) {
        console.error('Error generating product sitemap:', error);
    }

    return [...staticPages, ...resourceToolPages, ...productPages];
}
