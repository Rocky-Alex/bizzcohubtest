"use client";

import React from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "../components/LoadingSpinner";

const UserPasswords = dynamic(() => import("../components/UserPasswords"), { loading: () => <LoadingSpinner /> });

export default function PasswordsPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <UserPasswords />
        </div>
    );
}
