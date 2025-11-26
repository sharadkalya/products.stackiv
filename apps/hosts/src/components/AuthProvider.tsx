'use client';

import { useAuth } from '@hosts/hooks/useAuth';

/**
 * AuthProvider - Manages authentication state for the entire app
 * Simply calls useAuth() hook to fetch and set user in Redux
 * No routing logic - middleware handles route protection
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    useAuth(); // Fetch user if not in Redux
    return <>{children}</>;
};
