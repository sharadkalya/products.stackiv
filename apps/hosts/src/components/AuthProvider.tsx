'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getCurrentUser } from 'shared-api';
import { setUser, logout, AppDispatch } from 'shared-redux';

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        if (!exp) return true;

        const now = Math.floor(Date.now() / 1000);
        return exp < now;
    } catch {
        return true;
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch<AppDispatch>();
    const hasInitialized = useRef(false);

    const fetchAndSetUser = useCallback(async () => {
        const authCookie = getCookie('Authorization');

        if (!authCookie) {
            dispatch(logout());
            return;
        }

        // Check if token is expired
        if (isTokenExpired(authCookie)) {
            dispatch(logout());
            // Clear expired cookie
            document.cookie = 'Authorization=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            return;
        }

        try {
            const user = await getCurrentUser();
            if (user) {
                dispatch(setUser(user));
            } else {
                dispatch(logout());
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            dispatch(logout());
        }
    }, [dispatch]);

    useEffect(() => {
        // Initial fetch on mount
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            fetchAndSetUser();
        }

        // Refresh user data when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchAndSetUser();
            }
        };

        // Refresh user data when window regains focus
        const handleFocus = () => {
            fetchAndSetUser();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchAndSetUser]);

    return <>{children}</>;
};
