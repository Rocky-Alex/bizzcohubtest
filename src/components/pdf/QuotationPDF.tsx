import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { ToWords } from 'to-words';

// Register fonts
Font.register({
    family: 'Square721 BT Roman',
    src: '/Square721 BT Roman.ttf',
});

Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 500 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuG2fAZ9hiA.woff2', fontWeight: 600 },
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuWAZ9hiA.woff2', fontWeight: 700 },
    ],
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Inter',
        fontSize: 9,
        padding: 40,
        color: '#333',
        flexDirection: 'column',
    },
    // Header Section
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#1A2244',
        paddingBottom: 12,
        position: 'relative',
    },
    headerCentered: {
        justifyContent: 'center',
    },
    headerLeft: {
        flexDirection: 'column',
        width: '60%',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    logoText: {
        color: '#1A2244',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 2,
        fontFamily: 'Square721 BT Roman',
    },
    tagline: {
        color: '#1A2244',
        fontSize: 7,
        marginBottom: 1,
    },
    taxIdContainer: {
        position: 'absolute',
        left: '50%',
        top: 62,
        transform: 'translateX(-50%)',
    },
    taxId: {
        color: '#1A2244',
        fontSize: 12,
        fontWeight: 500,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    invoiceTitle: {
        color: '#1A2244',
        fontSize: 26,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 10,
    },
    invoiceTitleCentered: {
        textAlign: 'center',
        width: '100%',
    },
    // Info Section
    infoSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    billToColumn: {
        width: '50%',
    },
    billToLabel: {
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 9,
    },
    billToContent: {
        lineHeight: 1.4,
        fontSize: 9,
    },
    dateColumn: {
        width: '40%',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    dateLabel: {
        color: '#000',
        fontSize: 9,
    },
    dateValue: {
        textAlign: 'right',
        fontWeight: 'bold',
        fontSize: 9,
    },
    // Table Section
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    tableHeaderCell: {
        color: '#1A2244',
        fontWeight: 'bold',
        fontSize: 8,
    },
    tableCell: {
        fontSize: 9,
        color: '#1f2937',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    colDesc: { width: '50%' },
    colQty: { width: '8%', textAlign: 'center' },
    colCost: { width: '14%', textAlign: 'center' },
    colDisc: { width: '13%', textAlign: 'center' },
    colTotal: { width: '15%', textAlign: 'right' },

    // Bottom Section
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    termsColumn: {
        width: '50%',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 7,
        color: '#1A2244',
    },
    sectionContent: {
        color: '#6b7280',
        lineHeight: 1.3,
        marginBottom: 8,
        fontSize: 7,
    },
    totalsColumn: {
        width: '180pt',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    totalLabel: {
        color: '#4b5563',
        fontSize: 9,
    },
    totalValue: {
        textAlign: 'right',
        fontSize: 9,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 8,
    },
    grandTotalLabel: {
        color: '#ea580c',
        fontWeight: 'bold',
        fontSize: 11,
    },
    grandTotalValue: {
        color: '#ea580c',
        fontWeight: 'bold',
        fontSize: 11,
        textAlign: 'right',
    },
    amountInWords: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#9ca3af',
        textAlign: 'right',
        marginTop: 8,
    },

    // Signature
    signatureSection: {
        marginTop: 60,
        textAlign: 'right',
        alignItems: 'flex-end',
    },
    signatureLine: {
        width: 150,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 6,
    },
    signatureName: {
        fontWeight: 'bold',
        fontSize: 9,
        color: '#1A2244',
        textAlign: 'center',
        width: 150,
    },
    signatureRole: {
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
        width: 150,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        textAlign: 'center',
    },
    footerLogoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 4,
        alignItems: 'center',
    },
    footerLogoText: {
        color: '#1A2244',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
        fontFamily: 'Square721 BT Roman',
    },
    footerTagline: {
        fontSize: 8,
        color: '#6b7280',
    },
});

interface QuotationPDFProps {
    quotation: any;
    items: any[];
    logoUrl?: string;
    staffName?: string;
    staffRole?: string;
}

const QuotationPDF: React.FC<QuotationPDFProps> = ({ quotation, items, logoUrl, staffName, staffRole }) => {
    const toWords = new ToWords({
        localeCode: 'en-US',
        converterOptions: {
            currency: true,
            ignoreDecimal: false,
            ignoreZeroCurrency: false,
            doNotAddOnly: false,
        }
    });

    const subTotal = Number(quotation.sub_total || 0);
    const taxAmount = Number(quotation.tax_amount || 0);
    const taxRate = Number(quotation.tax_rate || 5);
    const totalAmount = Number(quotation.total_amount || 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={[styles.header, !quotation.is_taxable ? styles.headerCentered : {}]}>
                    {quotation.is_taxable && (
                        <View style={styles.headerLeft}>
                            <View style={styles.logoRow}>
                                {logoUrl && <Image src={logoUrl} style={{ width: 40, height: 40, objectFit: 'contain' }} />}
                                <Text style={styles.logoText}>BIZZ CO HUB LLC</Text>
                            </View>
                            <Text style={styles.tagline}>Premium Refurbished Electronics and Professional IT Services</Text>
                            <Text style={styles.tagline}>Sharjah Media City, Sharjah, UAE</Text>
                            <Text style={styles.tagline}>Ph: +971 52 714 6582 | +971 55 614 8279</Text>
                        </View>
                    )}

                    {quotation.is_taxable && (
                        <View style={styles.taxIdContainer}>
                            <Text style={styles.taxId}>TAX : 123456789123456</Text>
                        </View>
                    )}

                    <View style={[styles.headerRight, !quotation.is_taxable ? styles.invoiceTitleCentered : {}]}>
                        <Text style={[styles.invoiceTitle, !quotation.is_taxable ? { textAlign: 'center' } : {}]}>PROFORMA INVOICE</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.billToColumn}>
                        <Text style={styles.billToLabel}>Bill To</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 2, color: '#000' }}>{quotation.customer_name}</Text>
                        <Text style={styles.billToContent}>{quotation.customer_address}</Text>
                        {quotation.customer_email && <Text style={styles.billToContent}>{quotation.customer_email}</Text>}
                        {quotation.customer_phone && <Text style={styles.billToContent}>{quotation.customer_phone}</Text>}
                    </View>

                    <View style={styles.dateColumn}>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Pro-Inv #:</Text>
                            <Text style={styles.dateValue}>{quotation.quotation_no}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Date:</Text>
                            <Text style={styles.dateValue}>{new Date(quotation.created_date || quotation.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Due Date:</Text>
                            <Text style={styles.dateValue}>{new Date(quotation.validity_date || quotation.due_date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Payment Type:</Text>
                            <Text style={styles.dateValue}>{quotation.payment_type || 'Bank'}</Text>
                        </View>
                    </View>
                </View>

                {/* Table */}
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
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity || item.qty}</Text>
                            <Text style={[styles.tableCell, styles.colCost, { color: '#333' }]}>AED {Number(item.unit_price || item.cost).toFixed(0)}</Text>
                            <Text style={[styles.tableCell, styles.colDisc, { color: '#333' }]}>AED {Number(item.discount || 0).toFixed(0)}</Text>
                            <Text style={[styles.tableCell, styles.colTotal, { color: '#333' }]}>AED {Number(item.total || (((item.quantity || item.qty) * (item.unit_price || item.cost)) - item.discount)).toFixed(0)}</Text>
                        </View>
                    ))}
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <View style={styles.termsColumn}>
                        {quotation.show_terms !== false && (
                            <>
                                <Text style={styles.sectionTitle}>Terms and Conditions</Text>
                                <Text style={styles.sectionContent}>{quotation.terms_and_conditions || ''}</Text>
                                <Text style={styles.sectionTitle}>Notes</Text>
                                <Text style={styles.sectionContent}>{quotation.notes || ''}</Text>
                            </>
                        )}
                    </View>

                    <View style={styles.totalsColumn}>
                        {(quotation.is_taxable || quotation.is_discountable) && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Sub Total</Text>
                                <Text style={styles.totalValue}>AED {subTotal.toFixed(0)}</Text>
                            </View>
                        )}
                        {quotation.is_taxable && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>VAT ({taxRate}%)</Text>
                                <Text style={styles.totalValue}>AED {taxAmount.toFixed(0)}</Text>
                            </View>
                        )}
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Total Amount</Text>
                            <Text style={styles.grandTotalValue}>AED {totalAmount.toFixed(0)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Advance Paid</Text>
                            <Text style={[styles.totalValue, { color: '#16a34a', fontWeight: 'bold' }]}>AED {Number(quotation.advance_received || 0).toFixed(0)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 9 }}>Balance Due</Text>
                            <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 9, textAlign: 'right' }}>AED {(totalAmount - Number(quotation.advance_received || 0)).toFixed(0)}</Text>
                        </View>
                        <Text style={styles.amountInWords}>Amount in Words : {toWords.convert(totalAmount).replace('Only', '')} AED Only</Text>
                    </View>
                </View>

                {/* Signature */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureName}>{staffName || 'Muhammed Rishad'}</Text>
                    <Text style={styles.signatureRole}>{staffRole || 'Accountant'}</Text>
                </View>

                {/* Footer */}
                {quotation.is_taxable && (
                    <View style={styles.footer}>
                        <View style={styles.footerLogoRow}>
                            {logoUrl && <Image src={logoUrl} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                            <Text style={styles.footerLogoText}>BIZZ CO HUB LLC</Text>
                        </View>
                        <Text style={styles.footerTagline}>Premium Refurbished Electronics and Professional IT Services</Text>
                    </View>
                )}

            </Page>
        </Document>
    );
};

export default QuotationPDF;
