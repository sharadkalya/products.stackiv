import axios from 'axios';
import type { Store } from '@reduxjs/toolkit';

let reduxStore: Store | null = null;

/**
 * Initialize axios interceptors with Redux store
 * This should be called once during app initialization
 */
export function setupAxiosInterceptors(store: Store) {
    reduxStore = store;

    // Response interceptor for handling authentication errors
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401) {
                // Clear Redux state
                if (reduxStore) {
                    const { logout } = await import('shared-redux');
                    reduxStore.dispatch(logout());
                }

                // Clear cookies
                if (typeof document !== 'undefined') {
                    document.cookie = 'Authorization=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    document.cookie = 'RefreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                }

                // Redirect to login if we're in a browser environment and not already on login/signup
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    if (!currentPath.startsWith('/login') && !currentPath.startsWith('/signup')) {
                        window.location.href = '/login';
                    }
                }
            }
            return Promise.reject(error);
        }
    );
}
