// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
    '/login',
    '/signup',
    '/about',
];

const protectedPaths = [
    '/',
    '/dashboard',
    '/account',
    '/settings',
];

// Helper to check if a path matches any prefix in a list
function pathMatches(path: string, paths: string[]) {
    return paths.some((p) => path === p || path.startsWith(p + '/'));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('Authorization');

    const isPublic = pathMatches(pathname, publicPaths);
    const isProtected = pathMatches(pathname, protectedPaths);

    // Redirect authenticated users away from login/signup
    if (token && (pathname === '/login' || pathname === '/signup')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow public paths without auth
    if (isPublic) {
        return NextResponse.next();
    }

    // Require token for protected paths
    if (isProtected && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Default: allow
    return NextResponse.next();
}

// Apply middleware to all routes, you can restrict here if needed
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
