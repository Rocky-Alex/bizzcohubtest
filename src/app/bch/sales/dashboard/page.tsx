"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PackageOpen, Undo2, TrendingUp, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function SalesDashboard() {
    const [stats, setStats] = useState({
        totalSold: 0,
        pendingReturns: 0,
        recentSales: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSalesOut();
    }, []);

    const fetchSalesOut = async () => {
        try {
            const res = await fetch('/api/bch/sales/process');
            const data = await res.json();
            if (data.success && data.salesOut) {
                const sold = data.salesOut.filter((s: any) => s.status === 'Sold Out');
                const pending = data.salesOut.filter((s: any) => s.status === 'Return Initiated' || s.status === 'Pending QC');
                
                setStats({
                    totalSold: sold.length,
                    pendingReturns: pending.length,
                    recentSales: data.salesOut.slice(0, 5)
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0, opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="sales-dashboard-container">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="section-header"
            >
                <h2>
                    <i className="fas fa-chart-line text-primary"></i>
                    Sales Overview
                </h2>
                <p>Monitor your daily sales performance and returns from the sales port</p>
            </motion.div>
            
            <div className="dashboard-summary-cards">
                {/* Total Sold Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="summary-card"
                >
                    <div className="card-top">
                        <span className="card-title">Total Products Sold</span>
                        <div className="card-icon-wrapper" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                            <i className="fas fa-box-open"></i>
                        </div>
                    </div>
                    <div className="card-main">
                        <span className="card-value">{loading ? '...' : stats.totalSold}</span>
                        <span className="card-trend positive">
                            <i className="fas fa-arrow-up"></i>
                            Active
                        </span>
                    </div>
                    <div className="corner-accent blue"></div>
                </motion.div>

                {/* Pending Returns Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="summary-card"
                >
                    <div className="card-top">
                        <span className="card-title">Pending QC Returns</span>
                        <div className="card-icon-wrapper" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                            <i className="fas fa-undo"></i>
                        </div>
                    </div>
                    <div className="card-main">
                        <span className="card-value">{loading ? '...' : stats.pendingReturns}</span>
                    </div>
                    <div className="corner-accent orange"></div>
                </motion.div>

                {/* Action Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="quick-action-card"
                    onClick={() => window.location.href = '/bch/sales/port'}
                >
                    <div className="quick-action-icon" style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
                        <i className="fas fa-door-open"></i>
                    </div>
                    <div className="quick-action-content">
                        <span className="quick-action-title">Open Sales Port</span>
                        <span className="quick-action-desc">Scan out products for sales <i className="fas fa-arrow-right ml-2"></i></span>
                    </div>
                </motion.div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="dashboard-invoices-section"
            >
                <div className="section-header-row">
                    <h3>
                        <i className="fas fa-history mr-2" style={{ color: 'var(--secondary)' }}></i>
                        Recent Sales Activity
                    </h3>
                    <Link href="/bch/sales/inventory" className="view-all-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        View Inventory <i className="fas fa-chevron-right ml-2" style={{ fontSize: '0.7rem' }}></i>
                    </Link>
                </div>
                
                <div className="table-container">
                    {loading ? (
                        <LoadingSpinner text="Fetching Activities..." />
                    ) : stats.recentSales.length > 0 ? (
                        <table className="invoices-table">
                            <thead>
                                <tr>
                                    <th>Invoice No</th>
                                    <th>Barcode</th>
                                    <th>Product Name</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentSales.map((sale: any, index) => (
                                    <tr key={sale.id}>
                                        <td style={{ fontWeight: 600 }}>{sale.invoice_no}</td>
                                        <td className="text-gray" style={{ fontFamily: 'monospace' }}>{sale.barcode}</td>
                                        <td>{sale.product_name}</td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 12px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: sale.status === 'Sold Out' ? '#dcfce7' : '#fef3c7',
                                                color: sale.status === 'Sold Out' ? '#166534' : '#92400e'
                                            }}>
                                                {sale.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                            <div style={{ 
                                width: '64px', 
                                height: '64px', 
                                backgroundColor: 'var(--bg-tertiary)', 
                                borderRadius: '50%', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                marginBottom: '1rem',
                                color: 'var(--text-tertiary)'
                            }}>
                                <i className="fas fa-box-open" style={{ fontSize: '24px' }}></i>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>No sales recorded yet</h3>
                            <p className="text-gray" style={{ maxWidth: '400px', margin: '0 auto' }}>Once products are scanned out from the Sales Port, they will appear here.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
