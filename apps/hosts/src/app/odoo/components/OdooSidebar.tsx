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
        return pathname === route;
    };

    const renderMenuItems = (items: MenuItem[]) => {
        return items.map((item) => (
            <Link
                key={item.route}
                href={item.route}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActiveRoute(item.route)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : ''}
            >
                <span className={`flex items-center ${isCollapsed ? 'hidden' : ''}`}>
                    ◼ {item.name}
                </span>
                {isCollapsed && <span>◼</span>}
            </Link>
        ));
    };

    return (
        <aside
            className={`bg-white border-r border-gray-200 transition-all duration-300 ${
                isCollapsed ? 'w-16' : 'w-64'
            } ${className}`}
        >
            <div className="flex flex-col h-full">
                {/* Header with collapse toggle */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    {!isCollapsed && (
                        <h2 className="text-lg font-semibold text-gray-800">Odoo Menu</h2>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-600"
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Menu sections */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {/* Primary Menu Items */}
                    <div className="space-y-1">
                        {renderMenuItems(primaryMenuItems)}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-300"></div>

                    {/* Integration Menu Items */}
                    <div className="space-y-1">
                        {renderMenuItems(integrationMenuItems)}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-300"></div>

                    {/* Account Menu Items */}
                    <div className="space-y-1">
                        {renderMenuItems(accountMenuItems)}
                    </div>
                </nav>
            </div>
        </aside>
    );
}
