"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./styles/footer.css";
import GradientText from "../Navigation/components/GradientText";

export default function Footer() {
    const pathname = usePathname();
    const isTermsPage = pathname === '/terms';

    return (
        <footer className="main-footer">
            <div className="footer-content">
                <div className="footer-simple">
                    <div className="footer-brand-simple">
                        <Link href="/" className="logo">
                            <GradientText
                                colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                                animationSpeed={3}
                                showBorder={false}
                                className="logo-text"
                            >
                                Bizz Co Hub
                            </GradientText>
                        </Link>
                        <p>Premium refurbished electronics and professional IT services.</p>
                    </div>

                    <div className="footer-links-simple">
                        <Link href="/products">Products</Link>
                        <Link href="/services">Services</Link>
                        <Link href="/contact">Contact</Link>
                    </div>

                    <div className="footer-address">
                        <p>Shop #00,Industrial Area 5,Sharjah</p>
                        <p>+971567064457</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>
                        &copy; {new Date().getFullYear()} Bizz Co Hub.{' '}
                        {isTermsPage ? (
                            <span
                                onClick={(e) => {
                                    const target = e.currentTarget;
                                    const clicks = (parseInt(target.dataset.clicks || '0') + 1);
                                    target.dataset.clicks = clicks.toString();

                                    if (clicks >= 10) {
                                        window.location.href = '/admin/login';
                                        target.dataset.clicks = '0'; // Reset after navigation
                                    }

                                    // Reset clicks if not clicked within 5 seconds
                                    if (target.dataset.timeout) clearTimeout(parseInt(target.dataset.timeout));
                                    target.dataset.timeout = setTimeout(() => {
                                        target.dataset.clicks = '0';
                                    }, 5000).toString();
                                }}
                                style={{ cursor: 'text', userSelect: 'none' }}
                            >
                                All rights reserved.
                            </span>
                        ) : (
                            <span>All rights reserved.</span>
                        )}
                    </p>
                    <div className="footer-bottom-links">
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
