'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export const Breadcrumb = () => {
    const pathname = usePathname();

    // Split the pathname into segments
    const pathSegments = pathname.split('/').filter((segment) => segment !== '');

    // Generate breadcrumbs dynamically from path segments
    const breadcrumbs = pathSegments.map((segment, index) => {
        const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = segment.replace(/-/g, ' ');
        return {
            label,
            url,
        };
    });

    return (
        <div className="breadcrumbs">
            <ul className="flex">
                <li>
                    <Link href="/" className="hover:underline text-base-content capitalize">
                        Products Home
                    </Link>
                </li>
                {breadcrumbs.map((breadcrumb, index) => (
                    <li key={index} className="flex items-center space-x-2">
                        <span className="text-gray-500">/</span>
                        <Link
                            href={breadcrumb.url}
                            className="hover:underline text-base-content capitalize"
                        >
                            {breadcrumb.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};
