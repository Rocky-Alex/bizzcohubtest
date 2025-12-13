# Add Product Guide: Laptops vs. Accessories

This comparison matrix details the specific form fields and functionalities available in the **Add Laptop** (System) and **Add Accessory** modes within the Bizzcohub Admin Dashboard.

## Detailed Comparison Matrix

| Section | Field / Component | Add Laptop (System) | Add Accessory | Data Type / Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Header Control** | **Mode Toggle Switch** | **Selected** (Active) | **Selected** (Active) | Toggles the entire form layout. |
| **Basic Info** | **Product Name** | ✅ Visible | ✅ Visible | Required. Main display name. |
| | **Product Code (SKU)** | ✅ Visible | ✅ Visible | Unique identifier. |
| | **Brand** | ✅ Visible | ✅ Visible | dropdown (e.g., Apple, Dell, Logitech). |
| | **Category** | ✅ Visible | ✅ Visible | dropdown (e.g., Laptops, Keyboards). |
| | **Badge** | ✅ Visible | ✅ Visible | Optional (e.g., New Arrival, Best Seller). |
| | **Condition** | ✅ Visible | ✅ Visible | New, Used, Refurbished. |
| **Pricing & Stock** | **Base Price (AED)** | ✅ Visible | ✅ Visible | Original price before discount. |
| | **Offer Price (AED)** | ✅ Visible | ✅ Visible | Selling price. |
| | **Discount %** | ✅ Auto-calc | ✅ Auto-calc | Read-only calculation. |
| | **Stock Quantity** | ✅ Visible | ✅ Visible | Number of units available. |
| **Media** | **Image Upload** | ✅ Visible | ✅ Visible | Supports multiple images (drag & drop). |
| | **Image Preview** | ✅ Visible (Grid) | ✅ Visible (Grid) | Shows thumbnails with "Remove" option. |
| **Description** | **Key Features** | ✅ Visible | ✅ Visible | Rich text or plain text description area. |
| **Tech Specs** | **Processor (CPU)** | ✅ **Visible** | ❌ *Hidden* | Selects CPU (e.g., Intel Core i7, M3). |
| | **RAM (Included)** | ✅ **Visible** | ❌ *Hidden* | Base RAM size (e.g., 16GB). |
| | **Storage (Included)**| ✅ **Visible** | ❌ *Hidden* | Base Storage size (e.g., 512GB SSD). |
| | **Graphics Card** | ✅ **Visible** | ❌ *Hidden* | GPU Name (e.g., RTX 4060). |
| | **Graphics VRAM** | ✅ **Visible** | ❌ *Hidden* | GPU Memory size (e.g., 8GB). |
| | **Screen Size** | ✅ **Visible** | ❌ *Hidden* | Display dimension (e.g., 14-inch). |
| | **Colors** | ✅ **Visible** | ❌ *Hidden* | Comma-separated list (e.g., Silver, Grey). |
| **Variants** | **RAM Variants** | ✅ **Interactive** | ❌ *Hidden* | Add/Remove rows for upsell upgrade options. |
| | - Size & Type | dropdown | N/A | e.g., "32GB", "DDR5". |
| | - Variant Price | Input (AED) | N/A | Additional cost for this specific upgrade. |
| | **Storage Variants** | ✅ **Interactive** | ❌ *Hidden* | Add/Remove rows for upsell upgrade options. |
| | - Size & Type | dropdown | N/A | e.g., "2TB", "NVMe SSD". |
| | - Variant Price | Input (AED) | N/A | Additional cost for this specific upgrade. |
| **Actions** | **Clear Form** | ✅ Enabled | ✅ Enabled | Resets all fields & sets mode to Laptop. |
| | **Save Product** | ✅ Enabled | ✅ Enabled | Submits data to `inventory/products` API. |

## Key Differences Summary

1.  **Complexity**:
    *   **Laptop Mode** is designed for complex items where specific hardware details (like the processor and screen size) are critical for the customer's purchase decision. It also supports *Configurable Options* (Variants), allowing customers to upgrade RAM/Storage on the product page.
    *   **Accessory Mode** is streamlined. It treats the product as a simple SKU with a name, price, and image. It removes the clutter of technical specifications that don't apply to items like cables, mousepads, or basic headsets.

2.  **Validation**:
    *   In **Laptop Mode**, fields like Processor and RAM are typically expected to be filled for the product to appear correctly in filters.
    *   In **Accessory Mode**, these fields are ignored or sent as `null`/empty strings to the backend.

3.  **UI Layout**:
    *   **Laptop Mode** renders two additional full-width sections: "Tech Specifications" and "Configuration Variants".
    *   **Accessory Mode** hides these sections completely, resulting in a much shorter, cleaner form.
