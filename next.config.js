/** @type {import('next').NextConfig} */

const nextConfig = {
    // Disable Vercel Analytics in development to reduce console noise
    experimental: {
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
        // Optimize resource loading
        optimizePackageImports: ['framer-motion', 'react-icons'],
    },

    // Image optimization configuration
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
            },
        ],
    },

    // Reduce preload warnings by optimizing webpack
    webpack: (config, { dev, isServer }) => {


        // Server-side specific overrides
        if (isServer) {
            config.externals.push('whatsapp-web.js');
            config.externals.push('puppeteer');
        }
        // Reduce aggressive preloading in development
        config.optimization = {
            ...config.optimization,
            splitChunks: {
                chunks: 'async',
                cacheGroups: {
                    default: false,
                },
            },
        };
        return config;
    },
    output: 'standalone',
};

module.exports = nextConfig;
