import * as XLSX from 'xlsx';

export const exportBillsToExcel = (bills: any[]) => {
    const rows: any[] = [];

    bills.forEach(bill => {
        const headerInfo = {
            'Bill #': bill.documentType === 'invoice' ? bill.invoice_no : bill.quotation_no,
            'Type': bill.documentType === 'invoice' ? 'Invoice' : 'Proforma',
            'Date': new Date(bill.created_date).toLocaleDateString(),
            'Due Date': new Date(bill.due_date).toLocaleDateString(),
            'Customer Name': bill.customer_name,
            'Customer Email': bill.customer_email || '',
            'Customer Phone': bill.customer_phone || '',
            'Customer Address': bill.customer_address || '',
            'Sub Total': Number(bill.sub_total || 0).toFixed(2),
            'Discount Total': Number(bill.discount_total || 0).toFixed(2),
            'Tax Amount': Number(bill.tax_amount || 0).toFixed(2),
            'Total Amount': Number(bill.total_amount || 0).toFixed(2),
            'Advance Received': Number(bill.advance_received || 0).toFixed(2),
            'Payment Type': bill.payment_type || 'Cash',
            'Status': bill.status || 'Pending',
            'Notes': bill.notes || '',
        };

        if (bill.items && bill.items.length > 0) {
            bill.items.forEach((item: any) => {
                rows.push({
                    ...headerInfo,
                    'Item Description': item.description || '',
                    'Qty': item.quantity || 0,
                    'Unit Price': Number(item.unit_price || 0).toFixed(2),
                    'Item Discount': Number(item.discount || 0).toFixed(2),
                    'Item Total': Number(item.total || 0).toFixed(2),
                });
            });
        } else {
            // If no items, still add the header info
            rows.push({
                ...headerInfo,
                'Item Description': '',
                'Qty': '',
                'Unit Price': '',
                'Item Discount': '',
                'Item Total': '',
            });
        }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `BizzCoHub_Full_Bills_${date}.xlsx`;

    XLSX.writeFile(workbook, filename);
};

export const parseBillsFromExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const data = XLSX.utils.sheet_to_json(worksheet);
                resolve(data);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
