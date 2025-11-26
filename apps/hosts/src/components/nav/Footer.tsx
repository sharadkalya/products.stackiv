'use client';

export default function Footer() {
    return (
        <footer className="w-full bg-base-200 text-center py-2 shadow-inner">
            <span className="text-base-content text-xs">
                © {new Date().getFullYear()} Stackiv. All rights reserved.
            </span>
        </footer>
    );
}
