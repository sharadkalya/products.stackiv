'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signInWithEmailPassword } from 'shared-auth';
import { useTranslation } from 'shared-i18n';
import { loginSchema } from 'shared-types';
import type { TLoginSchema } from 'shared-types';

import Alert, { AlertVariant } from '@common/Alert';
import SocialLogin from '@common/SocialLogin';

export default function EmailLogin() {
    const { t } = useTranslation();
    const router = useRouter();
    const [alertTitle, setAlertTitle] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TLoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: TLoginSchema) => {
        try {
            setAlertTitle('');
            const { email, password } = data;
            const res = await signInWithEmailPassword({ email, password });
            const { success, message, emailVerified, user } = res;
            console.log('res is', res);
            if (success && emailVerified && user) {
                // Todo: Add entry to mongoDB in BE with emailVerified as false
                console.log('all good');;
                localStorage.setItem('authToken', user?.uid);
                router.replace('/');
            } else {
                setAlertTitle(t(message));
            }
        } catch (error) {
            console.log('error in loginaaa', error);
        }
    };

    return (
        <div className="emailLogin">
            <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset className="fieldset flex flex-col space-y-4">
                    <div className="flex flex-col space-y-1">
                        <label className="label">
                            <span className="label-text">{t('email')}</span>
                        </label>
                        <input
                            {...register('email')}
                            type="text"
                            className={`input w-full ${errors.email ? 'input-error' : ''}`}
                            placeholder={t('emailPlaceholder')}
                        />
                        {errors.email && (
                            <span className="text-error text-sm">{errors.email.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col space-y-1">
                        <label className="label">{t('password')}</label>
                        <input
                            {...register('password')}
                            type="password"
                            className={`input w-full ${errors.email ? 'input-error' : ''}`}
                            placeholder={t('passwordPlaceholder')}
                        />
                        {errors.password && (
                            <span className="text-error text-sm">{errors.password.message}</span>
                        )}
                    </div>
                    <button disabled={isSubmitting} type="submit" className="btn btn-primary">
                        {isSubmitting && (<span className="loading loading-ring"></span>)}
                        {t('login')}
                    </button>
                </fieldset>
            </form>
            <div className="text-sm text-center mt-4">
                <span>{t('noAccount')} </span>
                <Link href="/signup" className="link link-primary">
                    {t('signUp')}
                </Link>
            </div>
            {alertTitle && (
                <div className='mt-4 mb-4'>
                    <Alert variant={AlertVariant.Error} title={alertTitle} />
                </div>
            )}

            <div className="divider">{t('or')}</div>
            <SocialLogin />
        </div>
    );
}
