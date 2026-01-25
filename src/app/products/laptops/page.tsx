"use client";

import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function LaptopsPage() {
    const [laptops, setLaptops] = useState<any[]>([]);
    const [filteredLaptops, setFilteredLaptops] = useState<any[]>([]);
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLaptops = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/products?category=laptop');
                if (!response.ok) {
                    throw new Error('Failed to fetch laptops');
                }
                const data = await response.json();
                setLaptops((data.products || []).filter((p: any) => p.code || p.id));
                setFilteredLaptops((data.products || []).filter((p: any) => p.code || p.id));
            } catch (err) {
                console.error("Error loading laptops:", err);
                setError("Failed to load products. Please try again later.");
                // Fallback to localStorage just in case database is down/empty during migration
                const storedLaptops = JSON.parse(localStorage.getItem("bchLaptops") || "[]");
                if (storedLaptops.length > 0) {
                    setLaptops(storedLaptops);
                    setFilteredLaptops(storedLaptops);
                    setError(null); // Clear error if fallback works
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLaptops();
    }, []);

    useEffect(() => {
        let result = [...laptops];

        // Filter
        if (category !== "all") {
            result = result.filter((l) => l.category === category);
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

        setFilteredLaptops(result);
    }, [category, sortBy, laptops]);

    return (
        <>
            {/* Products Hero */}
            <section
                className="page-hero"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(/uploads/lapproduct.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="container">
                    <h1>
                        <i className="fas fa-laptop"></i> Refurbished Laptops
                    </h1>
                    <p>Quality Certified Laptops at Unbeatable Prices</p>
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
                                <option value="all">All Laptops</option>
                                <option value="Dell">Dell</option>
                                <option value="HP">HP</option>
                                <option value="Lenovo">Lenovo</option>
                                <option value="Desktop">Desktop</option>
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
                            <div style={{ gridColumn: '1 / -1' }}>
                                <LoadingSpinner fullScreen />
                            </div>
                        ) : error ? (
                            <div className="error-state" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--danger-color)" }}>
                                <i className="fas fa-exclamation-circle" style={{ fontSize: "3rem", marginBottom: "1rem" }}></i>
                                <p>{error}</p>
                            </div>
                        ) : (
                            filteredLaptops.length > 0 ? (
                                filteredLaptops.map((laptop, index) => (
                                    <ProductCard key={index} product={laptop} type="laptop" />
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i
                                        className="fas fa-laptop"
                                        style={{
                                            fontSize: "4rem",
                                            color: "var(--text-light)",
                                            marginBottom: "1rem",
                                        }}
                                    ></i>
                                    <h3>No Laptops Available</h3>
                                    <p>Check back soon for amazing deals on refurbished laptops!</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
