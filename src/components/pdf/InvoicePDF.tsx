import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { ToWords } from 'to-words';
// Register fonts
Font.register({
    family: 'Square721 BT Roman',
    src: '/Square721%20BT%20Roman.ttf',
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        padding: 40,
        color: '#333',
        flexDirection: 'column',
    },
    // Header Section
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1A2244',
        paddingBottom: 10,
    },
    headerLeft: {
        flexDirection: 'column',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    logoText: {
        color: '#1A2244',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        fontFamily: 'Square721 BT Roman',
    },
    tagline: {
        color: '#1A2244',
        fontSize: 9,
    },
    headerCenter: { marginTop: 25 },
    taxId: {
        color: '#1A2244',
        fontSize: 10,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        color: '#1A2244',
        fontSize: 32,
        fontWeight: 'bold',
    },
    // Info Section
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    billToColumn: {
        width: '45%',
    },
    billToLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 10,
    },
    billToContent: {
        lineHeight: 1.4,
    },
    dateColumn: {
        width: '35%',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    dateLabel: {
        color: '#444',
    },
    dateValue: {
        textAlign: 'right',
        fontWeight: 'bold',
    },
    // Table Section
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableHeaderCell: {
        color: '#1A2244',
        fontWeight: 'bold',
        fontSize: 9,
    },
    tableCell: {
        fontSize: 9,
        color: '#333', // Default text color
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    colDesc: { width: '50%' },
    colQty: { width: '10%', textAlign: 'center' },
    colCost: { width: '15%', textAlign: 'right' },
    colDisc: { width: '10%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right' },

    // Bottom Section
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    termsColumn: {
        width: '50%',
        paddingRight: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 10,
        fontSize: 9,
    },
    sectionContent: {
        color: '#666',
        lineHeight: .9,
        marginBottom: 5,
    },
    totalsColumn: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        color: '#666',
    },
    totalValue: {
        textAlign: 'right',
        fontWeight: 'bold', // Made all values bold for better read
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    grandTotalLabel: {
        color: '#ff4d4f', // Red/Orange color
        fontWeight: 'bold',
        fontSize: 11,
    },
    grandTotalValue: {
        color: '#ff4d4f',
        fontWeight: 'bold',
        fontSize: 11,
        textAlign: 'right',
    },
    balanceDueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    balanceDueLabel: {
        color: '#d32f2f', // Darker red
        fontWeight: 'bold',
        fontSize: 10,
    },
    balanceDueValue: {
        color: '#d32f2f',
        fontWeight: 'bold',
        fontSize: 10,
        textAlign: 'right',
    },
    amountInWords: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'right',
        marginTop: 5,
    },

    // Signature
    signatureSection: {
        marginTop: 50,
        alignSelf: 'flex-end',
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 5,
        alignItems: 'center',
    },
    signatureName: {
        fontWeight: 'bold',
        fontSize: 10,
    },
    signatureRole: {
        fontSize: 8,
        color: '#1A2244',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
    },
    footerLogoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 3,
        alignItems: 'center',
    },
});

