/* eslint-disable no-console */

import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/signup', '/about'];
const protectedPaths = ['/dashboard', '/account', '/settings'];
const isProd = process.env.NODE_ENV === 'production';

const isPathMatch = (pathname: string, paths: string[]) =>
    paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

function isTokenExpired(token: string): boolean {
    const decoded = jwt.decode(token);
    if (
        decoded &&
        typeof decoded === 'object' &&
        'exp' in decoded &&
        typeof decoded.exp === 'number'
    ) {
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now;
    }
    return true; // treat as expired if can't parse
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

    if (token && isPathMatch(pathname, ['/login', '/signup'])) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (isPublic) return NextResponse.next();

    if (isProtected) {
        if (!token || isTokenExpired(token)) {
            console.warn('Missing or expired token — redirecting to login');

            const response = NextResponse.redirect(new URL('/login', request.url));

            // Clear the Authorization cookie
            response.cookies.set('Authorization', '', {
                path: '/',
                expires: new Date(0), // Expire immediately
                domain: isProd ? '.stackiv.com' : undefined, // Add domain for prod
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
