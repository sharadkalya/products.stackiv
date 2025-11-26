'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout as logoutApi } from 'shared-api';
import { firebaseLogout } from 'shared-auth';
import { AppDispatch, logout as logoutAction } from 'shared-redux';

import { FullScreenLoader } from './FullScreenLoader';

export default function LogoutButton() {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);

    const onLogout = async () => {
        setLoading(true);

        try {
            // Execute all logout operations in parallel
            await Promise.all([
                logoutApi(), // clears backend JWT cookie
                firebaseLogout(), // signs out from Firebase
            ]);

            // Clear Redux state
            dispatch(logoutAction());

            // Redirect to login page
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
