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
            <div className="products-list">
                {products.length > 0 ? (
                    products.map((product, index) => (
                        <div key={index} className="product-item">
                            <img src={product.image} alt={product.name} />
                            <div className="product-item-info">
                                <h4>{product.name}</h4>
                                <p className="code">{product.code}</p>
                                <p>
                                    {product.category}
                                    {type === "laptop"
                                        ? ` | ${product.ram} | ${product.storage}`
                                        : ""}
                                </p>
                                <div className="price-info">
                                    <span className="old-price">
                                        AED {(product.actualPrice || 0).toLocaleString("en-IN")}
                                    </span>
                                    <span className="new-price">
                                        AED {(product.offerPrice || 0).toLocaleString("en-IN")}
                                    </span>
                                    <span className="discount">{product.discount}% OFF</span>
                                </div>
                                <p
                                    className={`stock ${product.quantity <= (type === "laptop" ? 5 : 10)
                                        ? "low-stock"
                                        : ""
                                        }`}
                                >
                                    Stock: {product.quantity}{" "}
                                    {product.quantity <= (type === "laptop" ? 5 : 10) ? "⚠️" : ""}
                                </p>
                            </div>
                            <div className="product-actions">
                                <button
                                    className="btn-icon btn-edit"
                                    onClick={() => onEdit(product)}
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button
                                    className="btn-icon btn-delete"
                                    onClick={() => onDelete(product.code)}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="empty-text">No products added yet.</p>
                )}
            </div>
        </div>
    );
}
