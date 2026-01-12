'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { sendPasswordReset } from 'shared-auth';
import { useTranslation } from 'shared-i18n';
import { z } from 'zod';

import Alert, { AlertVariant } from '@common/Alert';

const forgotPasswordSchema = z.object({
    email: z.string().email('invalidEmailError'),
});

type TForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    const { t } = useTranslation();
    const [alertType, setAlertType] = useState<'success' | 'error' | ''>('');
    const [alertMessage, setAlertMessage] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<TForgotPasswordSchema>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: TForgotPasswordSchema) => {
        setAlertType('');
        setAlertMessage('');

        try {
            const result = await sendPasswordReset(data.email);

            if (result.success) {
                setAlertType('success');
                setAlertMessage(t(result.message));
                reset();
                // Close modal after 3 seconds on success
                setTimeout(() => {
                    onClose();
                    setAlertType('');
                    setAlertMessage('');
                }, 3000);
            } else {
                setAlertType('error');
                setAlertMessage(t(result.message));
            }
        } catch (error) {
            console.error('Error sending password reset:', error);
            setAlertType('error');
            setAlertMessage(t('couldntSendResetEmail'));
        }
    };

    const handleClose = () => {
        reset();
        setAlertType('');
        setAlertMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">{t('resetPassword')}</h3>
                <p className="text-sm text-base-content/70 mb-4">
                    {t('resetPasswordInstructions')}
                </p>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">{t('email')}</span>
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder={t('emailPlaceholder')}
                            className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                        />
                        {errors.email && (
                            <label className="label">
                                <span className="label-text-alt text-error">
                                    {t(errors.email.message as string)}
                                </span>
                            </label>
                        )}
                    </div>

                    {alertMessage && (
                        <div className="mb-4">
                            <Alert
                                variant={alertType === 'success' ? AlertVariant.Success : AlertVariant.Error}
                                title={alertMessage}
                            />
                        </div>
                    )}

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <span className="loading loading-spinner loading-sm"></span>}
                            {t('sendResetLink')}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={handleClose}></div>
        </div>
    );
}
