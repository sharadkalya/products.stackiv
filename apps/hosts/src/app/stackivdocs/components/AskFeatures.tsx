import { usePathname, useRouter } from 'next/navigation';

const features = [
    {
        id: 1,
        title: 'Summary',
        subtitle: 'Get quick overview of your documents',
        path: '/summary',
    },
    {
        id: 2,
        title: 'FAQ',
        subtitle: 'Generate Q&A based from your documents',
        path: '/faq',
    },
    {
        id: 3,
        title: 'Chat',
        subtitle: 'Interactive chat with your documents',
        path: '/chat',
    },
    {
        id: 4,
        title: 'Analysis',
        subtitle: 'Deep dive into your documents',
        path: '/analysis',
    },
];

export const AskFeatures = () => {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="shadow-lg bg-base-300 w-full p-10 rounded grid grid-cols-1 md:grid-cols-2 gap-10">
            {features.map((feature) => (
                <div
                    key={feature.id}
                    onClick={() => router.push(`${pathname}${feature.path}`)}
                    className="p-10 pb-5 pt-1 shadow-lg bg-base-100 cursor-pointer hover:bg-base-200 transition-colors flex flex-col justify-between"
                >
                    <h2 className="font-bold text-lg pt-0 mb-10 mt-3">{feature.title}</h2>
                    <p className="text-sm text-gray-500">{feature.subtitle}</p>
                </div>
            ))}
        </div>
    );
};
