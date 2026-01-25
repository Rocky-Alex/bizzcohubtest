import LoadingSpinner from "./components/LoadingSpinner";

export default function Loading() {
    return (
        <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)'
        }}>
            <LoadingSpinner />
        </div>
    );
}
