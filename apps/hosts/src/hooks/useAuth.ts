'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from 'shared-api';
import { AppDispatch, selectAuthUser, setUser } from 'shared-redux';

// Module-level flag to ensure we only fetch user once successfully
let userFetchAttempted = false;

/**
 * Hook to manage user authentication state
 * - Fetches user from /auth/me if not in Redux
 * - Sets user in Redux store
 * - Only marks as attempted after successful fetch
 * - Retries on failure so transient errors don't permanently break auth
 */
export function useAuth() {
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector(selectAuthUser);

    useEffect(() => {
        // Only fetch if:
        // 1. No user in Redux
        // 2. Haven't successfully fetched yet
        if (!user && !userFetchAttempted) {
            getCurrentUser()
                .then((fetchedUser) => {
                    if (fetchedUser) {
                        dispatch(setUser(fetchedUser));
                        // Only mark as attempted after successful fetch
                        userFetchAttempted = true;
                    }
                    // If null returned (401, not authenticated), don't mark as attempted
                    // This allows retry if cookies become valid later
                })
                .catch((error) => {
                    console.error('Error fetching user:', error);
                    // Don't mark as attempted on error - allow retry
                    // This handles network errors, 500s, etc.
                });
        }
    }, [user, dispatch]);

    return user;
}
