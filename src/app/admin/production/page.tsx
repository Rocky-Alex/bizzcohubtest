"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const ComingSoon = dynamic(() => import('@/app/admin/shared/ComingSoon'));
const QCChecking = dynamic(() => import('./components/QCChecking/QCChecking'), { loading: () => <LoadingSpinner /> });
const Packing = dynamic(() => import('./components/Packing/Packing'), { loading: () => <LoadingSpinner /> });

export default function ProductionPage() {
    const searchParams = useSearchParams();
    const section = searchParams.get('section') || 'production-dashboard';

    return (
        <div style={{ padding: '0.5rem' }}>
            {section === 'production-dashboard' && (
                <ComingSoon
                    title="Production Dashboard"
                    description="Overview of production status and metrics."
                />
            )}
            {section === 'production-projects' && (
                <ComingSoon
                    title="Production Projects"
                    description="Manage ongoing production projects."
                />
            )}
            {section === 'production-tasks' && (
                <ComingSoon
                    title="Production Tasks"
                    description="Track individual production tasks."
                />
            )}
            {section === 'production-qc' && (
                <QCChecking />
            )}
            {section === 'production-packing' && (
                <Packing />
            )}
        </div>
    );
}
