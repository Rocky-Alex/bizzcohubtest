"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const ComingSoon = dynamic(() => import('@/app/admin/shared/ComingSoon'));
const PackingV2 = dynamic(() => import('./components/PackingV2/PackingV2'), { loading: () => <LoadingSpinner /> });

export default function PackingPage() {
    const searchParams = useSearchParams();
    const section = searchParams.get('section') || 'packing-v2';

    return (
        <div style={{ padding: '0.5rem' }}>
            {section === 'packing-dashboard' && (
                <ComingSoon
                    title="Packing Dashboard"
                    description="Overview of packing operations."
                />
            )}
            {section === 'packing-v2' && (
                <PackingV2 />
            )}
        </div>
    );
}
