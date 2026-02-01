import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { ToWords } from 'to-words';

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        padding: 40,
        color: '#333',
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40,
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
        color: '#0c86ea',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    tagline: {
        color: '#0c86ea',
        fontSize: 9,
    },
    headerCenter: { marginTop: 10 },
    taxId: { color: '#0c86ea', fontSize: 10 },
    headerRight: { alignItems: 'flex-end' },
    invoiceTitle: {
        color: '#0c86ea',
        fontSize: 28, // Slightly smaller to fit QUOTATION INVOICE if needed
        fontWeight: 'bold',
    },
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    billToColumn: { width: '45%' },
    billToLabel: { fontWeight: 'bold', marginBottom: 4, fontSize: 10 },
    billToContent: { lineHeight: 1.4 },
    dateColumn: { width: '35%' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    dateLabel: { color: '#444' },
    dateValue: { textAlign: 'right', fontWeight: 'bold' },
    table: { width: '100%', marginBottom: 20 },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableHeaderCell: { color: '#666', fontWeight: 'bold', fontSize: 9 },
    tableCell: { fontSize: 9, color: '#333' },
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
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    termsColumn: { width: '50%', paddingRight: 20 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 5, marginTop: 10, fontSize: 9 },
    sectionContent: { color: '#666', lineHeight: 1.4, marginBottom: 10 },
    totalsColumn: { width: '40%' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalLabel: { color: '#666' },
    totalValue: { textAlign: 'right', fontWeight: 'bold' },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    grandTotalLabel: { color: '#ff4d4f', fontWeight: 'bold', fontSize: 11 },
    grandTotalValue: { color: '#ff4d4f', fontWeight: 'bold', fontSize: 11, textAlign: 'right' },
    amountInWords: { fontSize: 8, fontStyle: 'italic', color: '#888', textAlign: 'right', marginTop: 5 },
    signatureSection: {
        marginTop: 50,
        alignSelf: 'flex-end',
        width: 150,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 5,
        alignItems: 'center',
    },
    signatureName: { fontWeight: 'bold', fontSize: 10 },
    signatureRole: { fontSize: 8, color: '#666' },
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

interface QuotationPDFProps {
    quotation: any;
    items: any[];
    logoUrl?: string;
}

const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation, items, logoUrl }) => {
    const toWords = new ToWords({
        localeCode: 'en-US',
        converterOptions: { currency: true, ignoreDecimal: false, ignoreZeroCurrency: false, doNotAddOnly: false }
    });

    const subTotal = Number(quotation.sub_total || 0);
    const taxAmount = Number(quotation.tax_amount || 0);
    const totalAmount = Number(quotation.total_amount || 0);

    let amountWord = "";
    try {
        amountWord = toWords.convert(totalAmount);
    } catch (e) {
        amountWord = `${totalAmount}`;
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoRow}>
                            {logoUrl ? (
                                <Image src={logoUrl} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                            ) : (
                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#0c86ea' }} />
                            )}
                            <Text style={styles.logoText}>Bizz Co Hub</Text>
                        </View>
                        <Text style={styles.tagline}>Premium Refurbished Electronics and Professional IT Services</Text>
                    </View>
                    <View style={styles.headerCenter}>
                        {/* Tax ID moved to header or bill to? Let's keep consistent with PDF design */}
                        {/* Original PDF had centered Tax ID, user asked to move it. In PDF we'll put it in Bill To section similar to HTML update */}
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.invoiceTitle}>QUOTATION</Text>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.billToColumn}>
                        <Text style={styles.billToLabel}>Bill To</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{quotation.customer_name}</Text>
                        <Text style={styles.billToContent}>{quotation.customer_address}</Text>
                        <Text style={styles.billToContent}>{quotation.customer_email}</Text>
                        <Text style={styles.billToContent}>{quotation.customer_phone}</Text>
                    </View>
                    <View style={styles.dateColumn}>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Date:</Text>
                            <Text style={styles.dateValue}>{new Date(quotation.created_date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Valid Until:</Text>
                            <Text style={styles.dateValue}>{new Date(quotation.due_date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Payment Type:</Text>
                            <Text style={styles.dateValue}>{quotation.payment_type || 'Bank'}</Text>
                        </View>
                        {quotation.is_taxable ? (
                            <View style={styles.dateRow}>
                                <Text style={styles.dateLabel}>Tax ID:</Text>
                                <Text style={styles.dateValue}>123456789123456</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colDesc]}>Job Description</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                        <Text style={[styles.tableHeaderCell, styles.colCost]}>Cost</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDisc]}>Discount</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>
                    {items.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colCost]}>{Number(item.unit_price).toFixed(0)}</Text>
                            <Text style={[styles.tableCell, styles.colDisc]}>{Number(item.discount || 0).toFixed(0)}</Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>{Number(item.total).toFixed(0)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.bottomSection}>
                    <View style={styles.termsColumn}>
                        <Text style={styles.sectionTitle}>Terms and Conditions</Text>
                        <Text style={styles.sectionContent}>Valid for 7 days from the date of quotation.</Text>
                    </View>
                    <View style={styles.totalsColumn}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Sub Total</Text>
                            <Text style={styles.totalValue}>${subTotal.toFixed(0)}</Text>
                        </View>
                        {quotation.is_taxable ? (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>VAT (5%)</Text>
                                <Text style={styles.totalValue}>${taxAmount.toFixed(0)}</Text>
                            </View>
                        ) : null}
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Total Amount</Text>
                            <Text style={styles.grandTotalValue}>${totalAmount.toFixed(0)}</Text>
                        </View>
                        <Text style={styles.amountInWords}>Amount in Words : Dollar {totalAmount} Only</Text>
                    </View>
                </View>

                <View style={styles.signatureSection}>
                    <Text style={styles.signatureName}>Muhammed Rishad</Text>
                    <Text style={styles.signatureRole}>Assistant Manager</Text>
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerLogoRow}>
                        {logoUrl ? (
                            <Image src={logoUrl} style={{ width: 14, height: 14, objectFit: 'contain', marginRight: 5 }} />
                        ) : (
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#0c86ea', marginRight: 5 }} />
                        )}
                        <Text style={{ color: '#0c86ea', fontWeight: 'bold' }}>Bizz Co Hub</Text>
                    </View>
                    <Text style={{ color: '#666', fontSize: 8 }}>Premium Refurbished Electronics and Professional IT Services</Text>
                </View>
            </Page>
        </Document>
    );
};

export default QuotationPDF;
