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
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const displayImages = images.length > 0 ? images : ['/placeholder.svg'];

    // Touch handlers for Swipe support
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && selectedImage < displayImages.length - 1) {
            // Swipe Left -> Next Image
            setSelectedImage(prev => prev + 1);
        } else if (isRightSwipe && selectedImage > 0) {
            // Swipe Right -> Prev Image
            setSelectedImage(prev => prev - 1);
        }
    };

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
            <div
                className="main-product-image"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <Image
                    src={displayImages[selectedImage]}
                    alt={name}
                    width={600}
                    height={600}
                    priority
                    loader={imageKitLoader}
                    className="object-contain"
                    draggable={false} // Prevent default drag behavior to allow proper swipe
                />
            </div>

            {/* Mobile Dots Navigation */}
            <div className="mobile-gallery-dots">
                {displayImages.map((_, index) => (
                    <span
                        key={index}
                        className={`gallery-dot ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                    />
                ))}
            </div>
        </div>
    );
}
