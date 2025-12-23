import { getProductById } from "@/lib/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductDetailContent from "../../components/ProductDetailContent";
import "./styles/product-detail.css";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface PageProps {
    params: {
        type: string;
        id: string;
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const product = await getProductById(params.id);

    if (!product) {
        return {
            title: 'Product Not Found | BizzCoHub',
        };
    }

    return {
        title: `${product.name} | BizzCoHub`,
        description: product.description || `Buy ${product.name} at BizzCoHub. High-quality ${product.type} with great prices.`,
        openGraph: {
            images: [product.image || product.images[0] || ''],
        },
    };
}

export default async function ProductDetailPage({ params }: PageProps) {
    const product = await getProductById(params.id);

    if (!product) {
        notFound();
    }

    return (
        <div className="product-detail-page">
            <div className="back-nav-container">
                <Link href="/products" className="back-to-products">
                    <i className="fas fa-arrow-left"></i> Back to Products
                </Link>
            </div>

            <ProductDetailContent product={product} />
        </div >
    );
}
