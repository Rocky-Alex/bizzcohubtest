import React from 'react';

const DropListUpdates = () => {
    const cards = [
        { title: 'Brand', icon: 'fas fa-copyright' },
        { title: 'Series', icon: 'fas fa-layer-group' },
        { title: 'Model', icon: 'fas fa-laptop' }
    ];

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    marginBottom: '1rem'
                }}>
                    Laptop Related Drop Lists
                </h2>

                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    flexWrap: 'wrap'
                }}>
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            style={{
                                background: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                minWidth: '200px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                            onClick={() => console.log(`Clicked ${card.title}`)}
                        >
                            <i className={card.icon} style={{ fontSize: '1.5rem', color: '#64748b' }}></i>
                            <span style={{ fontWeight: 600, color: '#334155' }}>{card.title}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DropListUpdates;
