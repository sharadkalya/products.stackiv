'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface MenuItem {
    name: string;
    route: string;
}

interface OdooSidebarProps {
    className?: string;
}

export function OdooSidebar({ className = '' }: OdooSidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const getMenuIcon = (name: string) => {
        const iconMap: Record<string, string> = {
            'Dashboard': '📊',
            'Customers': '👥',
            'Sales Orders': '🛒',
            'Invoices': '📄',
            'Odoo Connection Setup': '🔗',
            'Sync History': '🔄',
            'Account Settings': '⚙️',
            'Logout': '🚪',
        };
        return iconMap[name] || '📌';
    };

    const primaryMenuItems: MenuItem[] = [
        { name: 'Dashboard', route: '/odoo/dashboard' },
        { name: 'Customers', route: '/odoo/customers' },
        { name: 'Sales Orders', route: '/odoo/sales-orders' },
        { name: 'Invoices', route: '/odoo/invoices' },
    ];

    const integrationMenuItems: MenuItem[] = [
        { name: 'Odoo Connection Setup', route: '/odoo/connection-setup' },
        { name: 'Sync History', route: '/odoo/sync-history' },
    ];

    const accountMenuItems: MenuItem[] = [
        { name: 'Account Settings', route: '/odoo/account-settings' },
        { name: 'Logout', route: '/odoo/logout' },
    ];

    const isActiveRoute = (route: string) => {
        // Treat /odoo as /odoo/dashboard
        if (pathname === '/odoo' && route === '/odoo/dashboard') {
            return true;
        }
        return pathname === route;
    };

    const renderMenuItems = (items: MenuItem[]) => {
        return items.map((item) => (
            <Link
                key={item.route}
                href={item.route}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                    isActiveRoute(item.route)
                        ? 'bg-primary text-primary-content'
                        : 'text-base-content hover:bg-primary hover:text-primary-content'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : ''}
            >
                <span className="text-lg flex-shrink-0 w-6 text-center">{getMenuIcon(item.name)}</span>
                <span className={`whitespace-nowrap transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>{item.name}</span>
            </Link>
        ));
    };

    return (
        <aside
            className={`bg-base-100 transition-all duration-300 overflow-hidden flex flex-col sticky top-19 ${
                isCollapsed ? 'w-16' : 'w-64'
            } ${className}`}
            style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}
        >
            {/* Header with collapse toggle */}
            <div className="p-4 border-b-2 border-base-content/20 flex items-center justify-between flex-shrink-0">
                <h2 className={`text-lg font-semibold text-base-content whitespace-nowrap transition-opacity duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>Odoo Menu</h2>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 rounded hover:bg-base-200 text-base-content flex-shrink-0"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? '→' : '←'}
                </button>
            </div>

            {/* Menu sections */}
            <nav className="flex-1 p-4 space-y-6">
                {/* Primary Menu Items */}
                <div className="space-y-1">
                    {renderMenuItems(primaryMenuItems)}
                </div>

                {/* Divider */}
                <div className="border-t-2 border-base-content/20"></div>

                {/* Integration Menu Items */}
                <div className="space-y-1">
                    {renderMenuItems(integrationMenuItems)}
                </div>

                {/* Divider */}
                <div className="border-t-2 border-base-content/20"></div>

                {/* Account Menu Items */}
                <div className="space-y-1">
                    {renderMenuItems(accountMenuItems)}
                </div>
            </nav>
        </aside>
    );
}
