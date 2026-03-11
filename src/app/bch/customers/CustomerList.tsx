import React, { useState, useEffect, useRef } from 'react';
import './CustomerList.css';
import { Country } from 'country-state-city';
import CustomerLedgerModal from '../accounts/CustomerLedgerModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CustomerList({
    onAdd,
    customers = [],
    onNavigateToNewInvoice,
    loading = false,
    onImportExport,
    onEdit,
    onDelete,
    onArchive,
    onView
}: {
    onAdd?: () => void,
    customers?: any[],
    onNavigateToNewInvoice?: () => void,
    loading?: boolean,
    onImportExport?: () => void,
    onEdit?: (customer: any) => void,
    onDelete?: (customer: any) => void,
    onArchive?: (customer: any) => void,
    onView?: (customer: any) => void
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

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + rowsPerPage);

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
        <div className="customer-list-container">
            {/* Header */}
            <div className="customer-header">
                <h2>Customers</h2>
                <div className="header-actions">
                    <button className="btn-export" onClick={onImportExport} style={{ marginRight: '10px' }}>
                        <i className="fas fa-file-import"></i> Import / Export
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
                                <th className="checkbox-col hide-mobile">
                                    <input type="checkbox" className="custom-checkbox" />
                                </th>
                                <th>Customer <i className="fas fa-sort"></i></th>
                                <th className="hide-mobile">Phone <i className="fas fa-sort"></i></th>
                                <th>Country <i className="fas fa-sort"></i></th>
                                <th>Balance <i className="fas fa-sort"></i></th>
                                <th className="hide-mobile">Total Invoice</th>
                                <th className="hide-mobile">Created On <i className="fas fa-sort"></i></th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td className="checkbox-col hide-mobile">
                                        <input type="checkbox" className="custom-checkbox" />
                                    </td>
                                    <td>
                                        <div className="customer-cell">
                                            {customer.image_url ? (
                                                <img src={customer.image_url} alt={customer.name} className="customer-avatar" />
                                            ) : (
                                                <div className="customer-avatar" style={{
                                                    backgroundColor: getAvatarColor(customer.name),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {getInitials(customer.name)}
                                                </div>
                                            )}
                                            <div className="customer-info">
                                                <span>{customer.name}</span>
                                                <span style={{ fontSize: '0.8em', color: '#666' }}>{customer.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hide-mobile">{customer.phone}</td>
                                    <td>
                                        <div className="country-cell">
                                            <span className="show-mobile" style={{ fontWeight: 600, fontSize: '0.7rem', marginRight: '4px' }}>Country:</span>
                                            {/* <span className="flag-icon">{customer.countryCode}</span> */}
                                            {(() => {
                                                const code = customer.billing_country || customer.country;
                                                const country = Country.getCountryByCode(code);
                                                return country ? country.name : code;
                                            })()}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="show-mobile" style={{ fontWeight: 600, fontSize: '0.7rem', marginRight: '4px' }}>Balance:</span>
                                        {customer.currency} 0.00
                                    </td>
                                    <td className="hide-mobile">0</td>
                                    <td className="hide-mobile">{new Date(customer.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${(customer.status || 'active').toLowerCase()}`}>
                                            {customer.status || 'Active'}
                                            {(customer.status || 'Active') === 'Active' ? <i className="fas fa-check-circle"></i> : <i className="fas fa-times-circle"></i>}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="menu-cell">
                                            <i
                                                className={`fas fa-ellipsis-h menu-dots ${activeDropdown === customer.id ? 'active' : ''}`}
                                                onClick={(e) => toggleDropdown(customer.id, e)}
                                            ></i>
                                            {activeDropdown === customer.id && (
                                                <div className="action-menu-dropdown" ref={dropdownRef}>
                                                    <div className="menu-item" onClick={() => { setActiveDropdown(null); onView?.(customer); }}>
                                                        <i className="far fa-eye"></i> View
                                                    </div>
                                                    <div className="menu-item" onClick={() => { setActiveDropdown(null); onEdit?.(customer); }}>
                                                        <i className="far fa-edit"></i> Edit
                                                    </div>
                                                    <div className="menu-item" onClick={() => { setActiveDropdown(null); onArchive?.(customer); }}>
                                                        <i className="fas fa-archive"></i> {(customer.status || 'Active').toLowerCase() === 'archived' ? 'Unarchive' : 'Archive'}
                                                    </div>
                                                    <div className="menu-item" onClick={() => { setActiveDropdown(null); onDelete?.(customer); }} style={{ color: '#ef4444' }}>
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
                    email: selectedCustomerForLedger.email || "",
                    avatar: selectedCustomerForLedger.image_url,
                    balance: selectedCustomerForLedger.balance
                } : null}
            />
        </div >
    );
}
