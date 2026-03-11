"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const ModelChecking = dynamic(() => import('../components/ModelChecking/ModelChecking'), { loading: () => <LoadingSpinner /> });

export default function ModelCheckingPage() {
    return (
        <div style={{ padding: '0.5rem' }}>
            <ModelChecking />
        </div>
    );
}
