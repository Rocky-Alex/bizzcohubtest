/** @type {import('next').NextConfig} */

const nextConfig = {
    // Enable gzip/brotli compression
    compress: true,

    // Enable React strict mode for catching issues early
    reactStrictMode: true,

    experimental: {
        serverComponentsExternalPackages: [
            '@react-pdf/renderer',
            '@imgly/background-removal',
            'onnxruntime-node',
            'systeminformation'
        ],
        outputFileTracingIncludes: {
            '/resources/sound-test': ['./public/Audios/**/*'],
        },
        // Tree-shake large packages - only import what's used
        optimizePackageImports: [
            'framer-motion',
            'react-icons',
            'lucide-react',
            '@radix-ui/react-icons',
            '@radix-ui/react-dropdown-menu',
        ],
    },

    // Image optimization configuration
    images: {
        // Serve modern formats (webp/avif) automatically
        formats: ['image/avif', 'image/webp'],
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

    webpack: (config, { dev, isServer }) => {
        // Server-side specific overrides
        if (isServer) {
            config.externals.push('whatsapp-web.js');
            config.externals.push('puppeteer');
        }

        // Fix for systeminformation optional dependencies
        config.resolve.alias['osx-temperature-sensor'] = false;
        config.resolve.alias['macos-temperature-sensor'] = false;

        // Fix for onnxruntime-web / @imgly/background-removal import.meta errors
        config.module.rules.push({
            test: /\.m?js$/,
            type: "javascript/auto",
            resolve: {
                fullySpecified: false,
            },
        });

        // Production: proper chunk splitting for better caching
        if (!dev) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        framework: {
                            name: 'framework',
                            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
                            priority: 40,
                            enforce: true,
                        },
                        vendor: {
                            name: 'vendor',
                            test: /[\\/]node_modules[\\/]/,
                            priority: 20,
                            minChunks: 2,
                        },
                    },
                },
            };
        } else {
            // Dev: keep async-only splitting to avoid preload waterfall warnings
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'async',
                    cacheGroups: { default: false },
                },
            };
        }

        return config;
    },
};

module.exports = nextConfig;
