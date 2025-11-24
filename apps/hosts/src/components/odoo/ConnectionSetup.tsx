'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getOdooConnection, testOdooConnection } from 'shared-api';
import { ODOO_FORM_LABELS, ODOO_FORM_PLACEHOLDERS, ODOO_MESSAGES } from 'shared-config';
import { OdooConnectionPayload, OdooConnectionSchema } from 'shared-types';

import FormInput from '../common/FormInput';

type AlertType = 'success' | 'error' | 'info' | null;

interface Alert {
    type: AlertType;
    message: string;
}

const ConnectionSetup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [alert, setAlert] = useState<Alert | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<OdooConnectionPayload>({
        resolver: zodResolver(OdooConnectionSchema),
    });

    // Fetch existing connection details on component mount
    useEffect(() => {
        const fetchExistingConnection = async () => {
            try {
                const response = await getOdooConnection();
                if (response.exists && response.connection) {
                    const { orgName, odooUrl, dbName, username, status } = response.connection;

                    // Populate form with existing values
                    setValue('orgName', orgName);
                    setValue('odooUrl', odooUrl);
                    setValue('dbName', dbName);
                    setValue('username', username);

                    // Show info message about existing connection
                    if (status === 'success') {
                        setAlert({
                            type: 'success',
                            message: 'Previously saved connection found. You can update any field and test again.',
                        });
                    } else if (status === 'fail') {
                        setAlert({
                            type: 'error',
                            message: 'Previous connection attempt failed. Please verify your credentials.',
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching existing connection:', error);
                // Don't show error to user, just let them fill the form fresh
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchExistingConnection();
    }, [setValue]);

    const onSubmit = async (data: OdooConnectionPayload) => {
        setIsLoading(true);
        setAlert({ type: 'info', message: ODOO_MESSAGES.TESTING_CONNECTION });

        try {
            const response = await testOdooConnection(data);

            if (response.success) {
                setAlert({ type: 'success', message: ODOO_MESSAGES.TEST_CONNECTION_SUCCESS });
            } else {
                setAlert({ type: 'error', message: response.message || ODOO_MESSAGES.TEST_CONNECTION_FAIL });
            }
        } catch (error: unknown) {
            const errorMessage =
                error && typeof error === 'object' && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            setAlert({
                type: 'error',
                message: errorMessage || ODOO_MESSAGES.TEST_CONNECTION_ERROR,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetchingData) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-center items-center py-8">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl p-3">
            <div className="card bg-base-100">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">Odoo Connection Setup</h2>
                    <p className="text-base-content/70 mb-6">
                        Connect your Odoo instance to sync your data seamlessly.
                    </p>

                    {alert && (
                        <div
                            className={`alert ${
                                alert.type === 'success'
                                    ? 'alert-success'
                                    : alert.type === 'error'
                                        ? 'alert-error'
                                        : 'alert-info'
                            } mb-4`}
                        >
                            <span>{alert.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <FormInput
                            label={ODOO_FORM_LABELS.ORG_NAME}
                            placeholder={ODOO_FORM_PLACEHOLDERS.ORG_NAME}
                            register={register('orgName')}
                            error={errors.orgName?.message}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.ODOO_URL}
                            placeholder={ODOO_FORM_PLACEHOLDERS.ODOO_URL}
                            type="url"
                            register={register('odooUrl')}
                            error={errors.odooUrl?.message}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.DB_NAME}
                            placeholder={ODOO_FORM_PLACEHOLDERS.DB_NAME}
                            register={register('dbName')}
                            error={errors.dbName?.message}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.USERNAME}
                            placeholder={ODOO_FORM_PLACEHOLDERS.USERNAME}
                            register={register('username')}
                            error={errors.username?.message}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.PASSWORD}
                            placeholder={ODOO_FORM_PLACEHOLDERS.PASSWORD}
                            type="password"
                            register={register('password')}
                            error={errors.password?.message}
                        />

                        <div className="card-actions justify-end mt-6">
                            <button
                                type="submit"
                                className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Testing...
                                    </>
                                ) : (
                                    'Test Connection'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConnectionSetup;
