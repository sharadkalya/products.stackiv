/**
 * Shared route configuration - Single source of truth for all route definitions
 * Update this file when adding new public or protected routes
 */

export const PUBLIC_ROUTES = ['/', '/login', '/signup', '/about'];

export const PROTECTED_ROUTES = [
    '/dashboard',
    '/account',
    '/settings',
    '/odoo',
    '/odoo/dashboard',
    '/odoo/customers',
    '/odoo/sales-orders',
    '/odoo/invoices',
    '/odoo/connection-setup',
    '/odoo/sync-history',
    '/odoo/account-settings',
    '/odoo/logout',
];

/**
 * Check if a pathname matches any route in the given list
 */
export function isRouteMatch(pathname: string, routes: string[]): boolean {
    return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
