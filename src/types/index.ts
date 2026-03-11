export interface ProductSpecifications {
    'Processor'?: string;
    'Processor Generation'?: string;
    'Processor Speed'?: string;
    'RAM'?: string;
    'RAM Type'?: string;
    'Storage'?: string;
    'Storage Type'?: string;
    'Graphics'?: string;
    'Graphics Type'?: string;
    'Graphics Storage'?: string;
    'Screen'?: string;
    'Screen Resolution'?: string;
    'Resolution Pixel'?: string;
    'Display Type'?: string;
    'Operating System'?: string;
    'Wireless Type'?: string;
    'Optical Drive'?: string;
    'Condition'?: string;
    'Model'?: string;
    'Series'?: string;
    'colors'?: string;
}

export interface Product {
    id: string | number;
    productCode: string;
    name: string;
    brand: string;
    price: number;
    originalPrice: number;
    type: string;
    images: string[];
    image: string;
    createdAt: string | Date;
    stock: number;
    description: string;
    features: string;
    badge: string;
    category: string;
    rating: number;
    reviews: number;
    specifications: ProductSpecifications;
    ramVariants?: string;
    storageVariants?: string;
}

export interface DatabaseProduct {
    id: number;
    product_code: string;
    code?: string;
    product_name: string;
    name?: string;
    brand: string;
    category: string;
    offer_price?: string | number;
    base_price?: string | number;
    price?: string | number;
    type: string;
    all_images_urls?: string;
    primary_image_url?: string;
    image_url?: string;
    image?: string;
    date_added: string;
    created_at?: string;
    stock_quantity?: string | number;
    stock?: string | number;
    quantity?: string | number;
    features: string;
    description?: string;
    about?: string;
    badge: string;
    rating: number;
    reviews: number;
    processor?: string;
    processor_gen?: string;
    processor_speed?: string;
    ram?: string;
    ram_type?: string;
    storage?: string;
    storage_type?: string;
    graphics_card?: string;
    graphics_card_type?: string;
    graphics_storage?: string;
    screen_size?: string;
    screen_resolution?: string;
    screen_resolution_pixel?: string;
    display_type?: string;
    operating_system?: string;
    wireless_type?: string;
    optical_drive?: string;
    condition_status?: string;
    model?: string;
    series?: string;
    colors?: string;
    ram_variants?: string;
    storage_variants?: string;
}

export interface ProductFormData {
    id?: number | string;
    productName: string;
    productCode?: string;
    brand?: string;
    model?: string;
    series?: string;
    category?: string;
    badge?: string;
    conditionStatus?: string;
    basePrice: number;
    offerPrice: number;
    stockQuantity: number;
    processorName?: string;
    processorGen?: string;
    processorSpeed?: string;
    ram?: string;
    ramType?: string;
    storage?: string;
    storageType?: string;
    graphicsCard?: string;
    graphicsType?: string;
    graphicsStorage?: string;
    screenSize?: string;
    screenResolution?: string;
    screenResolutionPixel?: string;
    wirelessType?: string;
    operatingSystem?: string;
    opticalDrive?: string;
    colors?: string;
    features?: string;
    primaryImageUrl?: string;
    allImagesUrls?: string | string[];
    ramVariants?: any;
    storageVariants?: any;
    type?: string;
    displayType?: string;
}

export interface ActivityLog {
    id: number;
    user: string;
    action: string;
    details: string;
    status: string;
    role: string;
    ip: string | null;
    timestamp: string;
    avatar: string | null;
}

export interface User {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    approval_status: string;
    avatar: string | null;
    created_by: string | null;
    created_at: string;
    visible_password?: string;
}

export interface Quotation {
    id: number;
    quotation_no: string;
    customer_id: number | null;
    customer_name: string;
    customer_address: string;
    customer_email: string;
    customer_phone: string;
    created_date: string;
    due_date: string;
    sub_total: number;
    discount_total: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    payment_type: string;
    status: string;
    is_taxable: boolean;
    is_discountable: boolean;
    show_terms: boolean;
    advance_received: number;
    notes: string | null;
    terms_and_conditions: string | null;
    created_at: string;
}

export interface QuotationItem {
    id: number;
    quotation_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
    product_code: string | null;
}

export interface PurchaseLot {
    id: number;
    lot_no: string;
    supplier_id: number | null;
    supplier_name: string | null;
    total_items: number;
    total_cost: number;
    currency: string;
    status: string;
    purchase_date: string;
    received_date: string | null;
    created_at: string;
    updated_at: string;
    notes?: string;
}

export interface PurchaseLotItem {
    id: number;
    lot_id: number;
    product_id: number | null;
    product_name: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    status: string;
    notes?: string;
}

export interface DropListItem {
    id: number;
    category: string;
    value: string;
    brand?: string;
    series?: string;
    model?: string;
    parent?: string;
    created_at: string;
}

export interface Invoice {
    id: number;
    invoice_no: string;
    customer_id: number | null;
    customer_name: string;
    customer_address: string;
    customer_email: string;
    customer_phone: string;
    created_date: string;
    due_date: string;
    sub_total: number;
    discount_total: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    payment_type: string;
    status: string;
    is_taxable: boolean;
    is_discountable: boolean;
    show_terms: boolean;
    advance_received: number;
    notes: string | null;
    terms_and_conditions: string | null;
    created_at: string;
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
    product_code: string | null;
}
