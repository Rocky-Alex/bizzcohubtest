/** @type {import('next').NextConfig} */

const nextConfig = {
    // Enable React strict mode for better performance
    reactStrictMode: true,

    // Compress responses for faster loading
    compress: true,

    // Production optimizations
    productionBrowserSourceMaps: false, // Disable source maps in production for faster builds
    
    // Enable SWC minification (faster than Terser)
    swcMinify: true,

    // Power optimizations
    poweredByHeader: false, // Remove X-Powered-By header

    // Experimental features for performance
    experimental: {
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
        // Optimize resource loading - add more packages
        optimizePackageImports: [
            'framer-motion', 
            'lucide-react',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-icons',
            'date-fns'
        ],
        // Enable optimized CSS
        optimizeCss: true,
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
        // Enable modern image formats
        formats: ['image/avif', 'image/webp'],
        // Optimize image loading
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60, // Cache images for 60 seconds
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    // Headers for caching and security
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },

    // Optimize webpack configuration
    webpack: (config, { dev, isServer }) => {
        // Server-side specific overrides
        if (isServer) {
            config.externals.push('whatsapp-web.js');
            config.externals.push('puppeteer');
        }

        // Production optimizations
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
                runtimeChunk: 'single',
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
                        // Common chunk
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                            priority: 10,
                            reuseExistingChunk: true,
                            enforce: true,
                        },
                    },
                },
            };
        } else {
            // Development optimizations
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
