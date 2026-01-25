"use client";

import Image from "next/image";
import Link from "next/link";
import imageKitLoader from "@/utils/imageLoader";

interface CategoryCardProps {
    href: string;
    title: string;
    description: string;
    imageUrl: string;
    isLight?: boolean;
    useLoader?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
}

export default function CategoryCard({
    href,
    title,
    description,
    imageUrl,
    isLight = false,
    useLoader = true,
    width,
    height,
    priority = false
}: CategoryCardProps) {
    return (
        <Link href={href} className={`new-category-card ${isLight ? 'light-theme' : ''}`}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLight ? 'white' : 'transparent'
            }}>
                <Image
                    loader={useLoader ? imageKitLoader : undefined}
                    src={imageUrl}
                    alt={title}
                    fill={!width && !height}
                    width={width}
                    height={height}
                    priority={priority}
                    className={(!width && !height) ? "object-cover" : ""}
                    sizes={(!width && !height) ? "(max-width: 768px) 100vw, 25vw" : undefined}
                    style={(!width && !height) ? { objectFit: 'cover' } : { width: '90%', height: 'auto', objectFit: 'contain' }}
                />
            </div>
            <div className="new-category-content">
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="explore-btn">
                    Explore <i className="fas fa-arrow-right"></i>
                </span>
            </div>
        </Link>
    );
}
