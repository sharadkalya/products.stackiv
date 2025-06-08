'use client';
import { useTranslation } from 'shared-i18n';
import { useForm } from 'react-hook-form';
import { loginSchema } from 'shared-types';
import type { TLoginSchema } from 'shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import SocialLogin from '@hosts/components/common/SocialLogin';

export default function EmailLogin() {
    const { t } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<TLoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: TLoginSchema) => {
        console.log(data);
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
            <div className="divider">{t('or')}</div>
            <SocialLogin />
        </div>
    );
}
