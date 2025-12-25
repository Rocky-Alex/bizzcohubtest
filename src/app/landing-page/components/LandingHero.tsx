"use client";

import { useMemo } from "react";
import Link from "next/link";
import Particles from "./Particles";
import Stack from "./Stack";
import Image from "next/image";
import imageKitLoader from "@/utils/imageLoader";

import "../styles/landing-page.css";
import "../styles/home-styles.css";
import "../styles/landing-page-extra.css";

export default function LandingHero() {
    // Memoize the stack cards to prevent re-renders in Stack component
    const stackCards = useMemo(() => [
        <div key={1} style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '1rem', overflow: 'hidden' }}>
            <Image
                loader={imageKitLoader}
                src="https://ik.imagekit.io/kxci2a0h5/landing-page/gaming-laptop.png?updatedAt=1765254743460"
                alt="Gaming Laptop"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
            />
        </div>,
        <div key={2} style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '1rem', overflow: 'hidden' }}>
            <Image
                loader={imageKitLoader}
                src="https://ik.imagekit.io/kxci2a0h5/landing-page/category-accessories.jpg?updatedAt=1765254764848"
                alt="Accessories"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
            />
        </div>,
        <div key={3} style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '1rem', overflow: 'hidden' }}>
            <Image
                loader={imageKitLoader}
                src="https://ik.imagekit.io/kxci2a0h5/landing-page/category-laptops_CNlHa-lWv.jpg?updatedAt=1765186346540"
                alt="Laptops"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
            />
        </div>,
        <div key={4} style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '1rem', overflow: 'hidden' }}>
            <Image
                loader={imageKitLoader}
                src="https://ik.imagekit.io/kxci2a0h5/landing-page/category-macbook.jpg?updatedAt=1765254808557"
                alt="MacBook"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
            />
        </div>
    ], []);

    return (
        <>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
                <Particles
                    particleColors={['#667EEA', '#4b78a2ff', '#93fbb6ff', '#13503dff']}
                    particleCount={800}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={100}
                    moveParticlesOnHover={true}
                    alphaParticles={true}
                    disableRotation={false}
                />
            </div>

            {/* Hero Section */}
            <section className="hero-section-v3" style={{ background: 'transparent', zIndex: 1 }}>

                <div className="hero-container">
                    <div className="hero-content fade-in-up">
                        <div className="hero-tag glow-effect">
                            <span className="tag-dot pulse-dot"></span>
                            <span className="tag-text">New Collection 2026</span>
                            <div className="tag-shine"></div>
                        </div>

                        <h1 className="hero-title">
                            <span className="title-line slide-in-left">Welcome to</span>
                            <span className="title-line slide-in-left delay-1">
                                <span className="gradient-text-animated">Bizzcohub</span>
                            </span>
                        </h1>

                        <p className="hero-subtitle fade-in-up delay-2">
                            Experience the perfect blend of cutting-edge technology and premium design.
                            Discover products that elevate your lifestyle.
                        </p>

                        <div className="hero-cta fade-in-up delay-3">
                            <Link href="/products" className="btn-gradient-animated magnetic-btn">
                                <span className="btn-text">Explore Collection</span>
                                <span className="btn-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </span>
                                <div className="btn-shine"></div>
                            </Link>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
                            <Stack
                                randomRotation={true}
                                sensitivity={180}
                                sendToBackOnClick={true}
                                autoplay={true}
                                autoplayDelay={3000}
                                cards={stackCards}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
