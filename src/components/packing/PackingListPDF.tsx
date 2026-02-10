import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
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
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 10,
    },
    boxHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: '#f9f9f9',
        padding: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 4,
    },
    colName: {
        width: '60%',
    },
    colSku: {
        width: '30%',
        color: '#666',
    },
    colQty: {
        width: '10%',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

interface PackingItem {
    product_name: string;
    sku: string;
    quantity: number;
}

interface PackedBox {
    box_number: number;
    box_type: string;
    items: PackingItem[];
}

interface Order {
    order_number: string;
    customer_name: string;
    // add address etc if available
}

interface PackingListPDFProps {
    order: Order;
    boxes: PackedBox[];
}

const PackingListPDF = ({ order, boxes }: PackingListPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>

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
                <Text style={{ marginBottom: 10, fontSize: 14 }}>Packed Items</Text>

                {boxes.map((box, index) => (
                    <View key={index} style={styles.boxContainer}>
                        <Text style={styles.boxHeader}>
                            Box #{box.box_number} - {box.box_type}
                        </Text>

                        {/* Table Header */}
                        <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', fontWeight: 'bold' }]}>
                            <Text style={styles.colName}>Product</Text>
                            <Text style={styles.colSku}>SKU</Text>
                            <Text style={styles.colQty}>Qty</Text>
                        </View>

                        {/* Items */}
                        {box.items.map((item, i) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={styles.colName}>{item.product_name}</Text>
                                <Text style={styles.colSku}>{item.sku}</Text>
                                <Text style={styles.colQty}>{item.quantity}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={{ marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderColor: '#ccc' }}>
                <Text style={{ textAlign: 'center', color: '#888' }}>
                    Thank you for your business!
                </Text>
            </View>

        </Page>
    </Document>
);

export default PackingListPDF;
