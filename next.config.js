/** @type {import('next').NextConfig} */

const nextConfig = {
    // Disable Vercel Analytics in development to reduce console noise
    experimental: {
        serverComponentsExternalPackages: ['@react-pdf/renderer', '@imgly/background-removal', 'onnxruntime-node', 'systeminformation'],
        outputFileTracingIncludes: {
            '/resources/sound-test': ['./public/Audios/**/*'],
        },
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

    // Allow build to proceed despite lint/type errors
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

};

module.exports = nextConfig;
