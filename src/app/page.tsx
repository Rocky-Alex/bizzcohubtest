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
        // Load saved theme
        const savedTheme = localStorage.getItem('siteTheme');
        if (savedTheme) {
            setCurrentTheme(parseInt(savedTheme));
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
        // Apply theme
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
                <div className="service-card">
                    <div className="card-image">
                        <img src="/uploads/homecard1.jpg" alt="Laptop Refurbishing" />
                    </div>
                    <div className="card-content">
                        <h3>Laptop Refurbishing</h3>
                        <p>Professional restoration to optimal performance</p>
                        <Link href="/services/refurbishing" className="card-link">Learn more →</Link>
                    </div>
                </div>

                <div className="service-card">
                    <div className="card-image">
                        <img src="/uploads/homecard2.jpg" alt="Premium Accessories" />
                    </div>
                    <div className="card-content">
                        <h3>Premium Accessories</h3>
                        <p>Complete your setup with quality peripherals</p>
                        <Link href="/products/accessories" className="card-link">Shop accessories →</Link>
                    </div>
                </div>

                <div className="service-card">
                    <div className="card-image">
                        <img src="/uploads/homecard3.jpg" alt="Web Design" />
                    </div>
                    <div className="card-content">
                        <h3>Web Design</h3>
                        <p>Modern, responsive solutions for your business</p>
                        <Link href="/services/web-design" className="card-link">View services →</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
