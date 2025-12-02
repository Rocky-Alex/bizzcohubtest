"use client";

import { useState, useEffect } from "react";
import ProductCard from "../../../components/ProductCard";

export default function AccessoriesPage() {
    const [accessories, setAccessories] = useState<any[]>([]);
    const [filteredAccessories, setFilteredAccessories] = useState<any[]>([]);
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccessories = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/products?category=accessory');
                if (!response.ok) {
                    throw new Error('Failed to fetch accessories');
                }
                const data = await response.json();
                setAccessories(data.products || []);
                setFilteredAccessories(data.products || []);
            } catch (err) {
                console.error("Error loading accessories:", err);
                setError("Failed to load products. Please try again later.");
                // Fallback to localStorage just in case database is down/empty during migration
                const storedAccessories = JSON.parse(localStorage.getItem("bchAccessories") || "[]");
                if (storedAccessories.length > 0) {
                    setAccessories(storedAccessories);
                    setFilteredAccessories(storedAccessories);
                    setError(null); // Clear error if fallback works
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccessories();
    }, []);

    useEffect(() => {
        let result = [...accessories];

        // Filter
        if (category !== "all") {
            result = result.filter((a) => a.category === category);
        }

        // Sort
        switch (sortBy) {
            case "price-low":
                result.sort((a, b) => a.offer_price - b.offer_price);
                break;
            case "price-high":
                result.sort((a, b) => b.offer_price - a.offer_price);
                break;
            case "discount":
                result.sort((a, b) => b.discount - a.discount);
                break;
            case "newest":
            default:
                result.sort(
                    (a, b) =>
                        new Date(b.date_added || b.created_at).getTime() - new Date(a.date_added || a.created_at).getTime()
                );
        }

        setFilteredAccessories(result);
    }, [category, sortBy, accessories]);

    return (
        <>
            {/* Products Hero */}
            <section
                className="page-hero"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(/uploads/Accproduct.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="container">
                    <h1>
                        <i className="fas fa-keyboard"></i> Computer Accessories
                    </h1>
                    <p>Premium Accessories & Peripherals for Your Setup</p>
                </div>
            </section>

            {/* Products Grid */}
            <section className="products-section">
                <div className="container">
                    {/* Filter Section */}
                    <div className="filter-section">
                        <div className="filter-group">
                            <label htmlFor="categoryFilter">Category:</label>
                            <select
                                id="categoryFilter"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="all">All Accessories</option>
                                <option value="Keyboard">Keyboards</option>
                                <option value="Mouse">Mouse</option>
                                <option value="Headset">Headsets</option>
                                <option value="Monitor">Monitors</option>
                                <option value="Cable">Cables</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="sortFilter">Sort By:</label>
                            <select
                                id="sortFilter"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="discount">Highest Discount</option>
                            </select>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="products-grid">
                        {isLoading ? (
                            <div className="loading-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: "3rem", color: "var(--primary-color)" }}></i>
                                <p style={{ marginTop: "1rem" }}>Loading accessories...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--danger-color)" }}>
                                <i className="fas fa-exclamation-circle" style={{ fontSize: "3rem", marginBottom: "1rem" }}></i>
                                <p>{error}</p>
                            </div>
                        ) : (
                            filteredAccessories.length > 0 ? (
                                filteredAccessories.map((item, index) => (
                                    <ProductCard key={index} product={item} type="accessory" />
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i
                                        className="fas fa-keyboard"
                                        style={{
                                            fontSize: "4rem",
                                            color: "var(--text-light)",
                                            marginBottom: "1rem",
                                        }}
                                    ></i>
                                    <h3>No Accessories Available</h3>
                                    <p>
                                        Check back soon for amazing deals on computer accessories!
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
