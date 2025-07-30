'use client';

export default function Footer() {
    return (
        <footer className="w-full bg-base-200 text-center py-4 mt-8 shadow-inner">
            <span className="text-base-content">
                © {new Date().getFullYear()} Stackiv. All rights reserved.
            </span>
        </footer>
    );
}
