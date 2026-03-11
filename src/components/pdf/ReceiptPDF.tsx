import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { ToWords } from 'to-words';

// Register fonts if available
Font.register({
    family: 'Square721 BT Roman',
    src: '/Square721%20BT%20Roman.ttf',
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        padding: 30, // 8mm approx
        color: '#000',
        flexDirection: 'column',
    },
    // Receipt Container (A5 landscape or custom)
    container: {
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    // Header Section
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottomWidth: 2,
        borderBottomColor: '#1A2244',
        paddingBottom: 12,
        marginBottom: 20,
    },
    branding: {
        flexDirection: 'column',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    logoText: {
        fontSize: 22,
        color: '#1A2244',
        fontWeight: 'extrabold',
        marginLeft: 10,
        fontFamily: 'Square721 BT Roman',
    },
    tagline: {
        fontSize: 9,
        color: '#1A2244',
    },
    address: {
        fontSize: 9,
        color: '#1A2244',
    },
    receiptTitleSection: {
        alignItems: 'flex-end',
    },
    receiptTitle: {
        fontSize: 28,
        color: '#1A2244',
        fontWeight: 'extrabold',
        letterSpacing: 1,
    },
    idRow: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 5,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A2244',
    },

    // Form Rows
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 15,
        fontSize: 14,
    },
    label: {
        whiteSpace: 'nowrap',
        marginRight: 10,
    },
    dottedUnderline: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'dotted',
        paddingBottom: 2,
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Amount Group
    amountGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    amountBox: {
        borderWidth: 1.5,
        borderColor: '#000',
        padding: '5 15',
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 150,
        marginRight: 50,
    },
    currency: {
        fontSize: 14,
        marginRight: 10,
    },
    amountValue: {
        fontSize: 18,
        fontWeight: 'extrabold',
    },
    methodGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    checkboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Purpose Row
    purposeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 15,
    },

    // Signature Section
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 10,
        marginBottom: 10,
    },
    receivedByWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    receivedByText: {
        fontSize: 12,
    },
    sigLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'dotted',
        width: 180,
        textAlign: 'center',
        paddingBottom: 2,
        fontSize: 14,
        fontWeight: 'bold',
    },
    authSig: {
        fontSize: 14,
        fontWeight: 'bold',
        width: 180,
        textAlign: 'center',
    },

    // Footer
    footerNote: {
        textAlign: 'center',
        fontSize: 9,
        color: '#666',
        marginTop: 5,
    }
});

interface ReceiptPDFProps {
    payment: any;
    staffName?: string;
    logoUrl?: string;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ payment, staffName, logoUrl }) => {
    const toWords = new ToWords({
        localeCode: 'en-AE',
        converterOptions: {
            currency: true,
            ignoreDecimal: false,
            ignoreZeroCurrency: false,
            doNotAddOnly: false,
            currencyOptions: {
                name: 'AED',
                plural: 'AED',
                symbol: 'AED',
                fractionalUnit: { name: 'Fils', plural: 'Fils', symbol: '' }
            }
        }
    });

    const docDate = payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const receiptId = (payment.id || 0).toString().padStart(4, '0');
    const customerName = (payment.customer_name || '').toUpperCase();
    const amountFormatted = Number(payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const amountWords = toWords.convert(Number(payment.amount || 0));

    return (
        <Document title={`Money Receipt - REC-${receiptId}`}>
            <Page size={[595, 280]} style={styles.page}>
                <View style={styles.container}>
                    <View>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.branding}>
                                <View style={styles.logoRow}>
                                    {logoUrl && <Image src={logoUrl} style={{ width: 35, height: 35 }} />}
                                    <Text style={styles.logoText}>BIZZ CO HUB LLC</Text>
                                </View>
                                <Text style={styles.tagline}>Premium Refurbished Electronics and Professional IT Services</Text>
                                <Text style={styles.address}>Sharjah Media City, Sharjah, UAE</Text>
                            </View>
                            <View style={styles.receiptTitleSection}>
                                <Text style={styles.receiptTitle}>MONEY RECEIPT</Text>
                                <View style={styles.idRow}>
                                    <Text>Date: {docDate}</Text>
                                    <Text>Receipt No: REC-{receiptId}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Received with thanks from */}
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Received with thanks from</Text>
                            <Text style={styles.dottedUnderline}>{customerName}</Text>
                        </View>

                        {/* Amount and Method */}
                        <View style={styles.amountGroup}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Text style={{ fontSize: 14 }}>Amount</Text>
                                <View style={styles.amountBox}>
                                    <Text style={styles.currency}>AED</Text>
                                    <Text style={styles.amountValue}>{amountFormatted}</Text>
                                </View>
                            </View>
                            <View style={styles.methodGroup}>
                                <Text style={{ fontSize: 13 }}>By</Text>
                                <View style={styles.checkboxItem}>
                                    <View style={styles.checkbox}><Text>{payment.method === 'Cash' || payment.payment_method === 'Cash' ? '✓' : ''}</Text></View>
                                    <Text>Cash</Text>
                                </View>
                                <View style={styles.checkboxItem}>
                                    <View style={styles.checkbox}><Text>{payment.method === 'Cheque' || payment.payment_method === 'Cheque' ? '✓' : ''}</Text></View>
                                    <Text>Cheque</Text>
                                </View>
                                <View style={styles.checkboxItem}>
                                    <View style={styles.checkbox}><Text>{payment.method === 'Bank' || payment.payment_method === 'Bank' || payment.payment_method === 'Transfer' ? '✓' : ''}</Text></View>
                                    <Text>Bank</Text>
                                </View>
                            </View>
                        </View>

                        {/* Amount in words */}
                        <View style={styles.infoRow}>
                            <View style={{ flexDirection: 'column', width: 60 }}>
                                <Text style={{ fontSize: 12 }}>Amount in a</Text>
                                <Text style={{ fontSize: 12 }}>word</Text>
                            </View>
                            <Text style={[styles.dottedUnderline, { fontSize: 13, fontStyle: 'italic', textAlign: 'center' }]}>
                                {amountWords}
                            </Text>
                        </View>

                        {/* Purpose */}
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>For the purpose of</Text>
                            <Text style={[styles.dottedUnderline, { fontSize: 14, textAlign: 'center' }]}>
                                {payment.notes || payment.doc_no || 'Payment'}
                            </Text>
                        </View>

                        {/* Signature */}
                        <View style={styles.signatureSection}>
                            <View style={styles.receivedByWrap}>
                                <Text style={styles.receivedByText}>Received By</Text>
                                <Text style={styles.sigLine}>{(payment.staff_name || staffName || 'Muhammed Rishad').toUpperCase()}</Text>
                            </View>
                            <Text style={styles.authSig}>Authorized Signature</Text>
                        </View>
                    </View>

                    {/* Footer Note */}
                    <Text style={styles.footerNote}>
                        - This is a computer generated receipt, it does not need signature or stamp -
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default ReceiptPDF;
