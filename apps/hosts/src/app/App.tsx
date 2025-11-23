'use client';
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { setupAxiosInterceptors } from 'shared-api';
import { store } from 'shared-redux';

import { AuthProvider } from '@hosts/components/AuthProvider';
import { I18nProvider } from '@hosts/components/I18nProvider';

export default function App({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const interceptorsInitialized = useRef(false);

    useEffect(() => {
        // Initialize axios interceptors once
        if (!interceptorsInitialized.current) {
            setupAxiosInterceptors(store);
            interceptorsInitialized.current = true;
        }
    }, []);

    return (
        <I18nProvider>
            <Provider store={store}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </Provider>
        </I18nProvider>
    );
}
