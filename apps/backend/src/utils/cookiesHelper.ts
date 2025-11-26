import type { CookieOptions } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export const commonCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd, // true in prod (HTTPS), false in dev
    sameSite: isProd ? 'none' : 'lax',
    domain: isProd ? '.stackiv.com' : undefined, // parent domain in prod, no domain in dev
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
