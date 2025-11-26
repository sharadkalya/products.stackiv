'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from 'shared-api';
import { AppDispatch, selectAuthUser, setUser, logout } from 'shared-redux';

export function useAuth() {
    const dispatch = useDispatch<AppDispatch>();
    const user = useSelector(selectAuthUser);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        // If we already have a user in Redux or we already attempted a fetch, do nothing
        if (user || hasFetchedRef.current) return;

        hasFetchedRef.current = true;

        getCurrentUser()
            .then((fetchedUser) => {
                if (fetchedUser) {
                    dispatch(setUser(fetchedUser));
                } else {
                    // No valid user from server – clear any stale Redux user
                    dispatch(logout());
                }
            })
            .catch((error) => {
                console.error('Error fetching user:', error);
                // On error, also clear stale auth state
                dispatch(logout());
            });
    }, [user, dispatch]);

    return user;
}
