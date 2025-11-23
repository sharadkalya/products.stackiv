/* eslint-disable no-console */

import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/signup', '/about'];
const protectedPaths = ['/dashboard', '/account', '/settings'];
const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

const isPathMatch = (pathname: string, paths: string[]) =>
    paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

function verifyToken(token: string): boolean {
    try {
        jwt.verify(token, JWT_SECRET);
        return true;
    } catch (error) {
        console.warn('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
        return false;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('Authorization')?.value;

    console.log('-------------------Middleware Cookies:-------------------');
    request.cookies.getAll().forEach(({ name, value }) =>
        console.log(`${name}: ${value}`),
    );
    console.log('-------------------Middleware Cookies:-------------------');

    const isPublic = isPathMatch(pathname, publicPaths);
    const isProtected = isPathMatch(pathname, protectedPaths);

    // If user has valid token and tries to access login/signup, redirect to home
    if (token && verifyToken(token) && isPathMatch(pathname, ['/login', '/signup'])) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow public paths
    if (isPublic) return NextResponse.next();

    // Check protected paths
    if (isProtected) {
        if (!token || !verifyToken(token)) {
            console.warn('Missing or invalid token — redirecting to login');

            const response = NextResponse.redirect(new URL('/login', request.url));

            // Clear the Authorization cookie
            response.cookies.set('Authorization', '', {
                path: '/',
                expires: new Date(0), // Expire immediately
                domain: isProd ? '.stackiv.com' : undefined, // Add domain for prod
            });

            // Clear RefreshToken cookie as well
            response.cookies.set('RefreshToken', '', {
                path: '/',
                expires: new Date(0),
                domain: isProd ? '.stackiv.com' : undefined,
            });

            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
