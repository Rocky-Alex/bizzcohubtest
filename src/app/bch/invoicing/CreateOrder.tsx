import React, { useState, useEffect, useMemo, useRef } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import '../styles/create-order.css';
import AddCustomerForm from '../customers/AddCustomerForm';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    price: number | string;
    image?: string;
    description?: string;
    stock?: number;
    // Granular details
    brand?: string;
    series?: string;
    model?: string;
    processor?: string;
    generation?: string;
    ram?: string;
    ssd?: string; // storage
    graphics?: string;
    acStatus?: string; // charger
}

interface CartItem extends Product {
    quantity: number;
}

// Options extracted from AddProduct.tsx
const BRAND_OPTIONS = ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Razer', 'MSI', 'Samsung', 'Sony'];
const PROCESSOR_OPTIONS = [
    'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
    'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
    'Apple M1', 'Apple M2', 'Apple M3', 'Apple M1 Pro', 'Apple M1 Max',
    'Apple M2 Pro', 'Apple M2 Max', 'Apple M3 Pro', 'Apple M3 Max'
];
const GEN_OPTIONS = ['8th Gen', '9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen', 'M1', 'M2', 'M3'];
const RAM_OPTIONS = ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB'];
const STORAGE_OPTIONS = ['256GB', '512GB', '1TB', '2TB', '4TB', '8TB'];
const GPU_RAM_OPTIONS = ['2GB', '4GB', '6GB', '8GB', '10GB', '12GB', '16GB', '24GB'];
const DISPLAY_TYPE_OPTIONS = ['Touch', 'Non-Touch', 'Bazel Touch', 'Glass Touch'];
const CHARGER_OPTIONS = ['Original Charger', 'Compatible Charger', 'No Charger'];

const GRAPHICS_OPTIONS = [
    'Integrated / Shared',
    '2GB',
    '4GB',
    '6GB',
    '8GB',
    '10GB',
    '12GB',
    '16GB',
    '20GB',
    '24GB'
];

const CONDITION_OPTIONS = [
    'Brand New',
    'Open Box',
    'Grade A',
    'Grade B',
    'Grade C',
    'Refurbished',
    'Used'
];


