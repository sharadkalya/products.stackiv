'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { signInWithEmailPassword, resendVerificationEmail } from 'shared-auth';
import { useTranslation } from 'shared-i18n';
import { AppDispatch, loginAction } from 'shared-redux';
import { loginFormSchema } from 'shared-types';
import type { LoginPayload, TLoginFormSchema } from 'shared-types';

import Alert, { AlertVariant } from '@common/Alert';
import SocialLogin from '@common/SocialLogin';
import { logMsg } from '@hosts/utils/logUtility';

import ForgotPasswordModal from './ForgotPasswordModal';

export default function EmailLogin() {
    const dispatch = useDispatch<AppDispatch>();
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [alertTitle, setAlertTitle] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'info'>('error');
    const [isLoading, setIsLoading] = useState(false);
    const [showEmailNotVerified, setShowEmailNotVerified] = useState(false);
    const [isResendingEmail, setIsResendingEmail] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        getValues,
    } = useForm<TLoginFormSchema>({
        resolver: zodResolver(loginFormSchema),
    });

    const onSubmit = async (data: TLoginFormSchema) => {
        try {
            setIsLoading(true);
            setAlertTitle('');
            setShowEmailNotVerified(false);
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
                const redirect = searchParams.get('redirect') || '/';
                router.replace(redirect);
            } else if (success && !emailVerified) {
                // Email not verified - show resend option
                setShowEmailNotVerified(true);
                setAlertType('info');
                setAlertTitle(t('emailNotVerified'));
            } else {
                setAlertType('error');
                setAlertTitle(t(message));
            }
        } catch (error) {
            logMsg('EmailLogin', 'error in login', error);
            setAlertType('error');
            setAlertTitle(t('couldntLoginUser'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            setIsResendingEmail(true);
            setAlertTitle('');

            const formData = getValues();
            const { email, password } = formData;

            if (!email || !password) {
                setAlertType('error');
                setAlertTitle(t('invalidCredentials'));
                return;
            }

            const res = await resendVerificationEmail({ email, password });

            if (res.success) {
                setAlertType('success');
                setAlertTitle(t(res.message));
                setShowEmailNotVerified(false);
            } else {
                setAlertType('error');
                setAlertTitle(t(res.message));
            }
        } catch (error) {
            logMsg('EmailLogin', 'error in resend verification', error);
            setAlertType('error');
            setAlertTitle(t('couldntResendEmail'));
        } finally {
            setIsResendingEmail(false);
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
                            className={`input w-full ${errors.password ? 'input-error' : ''}`}
                            placeholder={t('passwordPlaceholder')}
                        />
                        {errors.password && (
                            <span className="text-error text-sm">{errors.password.message}</span>
                        )}
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <button
                            type="button"
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="link link-primary text-sm"
                        >
                            {t('forgotPassword')}
                        </button>
                    </div>

                    <button disabled={isSubmitting} type="submit" className="btn btn-primary">
                        {(isSubmitting || isLoading) && (<span className="loading loading-ring"></span>)}
                        {t('login')}
                    </button>
                </fieldset>
            </form>

            {/* Email Not Verified Alert with Resend Button */}
            {showEmailNotVerified && alertTitle && (
                <div className='mt-4'>
                    <Alert variant={AlertVariant.Info} title={alertTitle} />
                    <p className="text-sm text-base-content/70 mt-2 mb-3">
                        {t('checkYourEmail')}
                    </p>
                    <button
                        onClick={handleResendVerification}
                        disabled={isResendingEmail}
                        className="btn btn-outline btn-sm w-full"
                    >
                        {isResendingEmail && <span className="loading loading-spinner loading-sm"></span>}
                        {t('resendVerification')}
                    </button>
                </div>
            )}

            {/* Other Alerts */}
            {alertTitle && !showEmailNotVerified && (
                <div className='mt-4'>
                    <Alert
                        variant={alertType === 'success' ? AlertVariant.Success : AlertVariant.Error}
                        title={alertTitle}
                    />
                </div>
            )}

            <div className="text-sm text-center mt-4">
                <span>{t('noAccount')} </span>
                <Link href="/signup" className="link link-primary">
                    {t('signUp')}
                </Link>
            </div>

            <div className="divider">{t('or')}</div>
            <SocialLogin />

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </div>
    );
}
