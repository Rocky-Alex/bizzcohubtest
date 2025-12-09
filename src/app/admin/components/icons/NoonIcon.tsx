import React from 'react';

const NoonIcon = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Main large arc */}
            <path d="M10 4 A 9 9 0 1 1 4 10" />

            {/* Smaller segment at top-left */}
            <path d="M7 5 A 9 9 0 0 0 5 7" />
        </svg>
    );
};

export default NoonIcon;
