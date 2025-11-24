'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from 'shared-redux';

/**
 * Redirects authenticated users away from login/signup pages
 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const user = useSelector(selectAuthUser);

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [user, router]);

    // Don't render children if user is authenticated
    if (user) {
        return null;
    }

    return <>{children}</>;
}
