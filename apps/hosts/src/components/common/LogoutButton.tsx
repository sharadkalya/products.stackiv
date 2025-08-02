'use client';

import React, { useState } from 'react';
import { logout } from 'shared-api';
import { firebaseLogout } from 'shared-auth';

import { FullScreenLoader } from './FullScreenLoader';

export default function LogoutButton() {
    const [loading, setLoading] = useState(false);

    const onLogout = async () => {
        setLoading(true);

        try {
            await Promise.all([
                logout(), // clears backend JWT cookie
                firebaseLogout(), // signs out from Firebase
            ]);
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout failed:', err);
            alert('Logout failed, please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading && (
                <FullScreenLoader>Logging out</FullScreenLoader>
            )}

            <button
                className="btn btn-primary"
                onClick={onLogout}
                type="button"
                disabled={loading}
            >
                {loading ? 'Logging out...' : 'Logout'}
            </button>
        </>
    );
}
