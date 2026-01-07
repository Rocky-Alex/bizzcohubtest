"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import imageKitLoader from "@/utils/imageLoader";

interface ProductImageProps extends Omit<ImageProps, 'loader' | 'src'> {
    src?: string | null;
    fallbackSrc?: string;
}

export default function ProductImage({ src, fallbackSrc, alt, ...props }: ProductImageProps) {
    const defaultPlaceholder = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80";
    const [imgSrc, setImgSrc] = useState<string>(src || defaultPlaceholder);

    useEffect(() => {
        setImgSrc(src || defaultPlaceholder);
    }, [src]);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt || "Product image"}
            loader={imageKitLoader}
            onError={() => {
                if (imgSrc !== (fallbackSrc || defaultPlaceholder)) {
                    setImgSrc(fallbackSrc || defaultPlaceholder);
                }
            }}
        />
    );
}
