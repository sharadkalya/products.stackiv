'use client';
import { useForm } from 'react-hook-form';
import { signupSchema } from 'shared-types';
import type { TSignupSchema } from 'shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import SocialLogin from '@hosts/components/common/SocialLogin';
import { useTranslation } from 'shared-i18n';

export default function Signup() {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TSignupSchema>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = (data: TSignupSchema) => {
        console.log(data);
    };

    const renderError = (msg: string) => {
        return <span className="text-error text-sm">{t(msg)}</span>;
    };

    return (
        <div className="emailSignup w-full">
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
                            renderError(errors.email.message as string)
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
                            renderError(errors.password.message as string)
                        )}
                    </div>
                    <div className="flex flex-col space-y-1">
                        <label className="label">{t('confirmPassword')}</label>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            className={`input w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                            placeholder={t('passwordPlaceholder')}
                        />
                        {errors.confirmPassword && (
                            renderError(errors.confirmPassword.message as string)
                        )}
                    </div>
                    <button disabled={isSubmitting} type="submit" className="btn btn-primary">
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
            <SocialLogin />
        </div>
    );
}
