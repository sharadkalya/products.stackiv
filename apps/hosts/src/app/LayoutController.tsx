'use client';

import { usePathname } from 'next/navigation';

import CommonLayout from '../components/CommonLayout';

const ROUTE_LAYOUT_RULES = [
    { match: 'startsWith', path: '/admin/', wrap: false },
];

function shouldWrap(pathname: string): boolean {
    const rule = ROUTE_LAYOUT_RULES.find(r =>
        r.match === 'startsWith'
            ? pathname.startsWith(r.path)
            : pathname === r.path,
    );
    return rule?.wrap ?? true;
}

export function LayoutController({
    children,
}: {
  children: React.ReactNode;
}) {
    const pathname = usePathname();
    return shouldWrap(pathname) ? (
        <CommonLayout>{children}</CommonLayout>
    ) : (
        <>{children}</>
    );
}
