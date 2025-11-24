import { OdooSidebar } from './components/OdooSidebar';

export default function OdooLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen">
            <OdooSidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50">
                {children}
            </main>
        </div>
    );
}
