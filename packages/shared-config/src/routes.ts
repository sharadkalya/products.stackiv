/**
 * Shared route configuration - Single source of truth for all route definitions
 * Update this file when adding new public or protected routes
 */

export const PUBLIC_ROUTES = ['/', '/login', '/signup', '/about'];

export const PROTECTED_ROUTES = ['/dashboard', '/account', '/settings'];

/**
 * Check if a pathname matches any route in the given list
 */
export function isRouteMatch(pathname: string, routes: string[]): boolean {
    return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
