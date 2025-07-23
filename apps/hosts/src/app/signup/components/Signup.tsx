'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { signUpWithEmailPassword } from 'shared-auth';
import { useTranslation } from 'shared-i18n';
import { signupAction } from 'shared-redux';
import type { ISignupResult, SignupPayload, TSignupSchema } from 'shared-types';
import { signupSchema, UserRoles } from 'shared-types';

import Alert, { AlertVariant } from '@common/Alert';
import FormInput from '@common/FormInput';
import SocialLogin from '@common/SocialLogin';

export default function Signup() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [alertType, setAlertType] = useState<string>('');
    const [alertTitle, setAlertTitle] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<TSignupSchema>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: TSignupSchema) => {
        setAlertTitle('');
        setAlertType('');
        try {
            const { email, password } = data;
            const res: ISignupResult = await signUpWithEmailPassword({ email, password });
            const { success, message, user, emailVerified = false } = res;
            console.log('res', res);
            if (success && user && user.email) {
                // Todo: Add entry to mongoDB in BE with emailVerified as false
                setAlertType('success');
                setAlertTitle(t(message));
                const { email, uid: firebaseUid } = user;
                const signupPayload: SignupPayload = {
                    firebaseUid,
                    email,
                    emailVerified,
                    roles: [UserRoles.Host],
                    password,
                };
                await dispatch(signupAction(signupPayload));
                reset();
            } else {
                setAlertType('error');
                setAlertTitle(t(message));
            }
        } catch (error) {
            console.log('Error in onSubmit::signUpWithEmailPassword', error);
        }
    };

    return (
        <div className="emailSignup w-full">
            <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset className="fieldset flex flex-col space-y-4">
                    <FormInput
                        label={t('email')}
                        placeholder={t('emailPlaceholder')}
                        error={errors.email?.message}
                        register={register('email')}
                    />
                    <FormInput
                        label={t('password')}
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        error={errors.password?.message}
                        register={register('password')}
                    />
                    <FormInput
                        label={t('confirmPassword')}
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        error={errors.confirmPassword?.message}
                        register={register('confirmPassword')}
                    />
                    <button disabled={isSubmitting} type="submit" className="btn btn-primary">
                        {isSubmitting && (<span className="loading loading-ring"></span>)}
                        {t('Signup')}
                    </button>
                </fieldset>
            </form>
            <div className="text-sm text-center mt-4">
                <span>{t('noAccount')} </span>
                <Link href="/login" className="link link-primary">
                    {t('login')}
                </Link>
            </div>
            <div className="divider">{t('or')}</div>
            {alertType && (
                <div className='mt-4 mb-4'>
                    <Alert variant={alertType as AlertVariant} title={alertTitle} />
                </div>
            )}
            <SocialLogin />
        </div>
    );
}
