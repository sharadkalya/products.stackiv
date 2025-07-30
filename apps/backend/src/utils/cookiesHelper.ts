const isProd = process.env.NODE_ENV === 'production';

export const commonCookieOptions = {
    secure: isProd, // true in prod (HTTPS), false in dev
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    domain: isProd ? '.stackiv.com' : undefined, // only set in prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
