/**
 * Optimized Image Component
 * Wrapper around Next.js Image with performance optimizations
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
    fallbackSrc?: string;
    showPlaceholder?: boolean;
}

export default function OptimizedImage({
    src,
    alt,
    fallbackSrc = '/placeholder.svg',
    showPlaceholder = true,
    className = '',
    ...props
}: OptimizedImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        if (fallbackSrc) {
            setImgSrc(fallbackSrc);
        }
    };

    return (
        <div className={`optimized-image-wrapper ${className}`} style={{ position: 'relative' }}>
            {showPlaceholder && isLoading && !hasError && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                    }}
                />
            )}
            <Image
                {...props}
                src={imgSrc}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
                quality={props.quality || 85}
                placeholder={props.placeholder || 'blur'}
                blurDataURL={props.blurDataURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg=='}
                style={{
                    ...props.style,
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out',
                }}
            />
            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
            `}</style>
        </div>
    );
}
