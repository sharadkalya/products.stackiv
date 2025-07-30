'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'shared-i18n';

export default function Home() {
    const { t } = useTranslation();
    const router = useRouter();

    const handleStackivDocsClick = () => {
        router.push('/stackivdocs');
    };

    const handleStackivChartsClick = () => {
        router.push('/stackivcharts');
    };

    const cards = [
        {
            heading: t('stackivDocsHeading'),
            title: t('stackivDocsTitle'),
            subtitle: t('stackivDocsSubtitle'),
            button: {
                title: t('stackivDocsButton'),
                action: handleStackivDocsClick,
            },
        },
        {
            heading: t('stackivChartsHeading'),
            title: t('stackivChartsTitle'),
            subtitle: t('stackivChartsSubtitle'),
            button: {
                title: t('stackivChartsButton'),
                action: handleStackivChartsClick,
            },
        },
    ];

    return (
        <div className="max-w-[1400px] p-10 flex gap-10 flex-col bg-base-100 text-base-content mx-auto">
            {cards.map((card, index) => (
                <div key={index} className="card bg-base-200 text-base-content full-width shadow-lg">
                    <div className="card-body items-center text-center">
                        <h1 className="text-3xl font-bold card-title text-primary">{card.heading}</h1>
                        <h2 className="text-2xl text-accent">
                            {card.title}
                        </h2>
                        <p className="mt-4 text-lg mb-15">
                            {card.subtitle}
                        </p>
                        <div className="card-actions justify-end">
                            <button onClick={card.button.action} className="btn btn-primary">
                                {card.button.title}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
