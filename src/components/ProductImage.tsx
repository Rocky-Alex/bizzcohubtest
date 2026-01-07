"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import imageKitLoader from "@/utils/imageLoader";

interface ProductImageProps extends Omit<ImageProps, 'loader' | 'src'> {
    src?: string | null;
    fallbackSrc?: string;
}

export default function ProductImage({ src, fallbackSrc, alt, ...props }: ProductImageProps) {
    const defaultPlaceholder = "/product-placeholder.png";
    const [imgSrc, setImgSrc] = useState<string>(src || defaultPlaceholder);

    useEffect(() => {
        setImgSrc(src || defaultPlaceholder);
    }, [src]);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt || "Product image"}
            loader={imgSrc.startsWith('http') || imgSrc.startsWith('//') ? imageKitLoader : undefined}
            onError={() => {
                if (imgSrc !== (fallbackSrc || defaultPlaceholder)) {
                    setImgSrc(fallbackSrc || defaultPlaceholder);
                }
            }}
        />
    );
}
