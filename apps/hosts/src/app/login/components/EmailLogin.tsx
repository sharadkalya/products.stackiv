'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { signInWithEmailPassword } from 'shared-auth';
import { useTranslation } from 'shared-i18n';
import { AppDispatch, loginAction } from 'shared-redux';
import { loginFormSchema } from 'shared-types';
import type { LoginPayload, TLoginFormSchema } from 'shared-types';

import Alert, { AlertVariant } from '@common/Alert';
import SocialLogin from '@common/SocialLogin';
import { logMsg } from '@hosts/utils/logUtility';

export default function EmailLogin() {
    const dispatch = useDispatch<AppDispatch>();
    const { t } = useTranslation();
    const router = useRouter();
    const [alertTitle, setAlertTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TLoginFormSchema>({
        resolver: zodResolver(loginFormSchema),
    });

    const onSubmit = async (data: TLoginFormSchema) => {
        try {
            setIsLoading(true);
            setAlertTitle('');
            const { email, password } = data;
            const res = await signInWithEmailPassword({ email, password });
            const { success, message, emailVerified, user } = res;
            if (success && emailVerified && user && user.email && user.accessToken) {
                const action: LoginPayload = {
                    email: user.email,
                    firebaseUid: user.uid,
                    firebaseAccessToken: user.accessToken,
                    password,
                };
                await dispatch(loginAction(action));
                router.replace('/');
            } else {
                setAlertTitle(t(message));
            }
        } catch (error) {
            logMsg('EmailLogin', 'error in login', error);
        } finally {
            setIsLoading(false);
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
                        {(isSubmitting || isLoading) && (<span className="loading loading-ring"></span>)}
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