const CreateOrder = ({ onOrderCreated, initialData }: { onOrderCreated?: () => void, initialData?: any }) => {
    // --- State ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [orderNumber, setOrderNumber] = useState(''); // SO-Number
    const [customerName, setCustomerName] = useState(''); // Search/Input
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [productCode, setProductCode] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 4);
        return date.toISOString().split('T')[0];
    });

    // Customer Data State
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

    // Add Item Modal State
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        brand: '',
        model: '',
        series: '',
        processorName: '',
        processorGen: '',
        memorySize: '',
        storageSize: '',
        graphicsCardRam: '',
        displayType: '',
        charger: '',
        price: '',
        quantity: 1
    });

    // Product Data State
    const [existingProducts, setExistingProducts] = useState<any[]>([]);

    // --- Master Data State ---
    const [brandList, setBrandList] = useState<string[]>([]);
    const [seriesList, setSeriesList] = useState<string[]>([]);
    const [modelList, setModelList] = useState<string[]>([]);

    const [processorList, setProcessorList] = useState<string[]>([]);
    const [generationList, setGenerationList] = useState<string[]>([]);
    const [ramList, setRamList] = useState<string[]>([]);
    const [storageList, setStorageList] = useState<string[]>([]);
    const [graphicsList, setGraphicsList] = useState<string[]>([]);
    const [conditionList, setConditionList] = useState<string[]>([]);

    // Update Delivery Date when Order Date changes
    useEffect(() => {
        if (orderDate) {
            const date = new Date(orderDate);
            date.setDate(date.getDate() + 4);
            setDeliveryDate(date.toISOString().split('T')[0]);
        }
    }, [orderDate]);

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        if (isAddItemModalOpen) {
            fetchBrands();
        }
    }, [isAddItemModalOpen]);

    const fetchMasterData = async () => {
        try {
            const categories = ['Processor', 'Generation', 'RAM', 'Storage', 'Graphics', 'Condition'];
            const promises = categories.map(cat =>
                fetch(`/api/bch/inventory/droplists?category=${cat}`).then(r => r.json())
            );

            const results = await Promise.all(promises);

            // 0: Processor, 1: Generation, 2: RAM, 3: Storage, 4: Graphics, 5: Condition
            if (results[0]?.success) setProcessorList(results[0].data.map((i: any) => i.value));
            if (results[1]?.success) setGenerationList(results[1].data.map((i: any) => i.value));
            if (results[2]?.success) setRamList(results[2].data.map((i: any) => i.value));
            if (results[3]?.success) setStorageList(results[3].data.map((i: any) => i.value));
            if (results[4]?.success) setGraphicsList(results[4].data.map((i: any) => i.value));
            if (results[5]?.success) setConditionList(results[5].data.map((i: any) => i.value));

        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    };

    const fetchBrands = async () => {
        try {
            const res = await fetch('/api/bch/inventory/droplists?category=Brand');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setBrandList(data.data.map((item: any) => item.value));
                }
            }
        } catch (error) {
            console.error("Failed to fetch brands", error);
        }
    };

    // Series and Model fetching remains the same
    const fetchSeries = async (brandName: string) => {
        if (!brandName) {
            setSeriesList([]);
            return;
        }
        try {
            const res = await fetch(`/api/bch/inventory/droplists?category=Series&parent=${encodeURIComponent(brandName)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setSeriesList(data.data.map((item: any) => item.value));
                }
            }
        } catch (error) {
            console.error("Failed to fetch series", error);
        }
    };

    const fetchModels = async (seriesName: string) => {
        if (!seriesName) {
            setModelList([]);
            return;
        }
        try {
            const res = await fetch(`/api/bch/inventory/droplists?category=Model&parent=${encodeURIComponent(seriesName)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setModelList(data.data.map((item: any) => item.value));
                }
            }
        } catch (error) {
            console.error("Failed to fetch models", error);
        }
    };

    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'danger',
        singleButton: true,
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
    });

    // --- New State for Multi-Tab Product Add ---
    const [activeTab, setActiveTab] = useState<'qr' | 'lot'>('qr');
    const qrInputRef = useRef<HTMLInputElement>(null);

    // --- Confirmation Modal State ---
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingItem, setPendingItem] = useState<any>(null);

    // Lot & Model State
    const [lotOptions, setLotOptions] = useState<any[]>([]);
    const [selectedLot, setSelectedLot] = useState('');
    const [lotLoading, setLotLoading] = useState(false);

    // Model Selection State
    const [modelOptions, setModelOptions] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [lotProducts, setLotProducts] = useState<any[]>([]); // Initial products from fetch

    // Omni-Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/bch/inventory/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setSearchResults(data.results);
                    }
                }
            } catch (err) {
                console.error("Search error:", err);
            }
        }, 300);
    };

    const handleSearchResultSelect = async (result: any) => {
        setSearchQuery('');
        setSearchResults([]);

        // Handle based on type
        if (result.type === 'qc_item') {
            // Add unique QC item directly
            const newCartItem: CartItem = {
                id: Date.now(),
                name: result.label, // Product Name
                price: 0,
                image: '/placeholder.svg',
                description: `QC ID: ${result.id}, Condition: ${result.detail}`,
                stock: 1,
                quantity: 1,
                brand: result.brand,
                series: result.series, // might be undefined in search result, but acceptable
                model: result.model,
                processor: result.processor,
                generation: '', // abbreviated details
                ram: result.ram,
                ssd: result.storage,
                graphics: '',
                acStatus: 'Original Charger'
            };
            setCart(prev => [...prev, newCartItem]);
        } else if (result.type === 'product_master') {
            // Add generic product
            // Fetch full details if needed, or map from result
            // For now mapping from result assuming key fields exist, or fetch full
            const newCartItem: CartItem = {
                id: Date.now(),
                name: result.label,
                price: 0,
                image: '/placeholder.svg',
                description: result.detail,
                stock: 1,
                quantity: 1,
                brand: result.brand,
                series: '',
                model: '',
                processor: '',
                generation: '',
                ram: '',
                ssd: '',
                graphics: '',
                acStatus: 'Original Charger'
            };
            // Try to find if we have full details in existingProducts?
            // Better to re-fetch if this search result is scant.
            // For MVP, adding basic.
            setCart(prev => [...prev, newCartItem]);
        } else if (result.type === 'lot') {
            // Switch to Lot Tab and select this lot
            setActiveTab('lot');
            // Wait for tab switch?
            setTimeout(() => {
                handleLotChange(result.code); // code is lotNumber
            }, 100);
        }
    };

    useEffect(() => {
        if (activeTab === 'qr' && qrInputRef.current) {
            qrInputRef.current.focus();
        }
    }, [activeTab]);

    // Fetch Lots on Component Mount
    useEffect(() => {
        fetchLots();
    }, []);

    const fetchLots = async () => {
        try {
            // Assuming an endpoint exists or using dummy for now until backend ready
            const res = await fetch('/api/bch/purchase/lots');
            if (res.ok) {
                const data = await res.json();
                setLotOptions(data.lots || []);
            }
        } catch (error) {
            console.error("Failed to fetch lots:", error);
        }
    };

    const handleLotChange = async (lotNumber: string) => {
        setSelectedLot(lotNumber);
        setSelectedModel('');
        setModelOptions([]);
        setLotLoading(true);

        // Find lotId
        const selectedLotObj = lotOptions.find(l => l.lotNumber === lotNumber);
        if (!selectedLotObj) {
            console.error("Lot map error");
            setLotLoading(false);
            return;
        }

        try {
            // Fetch items for this lot using ID
            const res = await fetch(`/api/bch/purchase/lots/details?id=${selectedLotObj.lotId}`);
            if (res.ok) {
                const data = await res.json();
                // data.lot.items
                const items = data.lot?.items || [];
                setLotProducts(items);
                // Extract unique models
                const models = Array.from(new Set(items.map((i: any) => i.model).filter(Boolean))) as string[];
                setModelOptions(models);
            }
        } catch (err) {
            console.error("Error fetching lot details:", err);
        } finally {
            setLotLoading(false);
        }
    };

    const handleAddFromLot = () => {
        if (!selectedLot || !selectedModel) return;

        // Find a representative item for Specs (first match)
        // In real scenario, user might pick specific units, but requirement says "Model" base.
        const product = lotProducts.find(p => p.model === selectedModel);

        if (product) {
            const newCartItem: CartItem = {
                id: Date.now(),
                name: `${product.brand} ${product.series} ${product.model}`.trim(),
                price: product.unitCost || product.unit_cost || 0, // Use unit_cost/cost
                image: '/placeholder.svg',
                description: '',
                stock: 1, // Logic needed
                quantity: 1,
                // Map specs
                brand: product.brand,
                series: product.series,
                model: product.model,
                processor: product.processor,
                generation: product.processorGen || product.generation || '',
                ram: product.ram || '',
                ssd: product.storage || product.ssd || '',
                graphics: product.graphics || '',
                acStatus: 'Original Charger'
            };
            setCart(prev => [...prev, newCartItem]);
            // Optional: reset selection or keep for rapid add
        }
    };

    // --- Init ---
    // --- Init ---
    useEffect(() => {
        if (initialData) {
            // Edit Mode
            setOrderNumber(initialData.order_number);
            setCustomerName(initialData.customer_name);
            setCustomerEmail(initialData.email || '');
            setCustomerPhone(initialData.phone || '');
            setCustomerAddress(initialData.address || '');
            setCart(initialData.items || []);
            // setOrderDate(initialData.created_at.split('T')[0]); // Optional: keep original date or today
        } else {
            // Create Mode
            // Generate pseudo-random SO number
            setOrderNumber(`SO-${Math.floor(1000 + Math.random() * 9000)}`);
        }

        fetchCustomers();
        fetchProducts();
    }, [initialData]);

    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
            const res = await fetch('/api/bch/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    useEffect(() => {
        const match = customers.find(c => c.name === customerName);
        if (match) {
            setCustomerPhone(match.phone || '');
            setCustomerEmail(match.email || '');
            // Construct address from parts if needed, or use a single field if available
            const addr = match.address || match.billing_address_1 || match.shipping_address_1 || '';
            const city = match.city ? `, ${match.city}` : '';
            const country = match.country ? `, ${match.country}` : '';
            setCustomerAddress(`${addr}${city}${country}`);
        }
    }, [customerName, customers]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products'); // Simplified fetch, adjust endpoint if needed
            if (res.ok) {
                const data = await res.json();
                setExistingProducts(data.products || []);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    // --- Computed ---

    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const tax = 0; // Removed VAT
        const shipping = 0; // Removed Shipping
        const total = subtotal + tax + shipping;
        return { subtotal, tax, shipping, total };
    }, [cart]);

    // --- Handlers ---
    const handleAddItemChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string, value: string } }) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));

        // Cascade Logic
        if (name === 'brand') {
            setNewItem(prev => ({ ...prev, brand: value, series: '', model: '' }));
            fetchSeries(value);
            setSeriesList([]);
            setModelList([]);
        } else if (name === 'series') {
            setNewItem(prev => ({ ...prev, series: value, model: '' }));
            fetchModels(value);
            setModelList([]);
        }
    };

    const handleConfirmAddItem = () => {
        if (!newItem.price) {
            setModal({
                isOpen: true,
                title: 'Validation Error',
                message: 'Price is required.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        const trimProcessor = (proc: string) => {
            const match = proc.match(/i\d/i);
            return match ? match[0] : proc;
        };
        const proc = trimProcessor(newItem.processorName || '');

        // Format construction
        const parts = [
            newItem.brand,
            newItem.series,
            newItem.model,
            proc,
            newItem.processorGen,
            newItem.memorySize
        ].filter(Boolean).join(' ');

        const storage = newItem.storageSize ? `/ ${newItem.storageSize}` : '';

        const extraParts = [
            newItem.graphicsCardRam,
            newItem.displayType,
            newItem.charger ? `with ${newItem.charger}` : ''
        ].filter(Boolean).join(' ');

        const fullName = `${parts} ${storage} ${extraParts}`.replace(/\s+/g, ' ').trim();

        const product: CartItem = {
            id: Date.now(),
            name: fullName,
            description: '',
            price: newItem.price,
            image: '/placeholder.svg',
            quantity: Number(newItem.quantity) || 1,
            brand: newItem.brand,
            series: newItem.series,
            model: newItem.model,
            processor: newItem.processorName,
            generation: newItem.processorGen,
            ram: newItem.memorySize,
            ssd: newItem.storageSize,
            graphics: newItem.graphicsCardRam,
            acStatus: newItem.charger
        };

        setCart(prev => [...prev, product]);

        setNewItem({
            brand: '', model: '', series: '', processorName: '', processorGen: '',
            memorySize: '', storageSize: '', graphicsCardRam: '', displayType: '', charger: '',
            price: '', quantity: 1
        });
        setIsAddItemModalOpen(false);
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleCreateCustomer = async (data: any) => {
        try {
            let avatarUrl = null;
            if (data.image) {
                const formData = new FormData();
                formData.append('file', data.image);
                formData.append('folder', 'Profile_Pictures/Customers');
                formData.append('fileName', data.image.name.replace(/\s+/g, '_'));

                const uploadRes = await fetch('/api/imagekit/upload', {
                    method: 'POST',
                    body: formData
                });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    avatarUrl = uploadData.url;
                }
            }

            const payload = {
                ...data,
                avatar: avatarUrl
            };

            const res = await fetch('/api/bch/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                setModal({
                    isOpen: true,
                    title: 'Success',
                    message: 'Customer created successfully!',
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setModal(prev => ({ ...prev, isOpen: false }));
                        setIsAddCustomerModalOpen(false);
                        fetchCustomers(); // Refresh list

                        // Trigger global update
                        window.dispatchEvent(new Event('dashboard-updated'));
                        localStorage.setItem('dashboardLastUpdated', Date.now().toString());

                        if (result.customer && result.customer.name) {
                            setCustomerName(result.customer.name);
                        }
                    }
                });
            } else {
                const err = await res.json();
                setModal({
                    isOpen: true,
                    title: 'Error',
                    message: `Failed to create customer: ${err.error}`,
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error("Error creating customer:", error);
            setModal({
                isOpen: true,
                title: 'Error',
                message: "An error occurred while creating the customer.",
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        }
    };

    // --- Editing State ---
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const handleAddProductByCode = async () => {
        if (!productCode) return;
        const normalizedInput = productCode.trim().toLowerCase();

        // 1. Try Local Search (Generic Products)
        let product = existingProducts.find(p => {
            const pCode = (p.productCode || '').toString().toLowerCase();
            const pId = String(p.id).toLowerCase();
            return pCode === normalizedInput || pId === normalizedInput;
        });

        if (product) {
            addToCartAsGeneric(product);
            setProductCode('');
            return;
        }

        console.log(`Product ${normalizedInput} not found locally, checking QC & Server...`);

        // 2. Try QC Inventory (Unique Items) - PRIMARY for used items
        try {
            const res = await fetch(`/api/bch/inventory/qc?sku=${encodeURIComponent(normalizedInput)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data && data.data.length > 0) {
                    const qcItem = data.data[0]; // Take the first match

                    const newItemObj = {
                        id: Date.now(),
                        name: qcItem.product_name || `${qcItem.brand} ${qcItem.model}`,
                        brand: qcItem.brand || '',
                        series: qcItem.series || '',
                        model: qcItem.model || '',
                        processor: qcItem.processor || '',
                        generation: qcItem.processor_gen || '',
                        ram: qcItem.ram || '',
                        ssd: qcItem.storage || '',
                        graphics: qcItem.graphics || '',
                        condition: qcItem.condition_status || '',
                        acStatus: 'Original Charger',
                        quantity: 1,
                        price: 0,
                        image: '/placeholder.svg'
                    };

                    // Add directly to cart
                    setCart(prev => [...prev, newItemObj]);
                    setProductCode('');
                    toast.success("Item added! Click 'Edit' in table to change specs.");
                    return;
                }
            }
        } catch (err) {
            console.error("Error fetching QC item:", err);
        }

        // 3. Fallback to Server Generic Product Search
        try {
            const res = await fetch(`/api/products?code=${encodeURIComponent(normalizedInput)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.product) {
                    setExistingProducts(prev => [...prev, data.product]); // Cache it
                    addToCartAsGeneric(data.product);
                    setProductCode('');
                    return;
                }
            }
        } catch (err) {
            console.error("Error fetching product by code:", err);
        }

        // Not Found
        console.warn(`Product not found for code: "${productCode}" (normalized: "${normalizedInput}")`);
        setModal({
            isOpen: true,
            title: 'Product Not Found',
            message: `The product code "${productCode}" does not exist in Inventory or Product Catalog.`,
            type: 'danger',
            singleButton: true,
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
        });
        setProductCode('');
    };

    const handleEditItem = (index: number) => {
        setEditingIndex(index);
        setPendingItem({ ...cart[index] });
        setIsConfirmModalOpen(true);
    };

    const handleUpdateItem = () => {
        if (editingIndex === null || !pendingItem) return;

        setCart(prev => {
            const newCart = [...prev];
            newCart[editingIndex] = pendingItem;
            return newCart;
        });

        setIsConfirmModalOpen(false);
        setPendingItem(null);
        setEditingIndex(null);
        toast.success("Item updated successfully");
    };

    const addToCartAsGeneric = (product: any) => {
        const newCartItem: CartItem = {
            id: Date.now(),
            name: product.name,
            price: product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg',
            description: product.description || '',
            stock: product.stock,
            quantity: 1,
            // Map specs
            brand: product.brand,
            series: product.specifications?.Series,
            model: product.specifications?.Model,
            processor: product.specifications?.Processor,
            generation: product.specifications?.['Processor Generation'],
            ram: product.specifications?.RAM,
            ssd: product.specifications?.Storage,
            graphics: product.specifications?.Graphics,
            acStatus: product.specifications?.['AC Status'] || 'Original Charger'
        };
        setCart(prev => [...prev, newCartItem]);
        setProductCode('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            setModal({
                isOpen: true,
                title: 'Cart Empty',
                message: 'Please add at least one item to the order.',
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }
        setIsSubmitting(true);
        try {
            // Simplified Payload
            const payload = {
                orderNumber,
                customer: { firstName: customerName.split(' ')[0] || 'Guest', lastName: customerName.split(' ')[1] || '' }, // Basic parse
                items: cart,
                dates: { order: orderDate, delivery: deliveryDate },
                totals
            };

            const method = initialData ? 'PUT' : 'POST';
            const body = initialData ? {
                id: initialData.id,
                firstName: payload.customer.firstName,
                lastName: payload.customer.lastName,
                email: customerEmail || 'manual@entry.com',
                phone: customerPhone,
                address: customerAddress,
                items: cart,
                subtotal: totals.subtotal,
                tax: totals.tax,
                shipping: totals.shipping,
                total: totals.total,
                status: initialData.status // Keep existing status
            } : {
                firstName: payload.customer.firstName,
                lastName: payload.customer.lastName,
                email: customerEmail || 'manual@entry.com', // Placeholder or add field
                phone: customerPhone,
                address: customerAddress,
                items: cart,
                subtotal: totals.subtotal,
                tax: totals.tax,
                shipping: totals.shipping,
                total: totals.total,
                status: 'Pending'
            };

            const response = await fetch('/api/bch/orders', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setModal({
                    isOpen: true,
                    title: 'Success',
                    message: initialData ? "Order Updated Successfully" : "Order Created Successfully",
                    type: 'success',
                    singleButton: true,
                    onConfirm: () => {
                        setModal(prev => ({ ...prev, isOpen: false }));
                        setCart([]);
                        setCustomerName('');
                        setCustomerPhone('');
                        setCustomerEmail('');
                        setCustomerAddress('');
                        if (onOrderCreated) onOrderCreated();

                        // Trigger global update
                        window.dispatchEvent(new Event('dashboard-updated'));
                        localStorage.setItem('dashboardLastUpdated', Date.now().toString());
                    }
                });
            } else {
                setModal({
                    isOpen: true,
                    title: 'Error',
                    message: "Failed to save order",
                    type: 'danger',
                    singleButton: true,
                    onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        } catch (error) {
            console.error(error);
            setModal({
                isOpen: true,
                title: 'Error',
                message: "An unexpected error occurred while saving the order.",
                type: 'danger',
                singleButton: true,
                onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="co-page-container">
            {/* Header Section */}
            <div className="co-header">
                <div>
                    <h1 className="co-title">{initialData ? 'Edit Order' : 'Create New Order'}</h1>
                    <p className="co-subtitle">{initialData ? `Editing Order #${initialData.order_number}` : 'Manually enter details to create an order for a customer.'}</p>
                </div>
                {/* SO Number Hidden */}
            </div>

            <form onSubmit={handleSubmit} className="co-form">
                {/* Top Controls: Customer & Dates */}
                <div className="co-section-grid">
                    {/* Customer Info Card */}
                    <div className="co-card customer-card">
                        <div className="card-header">
                            <h3><i className="fas fa-user"></i> Customer Details</h3>
                        </div>
                        <div className="card-body">
                            <div className="form-grid">
                                <div className="co-control-group full-width">
                                    <label>Customer Name</label>
                                    <div className="input-with-button">
                                        <SearchableDropdown
                                            name="customer_lookup_field"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            options={customers.map(c => c.name)}
                                            placeholder="Search or Enter Name..."
                                        />
                                        <button type="button" className="btn-add-customer" onClick={() => setIsAddCustomerModalOpen(true)}>Add</button>
                                    </div>
                                </div>
                                <div className="co-control-group">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="co-input"
                                        placeholder="Phone"
                                    />
                                </div>
                                <div className="co-control-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="co-input"
                                        placeholder="Email"
                                    />
                                </div>
                                <div className="co-control-group full-width">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        className="co-input"
                                        placeholder="Address"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Dates Card */}
                    <div className="co-card dates-card">
                        <div className="card-header">
                            <h3><i className="fas fa-calendar-alt"></i> Order Details</h3>
                        </div>
                        <div className="card-body">
                            <div className="co-dates-row">
                                <div className="co-control-group">
                                    <label>Order Date</label>
                                    <input
                                        type="date"
                                        lang="en-GB"
                                        value={orderDate}
                                        onChange={(e) => setOrderDate(e.target.value)}
                                        className="co-input"
                                    />
                                </div>
                                <div className="co-control-group">
                                    <label>Delivery Date</label>
                                    <input
                                        type="date"
                                        lang="en-GB"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className="co-input"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Addition Section */}
                <div className="co-product-section" style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div className="co-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <button
                            type="button"
                            className={`co-tab ${activeTab === 'qr' ? 'active' : ''}`}
                            onClick={() => setActiveTab('qr')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: 'none',
                                background: 'transparent',
                                borderBottom: activeTab === 'qr' ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === 'qr' ? '#3b82f6' : '#64748b',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            <i className="fas fa-qrcode" style={{ marginRight: '0.5rem' }}></i> Scan QR
                        </button>
                        <button
                            type="button"
                            className={`co-tab ${activeTab === 'lot' ? 'active' : ''}`}
                            onClick={() => setActiveTab('lot')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: 'none',
                                background: 'transparent',
                                borderBottom: activeTab === 'lot' ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === 'lot' ? '#3b82f6' : '#64748b',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            <i className="fas fa-layer-group" style={{ marginRight: '0.5rem' }}></i> By Lot No
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="co-tab-content" style={{ minHeight: '120px' }}>
                        {/* QR SCAN MODE */}
                        {activeTab === 'qr' && (
                            <div className="co-tab-pane" style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div className="co-control-group full-width" style={{ maxWidth: '600px', margin: '0 auto' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
                                        Scan Product QR Code / Barcode
                                    </label>
                                    <div className="input-with-button" style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            ref={qrInputRef}
                                            type="text"
                                            value={productCode}
                                            onChange={(e) => setProductCode(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddProductByCode();
                                                }
                                            }}
                                            className="co-input"
                                            placeholder="Click here and scan..."
                                            style={{
                                                fontSize: '1.2rem',
                                                padding: '1rem',
                                                textAlign: 'center',
                                                letterSpacing: '0.05em',
                                                border: '2px dashed #cbd5e1',
                                                borderRadius: '8px'
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="btn-add-customer"
                                            onClick={handleAddProductByCode}
                                            style={{ padding: '0 2rem', fontSize: '1rem' }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        <i className="fas fa-info-circle"></i> Scanner should be configured to append 'Enter' after scan.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* LOT SELECTION MODE */}
                        {activeTab === 'lot' && (
                            <div className="co-tab-pane" style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div className="co-lot-grid">
                                    <div className="co-control-group">
                                        <label>Select Lot Number</label>
                                        <SearchableDropdown
                                            name="lot_selection"
                                            value={selectedLot}
                                            onChange={(e) => handleLotChange(e.target.value)}
                                            options={lotOptions.map(l => l.lotNumber)}
                                            placeholder="Choose Lot..."
                                        />
                                    </div>
                                    <div className="co-control-group">
                                        <label>Select Model</label>
                                        <SearchableDropdown
                                            name="model_selection"
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            options={modelOptions}
                                            placeholder={!selectedLot ? "Select Lot first" : "Choose Model..."}
                                            disabled={!selectedLot}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-add-customer"
                                        onClick={() => {
                                            if (!selectedLot || !selectedModel) return;

                                            // Create pending item from selection
                                            const newItemObj = {
                                                id: Date.now(),
                                                name: `${selectedLot} - ${selectedModel}`,
                                                brand: '',
                                                series: '',
                                                model: selectedModel,
                                                processor: '',
                                                generation: '',
                                                ram: '',
                                                ssd: '',
                                                graphics: '',
                                                condition: '',
                                                acStatus: 'Original Charger',
                                                quantity: 1,
                                                price: 0,
                                                image: '/placeholder.svg'
                                            };

                                            setCart(prev => [...prev, newItemObj]);
                                            toast.success("Item added! Click 'Edit' in table to change specs.");
                                        }}
                                        disabled={!selectedLot || !selectedModel}
                                    >
                                        Add
                                    </button>
                                </div>
                                {lotLoading && <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Loading lot details...</p>}
                            </div>
                        )}


                    </div>


                </div>

                {/* Items Table */}
                <div className="co-table-container">
                    <table className="co-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }} className="hide-mobile">No</th>
                                <th>Product</th>
                                <th className="hide-mobile">Processor</th>
                                <th className="hide-mobile">Generation</th>
                                <th className="hide-mobile">RAM</th>
                                <th className="hide-mobile">SSD</th>
                                <th className="hide-mobile">Graphics</th>
                                <th>AC Status</th>
                                <th style={{ width: '80px' }}>Qty</th>
                                <th style={{ width: '100px' }}>Price</th>
                                <th style={{ width: '80px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                        No items added yet. Use the tabs above to add products.
                                    </td>
                                </tr>
                            ) : (
                                cart.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="hide-mobile">{String(index + 1).padStart(2, '0')}</td>
                                        <td>
                                            <div className="co-item-cell">
                                                <img src={item.image || '/placeholder.svg'} alt="" className="co-item-thumb" />
                                                <div className="co-item-info">
                                                    <span className="name">{item.brand} {item.series} {item.model}</span>
                                                    <span className="code" style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.name}</span>
                                                    {/* Mobile Only Spec Summary */}
                                                    <div className="mobile-spec-summary" style={{ display: 'none', fontSize: '0.7rem', color: '#94a3b8', gap: '4px', marginTop: '2px' }}>
                                                        <span className="show-mobile">{item.processor} {item.generation} • {item.ram} • {item.ssd}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hide-mobile">{item.processor}</td>
                                        <td className="hide-mobile">{item.generation}</td>
                                        <td className="hide-mobile">{item.ram}</td>
                                        <td className="hide-mobile">{item.ssd}</td>
                                        <td className="hide-mobile">{item.graphics}</td>
                                        <td>
                                            <select
                                                value={item.acStatus || 'Original Charger'}
                                                onChange={(e) => {
                                                    const updatedCart = [...cart];
                                                    updatedCart[index].acStatus = e.target.value;
                                                    setCart(updatedCart);
                                                }}
                                                className="co-table-select"
                                                style={{ padding: '0.2rem', fontSize: '0.85rem', width: '100%' }}
                                            >
                                                {CHARGER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <div className="co-qty-control">
                                                <button type="button" onClick={() => updateQty(item.id, -1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button type="button" onClick={() => updateQty(item.id, 1)}>+</button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="show-mobile" style={{ fontWeight: 600, fontSize: '0.75rem', marginRight: '4px' }}>Price:</span>
                                            AED {item.price}
                                        </td>
                                        <td style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleEditItem(index)}
                                                className="btn-icon"
                                                title="Edit Item"
                                                style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-icon delete"
                                                onClick={() => removeItem(item.id)}
                                                title="Remove Item"
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Manual Add Item Trigger (Fallback) */}
                    <div className="co-add-row-trigger">
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginRight: '1rem' }}>
                            Need to add something manually?
                        </span>
                        <button type="button" className="btn-add-item" onClick={() => setIsAddItemModalOpen(true)}>
                            Manual Entry +
                        </button>
                    </div>
                </div >

                {/* Summary & Actions - Bottom */}
                < div className="co-footer" >
                    <div className="co-totals">
                        <div className="msg">
                            {/* Optional Note field could go here */}
                        </div>
                        <div className="totals-box">
                            {/* Subtotal removed */}
                            {/* Tax removed */}
                            {/* Shipping removed */}
                            <div className="t-row grand"><span>Total:</span> <span>AED {totals.total.toLocaleString()}</span></div>
                            <button
                                type="submit"
                                className="btn-submit-order"
                                disabled={isSubmitting}
                                style={{ width: '100%', marginTop: '1.5rem' }}
                            >
                                create order
                            </button>
                        </div>
                    </div>
                </div >

            </form >

            {/* --- Modal Overlay --- */}
            {
                isAddItemModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content add-item-modal">
                            <div className="modal-header">
                                <h3>Add Item</h3>
                                <button type="button" className="close-btn" onClick={() => setIsAddItemModalOpen(false)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div className="ai-grid">
                                    {/* Left Column */}
                                    <div className="ai-col">
                                        <div className="ai-group">
                                            <label>Brand</label>
                                            <SearchableDropdown
                                                name="brand"
                                                value={newItem.brand}
                                                onChange={handleAddItemChange as any}
                                                options={brandList}
                                                placeholder="Select Brand..."
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Series</label>
                                            <SearchableDropdown
                                                name="series"
                                                value={newItem.series}
                                                onChange={handleAddItemChange as any}
                                                options={seriesList}
                                                placeholder={!newItem.brand ? "Select Brand first" : "Select Series..."}
                                                disabled={!newItem.brand}
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Model</label>
                                            <SearchableDropdown
                                                name="model"
                                                value={newItem.model}
                                                onChange={handleAddItemChange as any}
                                                options={modelList}
                                                placeholder={!newItem.series ? "Select Series first" : "Select Model..."}
                                                disabled={!newItem.series}
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Processor Name</label>
                                            <SearchableDropdown
                                                name="processorName"
                                                value={newItem.processorName}
                                                onChange={handleAddItemChange as any}
                                                options={PROCESSOR_OPTIONS}
                                                placeholder="Processor Name"
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Processor Generation</label>
                                            <SearchableDropdown
                                                name="processorGen"
                                                value={newItem.processorGen}
                                                onChange={handleAddItemChange as any}
                                                options={GEN_OPTIONS}
                                                placeholder="Processor Generation"
                                            />
                                        </div>
                                    </div>
                                    {/* Right Column */}
                                    <div className="ai-col">
                                        <div className="ai-group">
                                            <label>Memory Size</label>
                                            <SearchableDropdown
                                                name="memorySize"
                                                value={newItem.memorySize}
                                                onChange={handleAddItemChange as any}
                                                options={RAM_OPTIONS}
                                                placeholder="Memory Size"
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Storage Size</label>
                                            <SearchableDropdown
                                                name="storageSize"
                                                value={newItem.storageSize}
                                                onChange={handleAddItemChange as any}
                                                options={STORAGE_OPTIONS}
                                                placeholder="Storage Size"
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Graphics Card Ram Size</label>
                                            <SearchableDropdown
                                                name="graphicsCardRam"
                                                value={newItem.graphicsCardRam}
                                                onChange={handleAddItemChange as any}
                                                options={GPU_RAM_OPTIONS}
                                                placeholder="Graphics Card Ram Size"
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Display Type</label>
                                            <SearchableDropdown
                                                name="displayType"
                                                value={newItem.displayType}
                                                onChange={handleAddItemChange as any}
                                                options={DISPLAY_TYPE_OPTIONS}
                                                placeholder="Display Type"
                                            />
                                        </div>
                                        <div className="ai-group">
                                            <label>Charger</label>
                                            <SearchableDropdown
                                                name="charger"
                                                value={newItem.charger}
                                                onChange={handleAddItemChange as any}
                                                options={CHARGER_OPTIONS}
                                                placeholder="Charger"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Price & Qty Row (Required for Order) */}
                                <div className="ai-footer-row">
                                    <div className="ai-group" style={{ flex: 1 }}>
                                        <label>Price (AED) *</label>
                                        <input type="number" name="price" value={newItem.price} onChange={handleAddItemChange} className="co-input" placeholder="0.00" required />
                                    </div>
                                    <div className="ai-group" style={{ width: '100px' }}>
                                        <label>Qty</label>
                                        <input type="number" name="quantity" value={newItem.quantity} onChange={handleAddItemChange} className="co-input" min="1" />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setIsAddItemModalOpen(false)}>Cancel</button>
                                    <button type="button" className="btn-confirm" onClick={handleConfirmAddItem}>Add to Order</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- Add Customer Modal --- */}
            {
                isAddCustomerModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '800px', width: '100%', padding: '0' }}>
                            <AddCustomerForm
                                onCancel={() => setIsAddCustomerModalOpen(false)}
                                onSubmit={handleCreateCustomer}
                            />
                        </div>
                    </div>
                )
            }

            {/* --- Item Confirmation Modal --- */}
            {isConfirmModalOpen && pendingItem && (
                <div className="ai-modal-overlay">
                    <div className="ai-modal-content">
                        <div className="ai-header">
                            <h2>Edit Item Details</h2>
                            <button className="ai-close-btn" onClick={() => setIsConfirmModalOpen(false)}>&times;</button>
                        </div>
                        <div className="ai-body">
                            <div className="ai-grid">
                                <div className="ai-col">
                                    <div className="ai-group">
                                        <label>Product Name</label>
                                        <input
                                            className="co-input"
                                            value={pendingItem.name}
                                            onChange={(e) => setPendingItem({ ...pendingItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Processor</label>
                                        <SearchableDropdown
                                            name="processor"
                                            value={pendingItem.processor}
                                            onChange={(e) => setPendingItem({ ...pendingItem, processor: e.target.value })}
                                            options={processorList.length > 0 ? processorList : PROCESSOR_OPTIONS}
                                            placeholder="Select Processor"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Generation</label>
                                        <SearchableDropdown
                                            name="generation"
                                            value={pendingItem.generation}
                                            onChange={(e) => setPendingItem({ ...pendingItem, generation: e.target.value })}
                                            options={generationList.length > 0 ? generationList : GEN_OPTIONS}
                                            placeholder="Select Generation"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>RAM</label>
                                        <SearchableDropdown
                                            name="ram"
                                            value={pendingItem.ram}
                                            onChange={(e) => setPendingItem({ ...pendingItem, ram: e.target.value })}
                                            options={ramList.length > 0 ? ramList : RAM_OPTIONS}
                                            placeholder="Select RAM"
                                        />
                                    </div>
                                </div>
                                <div className="ai-col">
                                    <div className="ai-group">
                                        <label>SSD/Storage</label>
                                        <SearchableDropdown
                                            name="ssd"
                                            value={pendingItem.ssd}
                                            onChange={(e) => setPendingItem({ ...pendingItem, ssd: e.target.value })}
                                            options={storageList.length > 0 ? storageList : STORAGE_OPTIONS}
                                            placeholder="Select Storage"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Graphics</label>
                                        <SearchableDropdown
                                            name="graphics"
                                            value={pendingItem.graphics}
                                            onChange={(e) => setPendingItem({ ...pendingItem, graphics: e.target.value })}
                                            options={graphicsList.length > 0 ? graphicsList : GRAPHICS_OPTIONS}
                                            placeholder="Select Graphics..."
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Charger / AC</label>
                                        <SearchableDropdown
                                            name="acStatus"
                                            value={pendingItem.acStatus}
                                            onChange={(e) => setPendingItem({ ...pendingItem, acStatus: e.target.value })}
                                            options={CHARGER_OPTIONS}
                                            placeholder="Select Charger Status"
                                        />
                                    </div>
                                    <div className="ai-group">
                                        <label>Condition</label>
                                        <SearchableDropdown
                                            name="condition"
                                            value={pendingItem.condition}
                                            onChange={(e) => setPendingItem({ ...pendingItem, condition: e.target.value })}
                                            options={conditionList.length > 0 ? conditionList : CONDITION_OPTIONS}
                                            placeholder="Select Condition..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="ai-footer-row">
                                <div className="ai-group" style={{ flex: 1 }}>
                                    <label>Price (AED)</label>
                                    <input
                                        type="number"
                                        className="co-input"
                                        value={pendingItem.price}
                                        onChange={(e) => setPendingItem({ ...pendingItem, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="ai-group" style={{ width: '100px' }}>
                                    <label>Qty</label>
                                    <input
                                        type="number"
                                        className="co-input"
                                        value={pendingItem.quantity}
                                        onChange={(e) => setPendingItem({ ...pendingItem, quantity: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setIsConfirmModalOpen(false)}>Cancel</button>
                                <button
                                    className="btn-confirm"
                                    onClick={handleUpdateItem}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                singleButton={modal.singleButton}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
                confirmText="OK"
            />
        </div >
    );
};

export default CreateOrder;
