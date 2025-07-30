'use client';

import Footer from './nav/Footer';
import Header from './nav/Header';

export default function CommonLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1">
                <main className="flex-1">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
}
