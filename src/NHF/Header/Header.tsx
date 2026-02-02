"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUserRound, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./header.css";
import GradientText from "./GradientText";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useTheme } from "../../context/ThemeContext";
import imageKitLoader from "@/utils/imageLoader";

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [currentUser?.image_url]);

    // Derived state for admin check
    const isAdminUser = currentUser && (['admin', 'sarath', 'rishadnpm'].includes(currentUser.username) || currentUser.email === 'bizzcohubllc@gmail.com');

    // useEffect(() => {
    //     const handleScroll = () => {
    //         setScrolled(window.scrollY > 50);
    //     };
    //     window.addEventListener('scroll', handleScroll);
    //     return () => window.removeEventListener('scroll', handleScroll);
    // }, []);

    // Cart Sync
    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
        };
        updateCartCount();
        window.addEventListener('cart-updated', updateCartCount);
        return () => window.removeEventListener('cart-updated', updateCartCount);
    }, []);

    // Auth Sync
    useEffect(() => {
        const checkUser = async () => {
            const stored = localStorage.getItem('customer_user');
            if (stored) {
                try {
                    const localUser = JSON.parse(stored);
                    setCurrentUser(localUser); // Set immediately to show something

                    // Fetch fresh data
                    if (localUser.id) {
                        const res = await fetch(`/api/customer/profile?id=${localUser.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            const freshUser = { ...localUser, ...data.user };
                            // Ensure image_url is picked up
                            if (data.user.image_url) freshUser.image_url = data.user.image_url;

                            // Update state and storage
                            setCurrentUser(freshUser);
                            localStorage.setItem('customer_user', JSON.stringify(freshUser));
                        }
                    }
                } catch (e) {
                    console.error("Error parsing user", e);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
        };

        checkUser();
        window.addEventListener('user-login', checkUser);
        window.addEventListener('user-logout', checkUser);

        return () => {
            window.removeEventListener('user-login', checkUser);
            window.removeEventListener('user-logout', checkUser);
        };
    }, []);

    const confirmLogout = () => {
        setLogoutModalOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('customer_user');
        setCurrentUser(null);
        setLogoutModalOpen(false);
        window.location.href = '/login';
    };

    const isActive = (path: string) => pathname === path ? 'active' : '';

    const getInitials = (name: string) => {
        if (!name) return "";
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    return (
        <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="header-container">
                {/* Logo */}
                <Link href="/" className="logo">
                    <Image
                        src="/icon/nav-logo.png"
                        alt="Bizz Co Hub Logo"
                        width={34}
                        height={34}
                        className="logo-image"
                    />
                    <GradientText
                        colors={theme === 'dark'
                            ? ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]
                            : ["#1A2244", "#1A2244", "#1A2244", "#1A2244", "#1A2244"]}
                        animationSpeed={3}
                        showBorder={false}
                        className="logo-text"
                    >
                        BIZZ CO HUB
                    </GradientText>
                </Link>

                {/* Desktop Navigation - Centered */}
                <nav className="main-nav">
                    <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                        Home
                    </Link>

                    <Link href="/products" className={`nav-link ${pathname.startsWith('/products') ? 'active' : ''}`}>
                        E-Commerce
                    </Link>

                    {isAdminUser && (
                        <Link href="/resources" className={`nav-link ${pathname.startsWith('/resources') ? 'active' : ''}`}>
                            Resources
                        </Link>
                    )}

                    <Link href="/services" className={`nav-link ${isActive('/services') ? 'active' : ''}`}>
                        Services
                    </Link>

                    <Link href="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
                        Contact
                    </Link>

                </nav>

                {/* Right Side Actions */}
                <div className="header-actions">
                    {/* Theme Toggle */}
                    <button
                        className="header-action-btn theme-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                    >
                        {theme === 'light' ? (
                            <Moon size={20} />
                        ) : (
                            <Sun size={20} />
                        )}
                    </button>

                    {/* Search Button */}
                    <button
                        className="header-action-btn search-btn"
                        onClick={() => setSearchOpen(!searchOpen)}
                        title="Search"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </button>

                    {/* Cart Button */}
                    <Link href="/cart" className="header-action-btn cart-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </Link>


                    {/* Auth Button */}
                    {currentUser ? (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="outline" aria-label="Open account menu" className="header-action-btn" style={{ border: 'none', background: 'transparent', padding: 0, overflow: 'hidden', width: '28px', height: '28px', borderRadius: '50%' }}>
                                        {currentUser.image_url && !imageError ? (
                                            <div className="profile-img-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <Image
                                                    loader={imageKitLoader}
                                                    src={currentUser.image_url}
                                                    alt="Profile"
                                                    fill
                                                    sizes="32px"
                                                    style={{
                                                        objectFit: 'cover'
                                                    }}
                                                    onError={() => setImageError(true)}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: getAvatarColor(currentUser.name || currentUser.username || "User"),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                borderRadius: '50%'
                                            }}>
                                                {getInitials(currentUser.name || currentUser.username || "User")}
                                            </div>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="max-w-64" align="end">


                                    <DropdownMenuGroup>
                                        <DropdownMenuItem onClick={() => window.location.href = '/profile?view=dashboard'}>
                                            Dashboard
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.location.href = '/profile?view=profile-info'}>
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.location.href = '/profile?view=orders'}>
                                            Orders
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.location.href = '/profile?view=wishlist'}>
                                            Wishlist
                                        </DropdownMenuItem>
                                        {(currentUser.username === 'admin' || currentUser.email === 'bizzcohubllc@gmail.com') && (
                                            <DropdownMenuItem onClick={() => window.location.href = '/admin/login'}>
                                                Admin Login
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={confirmLogout} style={{ color: '#ef4444' }}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Link href="/login" className="sign-in-btn">
                            Sign In
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {mobileMenuOpen ? (
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18"></path>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search Overlay */}
            {
                searchOpen && (
                    <div className="search-overlay">
                        <div className="search-container-overlay">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input
                                type="search"
                                placeholder="Search products..."
                                className="search-input"
                                autoFocus
                            />
                            <button className="search-close" onClick={() => setSearchOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Mobile Menu */}
            {
                mobileMenuOpen && (
                    <div className="mobile-menu">
                        <div className="mobile-menu-content">
                            <Link
                                href="/"
                                className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Home
                            </Link>

                            <Link
                                href="/products"
                                className={`mobile-nav-link ${pathname.startsWith('/products') ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                E-Commerce
                            </Link>

                            {isAdminUser && (
                                <Link
                                    href="/resources"
                                    className={`mobile-nav-link ${pathname.startsWith('/resources') ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Resources
                                </Link>
                            )}

                            <Link
                                href="/services"
                                className={`mobile-nav-link ${isActive('/services') ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Services
                            </Link>

                            <Link
                                href="/contact"
                                className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>

                            <Link
                                href="/cart"
                                className={`mobile-nav-link ${isActive('/cart') ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <span>Cart</span>
                                {cartCount > 0 && (
                                    <span style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        marginLeft: '8px'
                                    }}>
                                        {cartCount}
                                    </span>
                                )}
                            </Link>


                            <div className="mobile-menu-divider"></div>

                            <button
                                onClick={() => {
                                    toggleTheme();
                                    setMobileMenuOpen(false);
                                }}
                                className="mobile-nav-link"
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    padding: '12px 0'
                                }}
                            >
                                {theme === 'light' ? (
                                    <>
                                        <Moon size={18} />
                                        <span>Dark Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <Sun size={18} />
                                        <span>Light Mode</span>
                                    </>
                                )}
                            </button>

                            <div className="mobile-menu-divider"></div>

                            {currentUser ? (
                                <button
                                    onClick={() => {
                                        confirmLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="mobile-sign-in-btn"
                                    style={{ background: '#ef4444' }} // Red for logout
                                >
                                    Logout
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className="mobile-sign-in-btn"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                )
            }

            <ConfirmModal
                isOpen={logoutModalOpen}
                title="Confirm Logout"
                message="Are you sure you want to log out of your account?"
                onConfirm={handleLogout}
                onCancel={() => setLogoutModalOpen(false)}
                confirmText="Logout"
                cancelText="Cancel"
                type="danger"
            />
        </header >
    );
}
