/* eslint-disable no-console */

import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PUBLIC_ROUTES, PROTECTED_ROUTES, isRouteMatch } from 'shared-config';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

async function verifyToken(token: string): Promise<boolean> {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        await jwtVerify(token, secret);
        return true;
    } catch (error) {
        console.warn('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('Authorization')?.value;

    console.log('-------------------Middleware:-------------------');
    console.log('Path:', pathname);
    console.log('Has token:', !!token);
    console.log('-------------------Middleware:-------------------');

    const isPublic = isRouteMatch(pathname, PUBLIC_ROUTES);
    const isProtected = isRouteMatch(pathname, PROTECTED_ROUTES);

    const isTokenValid = token ? await verifyToken(token) : false;
    console.log('token && verifyToken(token)', isTokenValid);

    // If user has valid token and tries to access login/signup, redirect to home
    if (isTokenValid && isRouteMatch(pathname, ['/login', '/signup'])) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow public paths
    if (isPublic) return NextResponse.next();

    // Check protected paths - redirect to login if no valid token
    if (isProtected) {
        if (!isTokenValid) {
            console.warn('Protected route without valid token — redirecting to login');
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
