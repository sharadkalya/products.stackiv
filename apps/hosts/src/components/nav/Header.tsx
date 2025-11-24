'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from 'shared-redux';

import LogoutButton from '@common/LogoutButton';

const isProd = process.env.NODE_ENV === 'production';

export default function Header() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const user = useSelector(selectAuthUser);

    const handleLoginClick = () => {
        setMenuOpen(false);
        router.push('/login');
    };

    const handleOverlayClick = () => {
        setMenuOpen(false);
    };

    const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isProd) {
            e.preventDefault();
            window.location.href = 'https://www.stackiv.com';
        } else {
            // Prevent reload if already at "/"
            if (window.location.pathname === '/') {
                e.preventDefault();
            }
        }
    };

    return (
        <header className="w-full bg-base-200 shadow-md px-5 py-4 md:px-10 md:py-5 flex items-center justify-between relative sticky top-0">
            {/* Brand */}
            <div className="flex items-center">
                <Link
                    href="/"
                    className="text-2xl font-bold text-primary"
                    onClick={handleLogoClick}
                >
                    Stackiv
                </Link>
            </div>

            {/* Desktop auth buttons */}
            <div className="hidden lg:flex items-center gap-4">
                {user ? (
                    <LogoutButton />
                ) : null}
            </div>

            {/* Hamburger for mobile (only when menu is closed) */}
            {!menuOpen && (
                <button
                    className="lg:hidden text-2xl ml-auto"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                >
                    <span>&#9776;</span> {/* Hamburger icon */}
                </button>
            )}

            {/* Drawer for mobile menu */}
            <div
                className={`fixed top-0 right-0 h-full w-64 bg-base-100 shadow-lg transform transition-transform duration-300 z-50
                ${menuOpen ? 'translate-x-0' : 'translate-x-full'} lg:hidden`}
            >
                {/* Close button inside the drawer */}
                {menuOpen && (
                    <div className="flex justify-end p-4">
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="text-2xl"
                            aria-label="Close menu"
                        >
                            &#10005;
                        </button>
                    </div>
                )}

                {/* Menu items */}
                <nav className="flex flex-col items-start p-4 space-y-2">
                    {user ? (
                        <LogoutButton />
                    ) : (
                        <button
                            className="btn btn-primary w-full"
                            onClick={handleLoginClick}
                        >
                            Login
                        </button>
                    )}
                </nav>
            </div>

            {/* Overlay: closes menu when tapped */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-30 z-40"
                    onClick={handleOverlayClick}
                />
            )}
        </header>
    );
}
