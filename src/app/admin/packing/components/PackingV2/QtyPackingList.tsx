import React from 'react';
import { PackedItemRecord, Order } from './PackingV2';

interface ValidatedItem extends PackedItemRecord {
    // Add any specific validated fields if needed, or just use PackedItemRecord
}

interface Props {
    items: PackedItemRecord[];
    order: Order | undefined;
}

export const QtyPackingList: React.FC<Props> = ({ items, order }) => {
    const currentDate = new Date();

    // Aggregation Logic
    const groupedItems = items.reduce((acc, item) => {
        // Group by relevant fields
        const key = [
            item.productName,
            item.core,
            item.generation,
            item.ram,
            item.ssd,
            item.graphic,
            item.touch,
            item.charger
        ].join('|');

        if (!acc[key]) {
            acc[key] = {
                ...item,
                qty: 0
            };
        }
        acc[key].qty += 1;
        return acc;
    }, {} as Record<string, PackedItemRecord & { qty: number }>);

    const sortedGroups = Object.values(groupedItems)
        .sort((a, b) => a.productName.localeCompare(b.productName));

    // CSS for print to ensure styles apply
    const printStyles = `
        @media print {
            @page { size: A4 portrait; margin: 0; }
            body { -webkit-print-color-adjust: exact; }
            .print-hidden { display: none !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Ledger&display=swap');
    `;

    return (
        <div className="detailed-packing-list" style={{
            width: '210mm', // A4 Portrait Safe Width
            height: '297mm', // A4 Portrait Safe Height
            position: 'relative',
            background: 'white',
            color: 'black',
            margin: '0 auto', // Centered
            overflow: 'hidden',
            fontFamily: "'Ledger', serif",
            // border: '1px solid black', // Removed outline
            boxSizing: 'border-box'
        }}>
            <style>{printStyles}</style>

            {/* Logo Watermark */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                opacity: 0.09,
                zIndex: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none'
            }}>
                <img src="/icon/nav-logo.png" alt="" style={{ width: '100%', height: 'auto' }} />
            </div>

            {/* Title */}
            <div style={{
                position: 'absolute',
                width: '100%',
                top: '25px',
                textAlign: 'center',
                zIndex: 1
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: '38px',
                    fontWeight: 'bold',
                    fontFamily: "'Amiri', serif",
                    letterSpacing: '1px'
                }}>
                    Packing List
                </h1>
                <p style={{
                    fontFamily: "'Amiri', serif",
                    fontSize: '18px',
                    marginTop: '5px'
                }}>
                    Order No : <b>{order ? `SO-${Number(order.id) + 100}` : 'N/A'}</b> Packed For <b>{order?.customer_name || 'Unknown'}</b> on {currentDate.toLocaleDateString()} at {currentDate.toLocaleTimeString()}
                </p>
            </div>

            {/* Table */}
            <div style={{
                position: 'absolute',
                left: '10mm',
                right: '10mm',
                top: '35mm',
                bottom: '51mm',
                border: '1px solid black',
                zIndex: 1
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ height: '34px', borderBottom: '1px solid black', background: '#f9f9f9' }}>
                            <th style={{ borderRight: '1px solid black', width: '40px' }}>No.</th>
                            <th style={{ borderRight: '1px solid black' }}>Product Name</th>
                            <th style={{ borderRight: '1px solid black', width: '60px' }}>Core</th>
                            <th style={{ borderRight: '1px solid black', width: '50px' }}>Gen</th>
                            <th style={{ borderRight: '1px solid black', width: '60px' }}>RAM</th>
                            <th style={{ borderRight: '1px solid black', width: '60px' }}>SSD</th>
                            <th style={{ borderRight: '1px solid black', width: '60px' }}>Gra.</th>
                            <th style={{ borderRight: '1px solid black', width: '70px' }}>Tou/Non</th>
                            <th style={{ borderRight: '1px solid black', width: '40px' }}>AC</th>
                            <th style={{ width: '50px' }}>Qty.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedGroups.map((item, i) => (
                            <tr key={i} style={{ height: '30.5px', borderBottom: '1px solid black' }}>
                                <td style={{ borderRight: '1px solid black' }}>{i + 1}</td>
                                <td style={{ borderRight: '1px solid black', textAlign: 'left', paddingLeft: '5px' }}>{item.productName}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.core}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.generation}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.ram}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.ssd}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.graphic}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.touch === 'Touch' ? 'Touch' : 'Non'}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.charger !== 'N' ? 'Yes' : 'No'}</td>
                                <td>{item.qty}</td>
                            </tr>
                        ))}
                        {/* Fill empty rows to make it look full if less items */}
                        {Array.from({ length: Math.max(0, 25 - sortedGroups.length) }).map((_, i) => (
                            <tr key={`empty-${i}`} style={{ height: '30.5px', borderBottom: '1px solid black' }}>
                                <td style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '27mm', right: '10mm', display: 'flex', flexDirection: 'column', gap: '6mm', textAlign: 'left', zIndex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    Packed By ..................................................
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    Signature ..................................................
                </div>
            </div>
        </div>
    );
};
