import React from 'react';
import { PackedItemRecord, Order } from './PackingV2';

interface Props {
    items: PackedItemRecord[];
    order: Order | undefined;
}

export const DetailedPackingList: React.FC<Props> = ({ items, order }) => {
    const currentDate = new Date();

    // CSS for print to ensure styles apply
    const printStyles = `
        @media print {
            @page { size: A4 landscape; margin: 0; }
            body { -webkit-print-color-adjust: exact; }
            .print-hidden { display: none !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Ledger&display=swap');
    `;

    return (
        <div className="detailed-packing-list" style={{
            width: '290mm', // Slightly less than 297mm to strictly avoid edge clipping
            height: '200mm', // Slightly less than 210mm
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
                width: '40%',
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
                textAlign: 'center'
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 'bold',
                    fontFamily: "'Amiri', serif",
                    letterSpacing: '1px'
                }}>
                    Detailed Packing List
                </h1>
                <p style={{
                    fontFamily: "'Amiri', serif",
                    fontSize: '14px',
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
                top: '25mm',
                bottom: '28mm',
                border: '1px solid black'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ height: '34px', borderBottom: '1px solid black', background: '#f9f9f9' }}>
                            <th style={{ borderRight: '1px solid black', width: '30px' }}>No.</th>
                            <th style={{ borderRight: '1px solid black', width: '80px' }}>Barcode</th>
                            <th style={{ borderRight: '1px solid black', width: '60px' }}>Serial No</th>
                            <th style={{ borderRight: '1px solid black' }}>Product Name</th>
                            <th style={{ borderRight: '1px solid black', width: '50px' }}>Core</th>
                            <th style={{ borderRight: '1px solid black', width: '40px' }}>Gen</th>
                            <th style={{ borderRight: '1px solid black', width: '50px' }}>RAM</th>
                            <th style={{ borderRight: '1px solid black', width: '50px' }}>SSD</th>
                            <th style={{ borderRight: '1px solid black', width: '50px' }}>Gra.</th>
                            <th style={{ borderRight: '1px solid black', width: '50px' }}>D. Size</th>
                            <th style={{ borderRight: '1px solid black', width: '50px' }}>Tou/Non</th>
                            <th style={{ borderRight: '1px solid black', width: '60px' }}>Batt. Health</th>
                            <th style={{ borderRight: '1px solid black', width: '60px' }}>SSD Health</th>
                            <th style={{ borderRight: '1px solid black', width: '70px' }}>Grade/Cond.</th>
                            <th style={{ borderRight: '1px solid black', width: '30px' }}>AC</th>
                            <th style={{ width: '30px' }}>Box</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ height: '26px', borderBottom: '1px solid black' }}>
                                <td style={{ borderRight: '1px solid black' }}>{item.no}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.barcode}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.deviceSerialNumber || item.serialNumber}</td>
                                <td style={{ borderRight: '1px solid black', textAlign: 'left', paddingLeft: '5px' }}>{item.productName}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.core}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.generation}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.ram}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.ssd}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.graphic}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.screenSize}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.touch}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.batteryHealth}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.ssdHealth}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.bodyCondition}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.charger}</td>
                                <td style={{ borderRight: '1px solid black' }}>{item.boxNumber}</td>
                            </tr>
                        ))}
                        {/* Fill empty rows to make it look full if less items */}
                        {Array.from({ length: Math.max(0, 20 - items.length) }).map((_, i) => (
                            <tr key={`empty-${i}`} style={{ height: '26px', borderBottom: '1px solid black' }}>
                                <td style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
                                <td style={{ borderRight: '1px solid black' }}></td>
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
            <div style={{ position: 'absolute', bottom: '5mm', right: '10mm', display: 'flex', flexDirection: 'column', gap: '6mm', textAlign: 'left' }}>
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
