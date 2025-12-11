import React, { useState } from 'react';
import './CustomerList.css';

interface Customer {
    id: number;
    name: string;
    avatar: string;
    phone: string;
    country: string;
    countryCode: string;
    balance: string;
    totalInvoice: number;
    createdOn: string;
    status: 'Active' | 'Inactive';
}

const MOCK_CUSTOMERS: Customer[] = [
    { id: 1, name: "Emily Clark", avatar: "https://i.pravatar.cc/150?u=1", phone: "+1 202-555-0198", country: "USA", countryCode: "🇺🇸", balance: "$10,000", totalInvoice: 12, createdOn: "22 Feb 2025", status: "Active" },
    { id: 2, name: "John Carter", avatar: "https://i.pravatar.cc/150?u=2", phone: "+1 305-456-7821", country: "Canada", countryCode: "🇨🇦", balance: "$25,750", totalInvoice: 6, createdOn: "07 Feb 2025", status: "Inactive" },
    { id: 3, name: "Sophia White", avatar: "https://i.pravatar.cc/150?u=3", phone: "+44 415-678-1234", country: "UK", countryCode: "🇬🇧", balance: "$50,125", totalInvoice: 3, createdOn: "30 Jan 2025", status: "Active" },
    { id: 4, name: "Michael Johnson", avatar: "https://i.pravatar.cc/150?u=4", phone: "+49 718-987-6543", country: "Germany", countryCode: "🇩🇪", balance: "$75,900", totalInvoice: 10, createdOn: "17 Jan 2025", status: "Inactive" },
    { id: 5, name: "Olivia Harris", avatar: "https://i.pravatar.cc/150?u=5", phone: "+33 909-234-5678", country: "France", countryCode: "🇫🇷", balance: "$99,999", totalInvoice: 9, createdOn: "04 Jan 2025", status: "Active" },
    { id: 6, name: "David Anderson", avatar: "https://i.pravatar.cc/150?u=6", phone: "+54 602-789-3456", country: "Argentina", countryCode: "🇦🇷", balance: "$1,20,500", totalInvoice: 12, createdOn: "09 Dec 2024", status: "Inactive" },
    { id: 7, name: "Emma Lewis", avatar: "https://i.pravatar.cc/150?u=7", phone: "+91 812-456-9087", country: "India", countryCode: "🇮🇳", balance: "$2,50,000", totalInvoice: 8, createdOn: "02 Dec 2024", status: "Active" },
    { id: 8, name: "Robert Thomas", avatar: "https://i.pravatar.cc/150?u=8", phone: "+39 214-123-4567", country: "Italy", countryCode: "🇮🇹", balance: "$5,00,750", totalInvoice: 15, createdOn: "15 Nov 2024", status: "Inactive" },
    { id: 9, name: "Isabella Scott", avatar: "https://i.pravatar.cc/150?u=9", phone: "+64 646-789-1230", country: "New Zealand", countryCode: "🇳🇿", balance: "$7,50,300", totalInvoice: 21, createdOn: "30 Nov 2024", status: "Active" },
    { id: 10, name: "Daniel Martinez", avatar: "https://i.pravatar.cc/150?u=10", phone: "+61 901-678-4321", country: "Australia", countryCode: "🇦🇺", balance: "$9,99,999", totalInvoice: 14, createdOn: "12 Oct 2024", status: "Inactive" },
];

export default function CustomerList({ onAdd }: { onAdd?: () => void }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Basic filtering logic
    const filteredCustomers = MOCK_CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.country.toLowerCase().includes(searchTerm.toLowerCase())
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
                                        <img src={customer.avatar} alt={customer.name} className="customer-avatar" />
                                        <div className="customer-info">
                                            <span>{customer.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{customer.phone}</td>
                                <td>
                                    <div className="country-cell">
                                        <span className="flag-icon">{customer.countryCode}</span>
                                        {customer.country}
                                    </div>
                                </td>
                                <td>{customer.balance}</td>
                                <td>{customer.totalInvoice}</td>
                                <td>{customer.createdOn}</td>
                                <td>
                                    <span className={`status-badge ${customer.status.toLowerCase()}`}>
                                        {customer.status}
                                        {customer.status === 'Active' ? <i className="fas fa-check-circle"></i> : <i className="fas fa-times-circle"></i>}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-action-outline">
                                            <i className="fas fa-file-invoice"></i> Invoice
                                        </button>
                                        <button className="btn-action-outline">
                                            <i className="fas fa-book"></i> Ledger
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <i className="fas fa-ellipsis-h menu-dots"></i>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </div>
    );
}
