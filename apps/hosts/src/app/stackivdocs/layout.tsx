import { Breadcrumb } from '@common/Breadcrumb';

export default function StackivDocsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <div className='p-5'>
                <div className='shadow-sm border-base-100 p-5'><Breadcrumb /></div>
            </div>
            <div className='p-5'>
                {children}
            </div>
        </div>
    );
}
