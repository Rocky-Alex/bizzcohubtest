import Link from "next/link";
import "./footer.css";

export default function Footer() {
    return (
        <footer className="main-footer">
            <div className="footer-content">
                <div className="footer-simple">
                    <div className="footer-brand-simple">
                        <Link href="/" className="logo">
                            <span className="logo-text">Bizz<span className="highlight">Co</span>Hub</span>
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
                    <p>&copy; {new Date().getFullYear()} Bizz Co Hub. All rights reserved.</p>
                    <div className="footer-bottom-links">
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