interface InvoicePDFProps {
    invoice: any;
    items: any[];
    logoUrl?: string;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, items, logoUrl }) => {
    const toWords = new ToWords({
        localeCode: 'en-US',
        converterOptions: {
            currency: true,
            ignoreDecimal: false,
            ignoreZeroCurrency: false,
            doNotAddOnly: false,
        }
    });

    const subTotal = Number(invoice.sub_total || 0);
    // Assuming discount_total is amount, not percent based on prior schema
    // But table shows 'Discount' column. Let's assume item level discount is summed.
    // If invoice has a global tax rate/amount
    const taxAmount = Number(invoice.tax_amount || 0);
    const taxRate = Number(invoice.tax_rate || 0);
    const totalAmount = Number(invoice.total_amount || 0);
    const advancePaid = Number(invoice.advance_received || 0);
    const balanceDue = totalAmount - advancePaid;

    let amountWord = "";
    try {
        amountWord = toWords.convert(totalAmount);
    } catch (e) {
        amountWord = `${totalAmount}`;
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoRow}>
                            {logoUrl ? (
                                <Image src={logoUrl} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                            ) : (
                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#1A2244' }} />
                            )}
                            <Text style={styles.logoText}>BIZZ CO HUB LLC</Text>
                        </View>
                        <Text style={styles.tagline}>Premium Refurbished Electronics and Professional IT Services</Text>
                        <Text style={styles.tagline}>Sharjah Media City, Sharjah, UAE</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 2 }}>
                            <Text style={styles.tagline}>Ph: +971 52 714 6582 | +971 55 614 8279</Text>
                            {invoice.is_taxable ? (
                                <Text style={{ ...styles.taxId, marginLeft: 20 }}>TAX : 123456789123456</Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.billToColumn}>
                        <Text style={styles.billToLabel}>Bill To</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{invoice.customer_name}</Text>
                        <Text style={styles.billToContent}>{invoice.customer_address}</Text>
                        <Text style={styles.billToContent}>{invoice.customer_email}</Text>
                        <Text style={styles.billToContent}>{invoice.customer_phone}</Text>
                    </View>

                    <View style={styles.dateColumn}>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Invoice #:</Text>
                            <Text style={styles.dateValue}>{invoice.invoice_no}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Date:</Text>
                            <Text style={styles.dateValue}>{new Date(invoice.created_date || invoice.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Due Date:</Text>
                            <Text style={styles.dateValue}>{new Date(invoice.due_date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Payment Type:</Text>
                            <Text style={styles.dateValue}>{invoice.payment_type || 'Bank'}</Text>
                        </View>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colDesc]}>Job Description</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                        <Text style={[styles.tableHeaderCell, styles.colCost]}>Cost</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDisc]}>Discount</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>

                    {/* Rows */}
                    {items.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colCost]}>AED {Number(item.unit_price).toFixed(0)}</Text>
                            <Text style={[styles.tableCell, styles.colDisc]}>AED {Number(item.discount || 0).toFixed(0)}</Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>AED {Number(item.total).toFixed(0)}</Text>
                        </View>
                    ))}
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <View style={styles.termsColumn}>
                        <Text style={styles.sectionTitle}>Terms and Conditions</Text>
                        <Text style={styles.sectionContent}>
                            {invoice.terms_and_conditions || ''}
                        </Text>

                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.sectionContent}>
                            {invoice.notes || ''}
                        </Text>
                    </View>

                    <View style={styles.totalsColumn}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Sub Total</Text>
                            <Text style={styles.totalValue}>AED {subTotal.toFixed(0)}</Text>
                        </View>
                        {invoice.is_taxable ? (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>VAT ({taxRate}%)</Text>
                                <Text style={styles.totalValue}>AED {taxAmount.toFixed(0)}</Text>
                            </View>
                        ) : null}
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Total Amount</Text>
                            <Text style={styles.grandTotalValue}>AED {totalAmount.toFixed(0)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Advance Paid</Text>
                            <Text style={styles.totalValue}>AED {advancePaid.toFixed(0)}</Text>
                        </View>
                        <View style={styles.balanceDueRow}>
                            <Text style={styles.balanceDueLabel}>Balance Due</Text>
                            <Text style={styles.balanceDueValue}>AED {balanceDue.toFixed(0)}</Text>
                        </View>

                        <Text style={styles.amountInWords}>Amount in Words :  {totalAmount} Dirhams Only</Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={styles.signatureSection}>
                    <Text style={styles.signatureName}>Muhammed Rishad</Text>
                    <Text style={styles.signatureRole}>Accountant</Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerLogoRow}>
                        {/* Mini Logo */}
                        {logoUrl ? (
                            <Image src={logoUrl} style={{ width: 14, height: 14, objectFit: 'contain', marginRight: 5 }} />
                        ) : (
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A2244', marginRight: 5 }} />
                        )}
                        <Text style={{ color: '#1A2244', fontWeight: 'bold' }}>BIZZ CO HUB LLC</Text>
                    </View>
                    <Text style={{ color: '#666', fontSize: 8 }}>Premium Refurbished Electronics and Professional IT Services</Text>
                </View>

            </Page>
        </Document>
    );
};

export default InvoicePDF;
