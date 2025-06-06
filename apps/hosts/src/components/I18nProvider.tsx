'use client';

import { useEffect, useState } from 'react';
import { initI18nWeb } from 'shared-i18n';

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        initI18nWeb().then(() => {
            setReady(true);
        });
    }, []);

    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return <>{children}</>;
};
