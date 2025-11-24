'use client';
import { Provider } from 'react-redux';
import { store } from 'shared-redux';

import { AuthProvider } from '@hosts/components/AuthProvider';
import { I18nProvider } from '@hosts/components/I18nProvider';

export default function App({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
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
