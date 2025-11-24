'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from 'shared-api';
import { AppDispatch, selectAuthUser, setUser, logout } from 'shared-redux';

/**
 * Redirects authenticated users away from login/signup pages
 * Validates user authentication status on mount to handle stale Redux state
 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector(selectAuthUser);
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        // Always validate auth status when landing on login/signup page
        // This handles cases where Redux has stale user data but cookies are invalid
        const validateAuth = async () => {
            try {
                const currentUser = await getCurrentUser();

                if (currentUser) {
                    // User is authenticated, update Redux if needed and redirect
                    if (!user || user.firebaseUid !== currentUser.firebaseUid) {
                        dispatch(setUser(currentUser));
                    }
                    const redirect = searchParams.get('redirect') || '/';
                    router.replace(redirect);
                } else {
                    // No valid user, clear Redux if it has stale data
                    if (user) {
                        dispatch(logout());
                    }
                }
            } catch (error) {
                console.error('Auth validation error:', error);
                // On error, clear stale user data
                if (user) {
                    dispatch(logout());
                }
            } finally {
                setIsValidating(false);
            }
        };

        validateAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, router, searchParams]); // Intentionally omit 'user' to run only once on mount

    // Show nothing while validating to prevent flash of login form
    if (isValidating) {
        return null;
    }

    // Don't render children if user is authenticated
    if (user) {
        return null;
    }

    return <>{children}</>;
}
