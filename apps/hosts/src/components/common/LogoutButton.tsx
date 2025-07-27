'use client';

import React, { useState } from 'react';
import { logout } from 'shared-api';
import { firebaseLogout } from 'shared-auth';

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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="loading loading-spinner loading-lg text-white"></div>
                </div>
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
