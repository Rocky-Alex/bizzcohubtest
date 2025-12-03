"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./home-styles.css";

const themes = [
    {
        name: 'blue-green',
        gradient: 'linear-gradient(135deg, #00A9FF 0%, #A0E9FF 100%)',
        accent1: '#00A9FF',
        accent2: '#A0E9FF',
        image: '/uploads/img00A9FF,A0E9FF.png'
    },
    {
        name: 'purple-pink',
        gradient: 'linear-gradient(135deg, #5E936C 0%, #93DA97 100%)',
        accent1: '#5E936C',
        accent2: '#93DA97',
        image: '/uploads/img5E936C,93DA97.png'
    },
    {
        name: 'orange-yellow',
        gradient: 'linear-gradient(135deg, #222831 0%, #393E46 100%)',
        accent1: '#222831',
        accent2: '#393E46',
        image: '/uploads/img222831,393E46.png'
    }
];

export default function Home() {
    const [currentTheme, setCurrentTheme] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Load saved theme and apply it immediately
        const savedTheme = localStorage.getItem('siteTheme');
        const themeIndex = savedTheme ? parseInt(savedTheme) : 0;

        // Apply theme immediately on mount
        document.body.style.background = themes[themeIndex].gradient;
        document.documentElement.style.setProperty('--accent-1', themes[themeIndex].accent1);
        document.documentElement.style.setProperty('--accent-2', themes[themeIndex].accent2);

        if (savedTheme) {
            setCurrentTheme(themeIndex);
        }

        // Parallax effect on mouse move
        const handleMouseMove = (e: MouseEvent) => {
            const laptop = document.querySelector('.laptop-image') as HTMLElement;
            if (laptop) {
                const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
                const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

                laptop.style.transform = `translateY(0px) rotate(-15deg) translateX(${moveX}px) translateY(${moveY}px)`;
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        // Apply theme whenever it changes
        document.body.style.background = themes[currentTheme].gradient;

        // Update CSS custom properties for accents
        document.documentElement.style.setProperty('--accent-1', themes[currentTheme].accent1);
        document.documentElement.style.setProperty('--accent-2', themes[currentTheme].accent2);

        // Save theme preference
        localStorage.setItem('siteTheme', currentTheme.toString());
    }, [currentTheme]);



    const handleThemeChange = (index: number) => {
        setCurrentTheme(index);
    };

    return (
        <div className="home-wrapper">
            {/* Hero Section */}
            <section className="hero">
                {/* Background Elements */}
                <div className="bg-circle bg-circle-1"></div>
                <div className="bg-circle bg-circle-2"></div>
                <div className="bg-circle bg-circle-3"></div>

                {/* Content */}
                <div className="content">
                    <div className="devices-label">DEVICES</div>
                    <h1 className="main-title">LAPTOP</h1>
                    <Link href="/products" className="explore-btn">Explore Our Product</Link>
                </div>

                {/* Laptop Image - Changes with Theme */}
                <div className="laptop-container">
                    <img
                        src={themes[currentTheme].image}
                        alt={`Laptop - ${themes[currentTheme].name}`}
                        className="laptop-image"
                        key={currentTheme}
                    />
                </div>

                {/* Side Indicators - Theme Switcher */}
                <div className={`side-indicators ${isScrolled ? 'scrolled' : ''}`}>
                    <div
                        className={`indicator ${currentTheme === 0 ? 'active' : ''}`}
                        onClick={() => handleThemeChange(0)}
                        title="Blue-Green Theme"
                    ></div>
                    <div
                        className={`indicator ${currentTheme === 1 ? 'active' : ''}`}
                        onClick={() => handleThemeChange(1)}
                        title="Green Theme"
                    ></div>
                    <div
                        className={`indicator ${currentTheme === 2 ? 'active' : ''}`}
                        onClick={() => handleThemeChange(2)}
                        title="Dark Theme"
                    ></div>
                </div>
            </section>

            {/* Services Section */}
            <section className="services-section">
                <div className="services-header">
                    <h2 className="section-title">Our Services</h2>
                    <p className="section-subtitle">Comprehensive solutions for all your technology needs</p>
                </div>
                <div className="services-grid">
                    <div className="service-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                        </div>
                        <div className="card-image">
                            <img src="/uploads/homecard1.jpg" alt="Laptop Refurbishing" />
                        </div>
                        <div className="card-content">
                            <h3>Laptop Refurbishing</h3>
                            <p>Professional restoration to optimal performance with quality parts and expert care</p>
                            <Link href="services/#refurbishing" className="card-link">
                                Learn more
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div className="service-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                            </svg>
                        </div>
                        <div className="card-image">
                            <img src="/uploads/homecard2.jpg" alt="Laptop Repairing & Service" />
                        </div>
                        <div className="card-content">
                            <h3>Repairing & Service</h3>
                            <p>Expert technicians handling all laptop issues with precision and guaranteed results</p>
                            <Link href="/services/#repair" className="card-link">
                                Learn more
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div className="service-card">
                        <div className="card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                        </div>
                        <div className="card-image">
                            <img src="/uploads/homecard3.jpg" alt="Web Design" />
                        </div>
                        <div className="card-content">
                            <h3>Web Design</h3>
                            <p>Modern, responsive websites that elevate your business and engage your audience</p>
                            <Link href="/services/#webdesign" className="card-link">
                                Learn more
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>


            {/* Product Categories Section */}
            <section style={{
                padding: '100px 100px',
                background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '2.5rem',
                        marginBottom: '50px',
                        fontFamily: 'Bebas Neue, sans-serif',
                        letterSpacing: '2px',
                        color: '#333'
                    }}>
                        Shop By Category
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '30px',
                        justifyContent: 'center'
                    }}>
                        {/* Laptop Refurbishing Card */}
                        <Link href="/products/laptops" style={{ textDecoration: 'none' }}>
                            <div className="product-cat-card" style={{
                                background: '#fff',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 10px rgba(0, 0, 0, 0.1)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                cursor: 'pointer',
                                height: '100%'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '260px',
                                    overflow: 'hidden',
                                    background: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    <img
                                        src="/uploads/homecard1.jpg"
                                        alt="Laptop Refurbishing"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s ease'
                                        }}
                                        className="card-image-hover"
                                    />
                                </div>
                                <div style={{ padding: '30px', textAlign: 'center' }}>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: '#333',
                                        marginBottom: '10px',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Laptop Refurbishing
                                    </h3>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#666',
                                        marginBottom: '20px',
                                        lineHeight: '1.5',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Professional restoration to optimal performance
                                    </p>
                                    <span style={{
                                        color: '#007bff',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        fontSize: '16px',
                                        transition: 'color 0.3s ease',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Learn more →
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {/* Premium Accessories Card */}
                        <Link href="/products/accessories" style={{ textDecoration: 'none' }}>
                            <div className="product-cat-card" style={{
                                background: '#fff',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                cursor: 'pointer',
                                height: '100%'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '260px',
                                    overflow: 'hidden',
                                    background: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    <img
                                        src="/uploads/homecard2.jpg"
                                        alt="Premium Accessories"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s ease'
                                        }}
                                        className="card-image-hover"
                                    />

                                </div>
                                <div style={{ padding: '30px', textAlign: 'center' }}>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: '#333',
                                        marginBottom: '10px',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Premium Accessories
                                    </h3>
                                    <p style={{
                                        fontSize: '16px',
                                        color: '#666',
                                        marginBottom: '20px',
                                        lineHeight: '1.5',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Complete your setup with quality peripherals
                                    </p>
                                    <span style={{
                                        color: '#007bff',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                        fontSize: '16px',
                                        transition: 'color 0.3s ease',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Shop accessories →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            <style jsx>{`
                .product-cat-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
                }
                .product-cat-card:hover .card-image-hover {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
}
