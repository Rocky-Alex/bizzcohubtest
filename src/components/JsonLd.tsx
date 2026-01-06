import React from 'react';

// Organization Schema - for company information
interface OrganizationSchemaProps {
    name?: string;
    url?: string;
    logo?: string;
    description?: string;
    contactPoint?: {
        telephone: string;
        contactType: string;
        areaServed?: string[];
    };
    sameAs?: string[];
}

export function OrganizationJsonLd({
    name = 'Bizz Co Hub',
    url = 'https://bizzcohub.com',
    logo = 'https://bizzcohub.com/icon/websiteicon.png',
    description = 'Premier destination for laptop and computer repairing, refurbishing, wholesale and retail, accessories sales & web design services.',
    contactPoint = {
        telephone: '+971567064457',
        contactType: 'customer service',
        areaServed: ['AE', 'IN', 'QA', 'VN'],
    },
    sameAs = [],
}: OrganizationSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        logo,
        description,
        contactPoint: {
            '@type': 'ContactPoint',
            ...contactPoint,
        },
        sameAs,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// WebSite Schema - for site search functionality
interface WebSiteSchemaProps {
    name?: string;
    url?: string;
    searchUrl?: string;
}

export function WebSiteJsonLd({
    name = 'Bizz Co Hub',
    url = 'https://bizzcohub.com',
    searchUrl = 'https://bizzcohub.com/products?search={search_term_string}',
}: WebSiteSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name,
        url,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: searchUrl,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// LocalBusiness Schema - for physical location
interface LocalBusinessSchemaProps {
    name?: string;
    image?: string;
    telephone?: string;
    email?: string;
    address?: {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
    };
    geo?: {
        latitude: number;
        longitude: number;
    };
    openingHours?: string[];
    priceRange?: string;
}

export function LocalBusinessJsonLd({
    name = 'Bizz Co Hub',
    image = 'https://bizzcohub.com/icon/websiteicon.png',
    telephone = '+971567064457',
    email = 'support@bizzcohub.com',
    address = {
        streetAddress: 'Dubai',
        addressLocality: 'Dubai',
        addressRegion: 'Dubai',
        addressCountry: 'AE',
    },
    geo,
    openingHours = ['Mo-Fr 09:00-18:00', 'Sa 09:00-14:00'],
    priceRange = '$$',
}: LocalBusinessSchemaProps) {
    const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name,
        image,
        telephone,
        email,
        address: {
            '@type': 'PostalAddress',
            ...address,
        },
        openingHoursSpecification: openingHours.map((hours) => {
            const [days, time] = hours.split(' ');
            const [opens, closes] = time.split('-');
            return {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: days.split('-').map(d => {
                    const dayMap: Record<string, string> = {
                        'Mo': 'Monday', 'Tu': 'Tuesday', 'We': 'Wednesday',
                        'Th': 'Thursday', 'Fr': 'Friday', 'Sa': 'Saturday', 'Su': 'Sunday'
                    };
                    return dayMap[d] || d;
                }),
                opens,
                closes,
            };
        }),
        priceRange,
    };

    if (geo) {
        schema.geo = {
            '@type': 'GeoCoordinates',
            latitude: geo.latitude,
            longitude: geo.longitude,
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// Product Schema - for product pages
interface ProductSchemaProps {
    name: string;
    description: string;
    image: string | string[];
    sku?: string;
    brand?: string;
    price: number;
    priceCurrency?: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    condition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
    url?: string;
    rating?: number;
    reviewCount?: number;
}

export function ProductJsonLd({
    name,
    description,
    image,
    sku,
    brand,
    price,
    priceCurrency = 'AED',
    availability = 'InStock',
    condition = 'RefurbishedCondition',
    url,
    rating,
    reviewCount,
}: ProductSchemaProps) {
    const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        image: Array.isArray(image) ? image : [image],
        offers: {
            '@type': 'Offer',
            price,
            priceCurrency,
            availability: `https://schema.org/${availability}`,
            itemCondition: `https://schema.org/${condition}`,
        },
    };

    if (sku) schema.sku = sku;
    if (brand) {
        schema.brand = {
            '@type': 'Brand',
            name: brand,
        };
    }
    if (url) schema.url = url;

    if (rating && reviewCount) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: rating,
            reviewCount,
        };
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// BreadcrumbList Schema - for breadcrumb navigation
interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbSchemaProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
