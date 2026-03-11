"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/app/components/LoadingSpinner";

const ProductPricing = dynamic(() => import("./components/ProductPricing/ProductPricing"), { loading: () => <LoadingSpinner /> });

export default function PricingPage() {
    return <ProductPricing />;
}
