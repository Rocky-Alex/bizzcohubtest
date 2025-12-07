/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable Vercel Analytics in development to reduce console noise
    experimental: {
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
        ],
    },

    // Reduce preload warnings by optimizing webpack
    webpack: (config, { dev, isServer }) => {
        if (dev && !isServer) {
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
        }
        return config;
    },
};

module.exports = nextConfig;
