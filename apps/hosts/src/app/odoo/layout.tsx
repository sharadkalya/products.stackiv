import { OdooSidebar } from './components/OdooSidebar';

export default function OdooLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-full">
            <OdooSidebar />
            <main className="flex-1 p-4 border-l-2 border-base-content/20">
                {children}
            </main>
        </div>
    );
}
