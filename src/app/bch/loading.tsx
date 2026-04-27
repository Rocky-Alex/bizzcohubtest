// BCH Admin section loading — scoped Suspense boundary.
// Uses the CSS-only LoadingSpinner (no framer-motion in this path).
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function BchLoading() {
    return (
        <div style={{
            height: '100%',
            minHeight: '60vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-tertiary)'
        }}>
            <LoadingSpinner size={72} text="Loading..." />
        </div>
    );
}
