import React from "react";

interface ProductListProps {
    type: "laptop" | "accessory";
    products: any[];
    onEdit: (product: any) => void;
    onDelete: (code: string) => void;
    onClearAll: () => void;
}

export default function ProductList({
    type,
    products,
    onEdit,
    onDelete,
    onClearAll,
}: ProductListProps) {
    return (
        <div className="products-list-container">
            <div className="list-header">
                <h3>
                    <i className="fas fa-list"></i>{" "}
                    {type === "laptop" ? "Laptop Products" : "Accessories"} (
                    {products.length})
                </h3>
                <button className="btn btn-danger btn-sm" onClick={onClearAll}>
                    <i className="fas fa-trash"></i> Clear All
                </button>
            </div>
            <div className="table-responsive">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Product Details</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? (
                            products.map((product, index) => (
                                <tr key={index}>
                                    <td className="col-image">
                                        <div className="table-img-wrapper">
                                            <img
                                                src={product.images?.[0] || product.image || '/uploads/placeholder.jpg'}
                                                alt={product.name}
                                            />
                                        </div>
                                    </td>
                                    <td className="col-details">
                                        <div className="product-info-cell">
                                            <span className="product-name">{product.name}</span>
                                            <span className="product-code">{product.code || product.productCode || product.id}</span>
                                            <span className="product-meta">
                                                {product.category}
                                                {type === "laptop"
                                                    ? ` | ${product.specifications?.RAM || product.ram || ''} | ${product.specifications?.Storage || product.storage || ''}`
                                                    : ""}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="col-price">
                                        <div className="price-cell">
                                            {product.originalPrice && (
                                                <span className="price-old">AED {product.originalPrice.toLocaleString()}</span>
                                            )}
                                            <span className="price-current">AED {(product.price || 0).toLocaleString()}</span>
                                            {product.originalPrice && (
                                                <span className="discount-badge">{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="col-stock">
                                        <div className={`stock-badge ${(product.stock || 0) <= (type === "laptop" ? 5 : 10) ? "low" : "good"}`}>
                                            {product.stock || 0} units
                                        </div>
                                    </td>
                                    <td className="col-actions">
                                        <div className="actions-cell">
                                            <button
                                                className="btn-action edit"
                                                onClick={() => onEdit(product)}
                                                title="Edit"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn-action delete"
                                                onClick={() => onDelete(product.code || product.productCode || product.id)}
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="empty-table">
                                    No products added yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
