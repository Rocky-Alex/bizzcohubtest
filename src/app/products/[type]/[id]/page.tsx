import { getProductById } from "@/lib/products";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductDetailContent from "../../components/ProductDetailContent";
import "./styles/product-detail.css";
import { Metadata } from "next";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizzcohub.com';

    return {
        title: `${product.name} | BizzCoHub`,
        description: product.description || `Buy ${product.name} at BizzCoHub. High-quality ${product.type} with great prices.`,
        keywords: [product.name, product.brand, product.category, product.type, 'refurbished', 'Bizz Co Hub'].filter(Boolean),
        alternates: {
            canonical: `${baseUrl}/products/${params.type}/${params.id}`,
        },
        openGraph: {
            title: `${product.name} | BizzCoHub`,
            description: product.description || `Buy ${product.name} at BizzCoHub`,
            images: [product.image || product.images[0] || ''],
            type: 'website',
        },
    };
}

export default async function ProductDetailPage({ params }: PageProps) {
    const product = await getProductById(params.id);

    if (!product) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizzcohub.com';

    return (
        <div className="product-detail-page">
            <ProductJsonLd
                name={product.name}
                description={product.description || `High-quality ${product.type} from ${product.brand}`}
                image={product.images?.length > 0 ? product.images : [product.image]}
                sku={product.productCode || String(product.id)}
                brand={product.brand}
                price={product.price}
                priceCurrency="AED"
                availability={product.stock > 0 ? 'InStock' : 'OutOfStock'}
                condition="RefurbishedCondition"
                url={`${baseUrl}/products/${params.type}/${params.id}`}
                rating={product.rating}
                reviewCount={product.reviews}
            />
            <BreadcrumbJsonLd
                items={[
                    { name: 'Home', url: baseUrl },
                    { name: 'Products', url: `${baseUrl}/products` },
                    { name: product.category || product.type, url: `${baseUrl}/products?category=${encodeURIComponent(product.category || product.type)}` },
                    { name: product.name, url: `${baseUrl}/products/${params.type}/${params.id}` },
                ]}
            />
            <div className="back-nav-container">
                <Link href="/products" className="back-to-products">
                    <i className="fas fa-arrow-left"></i> Back to Products
                </Link>
            </div>

            <ProductDetailContent product={product} />
        </div >
    );
}

