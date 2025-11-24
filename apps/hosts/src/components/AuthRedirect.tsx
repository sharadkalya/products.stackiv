'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from 'shared-redux';

/**
 * Redirects authenticated users away from login/signup pages
 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    console.log('searchParams', searchParams);
    const user = useSelector(selectAuthUser);

    useEffect(() => {
        if (user) {
            const redirect = searchParams.get('redirect') || '/';
            console.log('redirect', searchParams.get('redirect'));
            router.replace(redirect);
        }
    }, [user, router, searchParams]);

    // Don't render children if user is authenticated
    if (user) {
        return null;
    }

    return <>{children}</>;
}
