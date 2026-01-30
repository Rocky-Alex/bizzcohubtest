"use client";

import React from "react";
import dynamic from 'next/dynamic';

const BgRemoverEditor = dynamic(
    () => import('./components/BgRemoverEditor'),
    {
        ssr: false,
        loading: () => (
            <div style={{
                height: '80vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                Loading Editor...
            </div>
        )
    }
);

export default function BackgroundRemoverPage() {
    return <BgRemoverEditor />;
}
