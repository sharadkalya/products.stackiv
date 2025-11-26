'use client';

import Link from 'next/link';
import { useAppSelector, selectAuthUser } from 'shared-redux';

export function OdooApp() {
    const user = useAppSelector(selectAuthUser);

    if (!user) {
        return (
            <div className="flex min-h-screen">
                <div className="text-center">
                    <p className="mb-4 text-lg">Please log in to continue</p>
                    <Link
                        href="/login?redirect=/odoo"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Login or Sign up
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            hello
        </div>
    );
}
