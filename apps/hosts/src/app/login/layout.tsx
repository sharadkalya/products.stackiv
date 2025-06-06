export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="loginLayout flex md:items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-6 rounded-lg shadow">
                {children}
            </div>
        </div>
    );
}
