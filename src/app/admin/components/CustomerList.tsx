import React, { useState, useEffect, useRef } from 'react';
import './CustomerList.css';
import { Country } from 'country-state-city';
import CustomerLedgerModal from './CustomerLedgerModal';
import LoadingSpinner from '../../components/LoadingSpinner';

// interface Customer {
//     id: number;
//     name: string;
//     avatar: string;
//     phone: string;
//     country: string;
//     countryCode: string;
//     balance: string;
//     totalInvoice: number;
//     createdOn: string;
//     status: 'Active' | 'Inactive';
// }

// MOCK_CUSTOMERS removed in favor of real data
// const MOCK_CUSTOMERS: Customer[] = [];

export default function CustomerList({
    onAdd,
    customers = [],
    onNavigateToNewInvoice,
    loading = false
}: {
    onAdd?: () => void,
    customers?: any[],
    onNavigateToNewInvoice?: () => void,
    loading?: boolean
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<any | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === id ? null : id);
    };

    // Basic filtering logic
    const filteredCustomers = customers.filter((c: any) =>
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.billing_country && c.billing_country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.country && c.country.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);

    return (
        <div className="customer-list-container">
            {/* Header */}
            <div className="customer-header">
                <h2>Customers</h2>
                <div className="header-actions">
                    <button className="btn-export">
                        <i className="fas fa-file-export"></i> Export
                    </button>
                    <button className="btn-new-customer" onClick={onAdd}>
                        <i className="fas fa-plus"></i> New Customer
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="customer-toolbar">
                <div className="search-filter-group">
                    <div className="search-box-wrapper">
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-filter">
                        <i className="fas fa-filter"></i> Filter
                    </button>
                </div>

                <div className="table-controls">
                    <div className="control-dropdown">
                        Sort By: Latest <i className="fas fa-chevron-down"></i>
                    </div>
                    <div className="control-dropdown">
                        <i className="fas fa-columns"></i> Column <i className="fas fa-chevron-down"></i>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="customers-table-wrapper">
                {loading ? (
                    <LoadingSpinner fullScreen />
                ) : (
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th className="checkbox-col">
                                    <input type="checkbox" className="custom-checkbox" />
                                </th>
                                <th>Customer <i className="fas fa-sort"></i></th>
                                <th>Phone <i className="fas fa-sort"></i></th>
                                <th>Country <i className="fas fa-sort"></i></th>
                                <th>Balance <i className="fas fa-sort"></i></th>
                                <th>Total Invoice</th>
                                <th>Created On <i className="fas fa-sort"></i></th>
                                <th>Status</th>
                                <th>Actions</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td className="checkbox-col">
                                        <input type="checkbox" className="custom-checkbox" />
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            <img src={customer.image_url || "/default-avatar.png"} alt={customer.name} className="customer-avatar" />
                                            <div className="customer-info">
                                                <span>{customer.name}</span>
                                                <span style={{ fontSize: '0.8em', color: '#666' }}>{customer.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{customer.phone}</td>
                                    <td>
                                        <div className="country-cell">
                                            {/* <span className="flag-icon">{customer.countryCode}</span> */}
                                            {(() => {
                                                const code = customer.billing_country || customer.country;
                                                const country = Country.getCountryByCode(code);
                                                return country ? country.name : code;
                                            })()}
                                        </div>
                                    </td>
                                    <td>{customer.currency} 0.00</td>
                                    <td>0</td>
                                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${(customer.status || 'active').toLowerCase()}`}>
                                            {customer.status || 'Active'}
                                            {(customer.status || 'Active') === 'Active' ? <i className="fas fa-check-circle"></i> : <i className="fas fa-times-circle"></i>}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-action-outline" onClick={onNavigateToNewInvoice}>
                                                <i className="fas fa-plus-circle"></i> Invoice
                                            </button>
                                            <button
                                                className="btn-action-outline"
                                                onClick={() => setSelectedCustomerForLedger(customer)}
                                            >
                                                <i className="fas fa-book"></i> Ledger
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="menu-cell">
                                            <i
                                                className={`fas fa-ellipsis-h menu-dots ${activeDropdown === customer.id ? 'active' : ''}`}
                                                onClick={(e) => toggleDropdown(customer.id, e)}
                                            ></i>
                                            {activeDropdown === customer.id && (
                                                <div className="action-menu-dropdown" ref={dropdownRef}>
                                                    <div className="menu-item" onClick={() => setActiveDropdown(null)}>
                                                        <i className="far fa-eye"></i> View
                                                    </div>
                                                    <div className="menu-item" onClick={() => setActiveDropdown(null)}>
                                                        <i className="far fa-edit"></i> Edit
                                                    </div>
                                                    <div className="menu-item" onClick={() => setActiveDropdown(null)}>
                                                        <i className="fas fa-archive"></i> Archive
                                                    </div>
                                                    <div className="menu-item" onClick={() => setActiveDropdown(null)} style={{ color: '#ef4444' }}>
                                                        <i className="far fa-trash-alt"></i> Delete
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="pagination-footer">
                <div className="rows-per-page">
                    Row Per Page
                    <select className="rows-select" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    Entries
                </div>
                <div className="pagination-controls">
                    <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(c => Math.max(1, c - 1))}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}>
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            {/* Ledger Modal */}
            <CustomerLedgerModal
                isOpen={!!selectedCustomerForLedger}
                onClose={() => setSelectedCustomerForLedger(null)}
                customer={selectedCustomerForLedger ? {
                    name: selectedCustomerForLedger.name,
                    email: "johnson@example.com", // Mock email for now since it wasn't in list view
                    avatar: selectedCustomerForLedger.avatar,
                    balance: selectedCustomerForLedger.balance
                } : null}
            />
        </div >
    );
}
