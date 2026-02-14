import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 9, // Slightly smaller font for more columns
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        margin: 10,
        padding: 10,
    },
    boxContainer: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 5,
    },
    boxHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: '#f3f4f6',
        padding: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 4,
        fontWeight: 'bold',
        fontSize: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 4,
        fontSize: 8,
    },
    // Columns
    colIndex: { width: '5%', textAlign: 'center' },
    colBarcode: { width: '15%' },
    colModel: { width: '25%' },
    colProcessor: { width: '15%' },
    colSpecs: { width: '10%' },
    colSerial: { width: '25%' },
    colQty: { width: '5%', textAlign: 'center' },
});

export interface PackingItem {
    id: number;
    product_name: string;
    sku: string; // Serial Number
    barcode?: string;
    ram?: string;
    storage?: string;
    quantity: number;
    // New fields
    brand?: string;
    model?: string;
    series?: string;
    processor?: string;
    processor_gen?: string;
}

export interface PackedBox {
    box_number: number;
    box_type: string;
    items: PackingItem[];
}

export interface Order {
    order_number: string;
    customer_name: string;
}

interface PackingListPDFProps {
    order: Order;
    boxes: PackedBox[];
}

const PackingListPDF = ({ order, boxes }: PackingListPDFProps) => {
    let globalIndex = 0;

    return (
        <Document>
            <Page size="A4" style={styles.page} orientation="landscape">
                {/* Landscape layout usually better for wide tables */}

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>PACKING LIST</Text>
                        <Text>Order #{order.order_number}</Text>
                    </View>
                    <View>
                        <Text>Date: {new Date().toLocaleDateString()}</Text>
                        <Text>Customer: {order.customer_name}</Text>
                    </View>
                </View>

                {/* Content */}
                <View>
                    <Text style={{ marginBottom: 10, fontSize: 12, fontWeight: 'bold' }}>Packed Items</Text>

                    {boxes.map((box, index) => (
                        <View key={index} style={styles.boxContainer}>
                            <Text style={styles.boxHeader}>
                                Box #{box.box_number} - {box.box_type}
                            </Text>

                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={styles.colIndex}>#</Text>
                                <Text style={styles.colBarcode}>Barcode</Text>
                                <Text style={styles.colModel}>Model</Text>
                                <Text style={styles.colProcessor}>Processor</Text>
                                <Text style={styles.colSpecs}>RAM / SSD</Text>
                                <Text style={styles.colSerial}>Serial Number</Text>
                                <Text style={styles.colQty}>Qty</Text>
                            </View>

                            {/* Items */}
                            {box.items.map((item, i) => {
                                globalIndex++;
                                const modelStr = [item.brand, item.series, item.model].filter(Boolean).join(' ') || item.product_name;
                                const procStr = [item.processor, item.processor_gen].filter(Boolean).join(' ');
                                const specsStr = [item.ram, item.storage].filter(Boolean).join(' / ');

                                return (
                                    <View key={i} style={styles.tableRow}>
                                        <Text style={styles.colIndex}>{globalIndex}</Text>
                                        <Text style={styles.colBarcode}>{item.barcode || '-'}</Text>
                                        <Text style={styles.colModel}>{modelStr}</Text>
                                        <Text style={styles.colProcessor}>{procStr}</Text>
                                        <Text style={styles.colSpecs}>{specsStr}</Text>
                                        <Text style={styles.colSerial}>{item.sku}</Text>
                                        <Text style={styles.colQty}>{item.quantity}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderColor: '#ccc' }}>
                    <Text style={{ textAlign: 'center', color: '#888', fontSize: 8 }}>
                        Generated by Bizz Co Hub
                    </Text>
                </View>

            </Page>
        </Document>
    );
};

export default PackingListPDF;
