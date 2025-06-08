import Logo from '@hosts/components/common/Logo';

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="loginLayout flex flex-col space-y-8 items-center md:items-center md:justify-center min-h-screen sm:justify-start pt-5">
            <Logo />
            <div className="w-full max-w-md p-6 rounded-lg shadow bg-base-300">
                {children}
            </div>
        </div>
    );
}
