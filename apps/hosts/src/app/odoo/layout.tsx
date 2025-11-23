export default function OdooLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="loginLayout flex flex-col space-y-8 min-h-screen sm:justify-start pt-5">
            <div className="w-full max-w-md p-6 rounded-lg shadow bg-base-300">
                {children}
            </div>
        </div>
    );
}
