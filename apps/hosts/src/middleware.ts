/* eslint-disable no-console */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PUBLIC_ROUTES, PROTECTED_ROUTES, isRouteMatch } from 'shared-config';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('Authorization')?.value;
    const refreshToken = request.cookies.get('RefreshToken')?.value;

    console.log('-------------------Middleware:-------------------');
    console.log('Path:', pathname);
    console.log('Has token:', !!token);
    console.log('Has refresh token:', !!refreshToken);
    console.log('-------------------Middleware:-------------------');

    const isPublic = isRouteMatch(pathname, PUBLIC_ROUTES);
    const isProtected = isRouteMatch(pathname, PROTECTED_ROUTES);

    // Check if user has either access token or refresh token (backend will handle verification/refresh)
    const hasAuthCookie = !!(token || refreshToken);

    // If user has auth cookie and tries to access login/signup, redirect to home
    if (hasAuthCookie && isRouteMatch(pathname, ['/login', '/signup'])) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow public paths
    if (isPublic) return NextResponse.next();

    // Check protected paths - redirect to login if no auth cookies
    if (isProtected) {
        if (!hasAuthCookie) {
            console.warn('Protected route without auth cookies — redirecting to login');
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
