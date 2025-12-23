"use client";

import { useState } from "react";
import Image from "next/image";
import imageKitLoader from "@/utils/imageLoader";

interface ProductGalleryProps {
    images: string[];
    name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const displayImages = images.length > 0 ? images : ['/placeholder.svg'];

    return (
        <div className="left-column">
            <div className="thumbnail-strip">
                {displayImages.map((image, index) => (
                    <div
                        key={index}
                        className={`thumbnail-item ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                    >
                        <Image
                            src={image}
                            alt={`${name} - View ${index + 1}`}
                            width={80}
                            height={80}
                            loader={imageKitLoader}
                            className="object-contain"
                        />
                    </div>
                ))}
            </div>
            <div className="main-product-image">
                <Image
                    src={displayImages[selectedImage]}
                    alt={name}
                    width={600}
                    height={600}
                    priority
                    loader={imageKitLoader}
                    className="object-contain"
                />
            </div>
        </div>
    );
}
