'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getOdooConnection, saveOdooConnection, testOdooConnection } from 'shared-api';
import { ODOO_FORM_LABELS, ODOO_FORM_PLACEHOLDERS, ODOO_MESSAGES } from 'shared-config';
import { OdooConnectionPayload, OdooConnectionSchema } from 'shared-types';

import ConfirmModal from '../common/ConfirmModal';
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
    const [hasExistingData, setHasExistingData] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [lastTestStatus, setLastTestStatus] = useState<'success' | 'fail' | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState<OdooConnectionPayload | null>(null);
    const [connectionInfo, setConnectionInfo] = useState<string | null>(null);
    const [originalData, setOriginalData] = useState<OdooConnectionPayload | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
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

                    // Store original data for cancel functionality (password is not returned from API)
                    const connectionData = { orgName, odooUrl, dbName, username, password: '' };
                    setOriginalData(connectionData);

                    // Populate form with existing values
                    setValue('orgName', orgName);
                    setValue('odooUrl', odooUrl);
                    setValue('dbName', dbName);
                    setValue('username', username);

                    setHasExistingData(true);

                    // Set info message about existing connection
                    if (status === 'success') {
                        setConnectionInfo('Previously saved connection found. Click "Edit" to modify credentials.');
                    } else if (status === 'fail') {
                        setConnectionInfo('Previous connection attempt failed. Click "Edit" to update credentials.');
                    } else {
                        setConnectionInfo('Connection details saved but not tested yet. Click "Edit" to modify.');
                    }
                } else {
                    setIsEditing(true); // No existing data, enable editing by default
                }
            } catch (error) {
                console.error('Error fetching existing connection:', error);
                setIsEditing(true); // Enable editing on error
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchExistingConnection();
    }, [setValue]);

    const handleTestConnection = async (data: OdooConnectionPayload) => {
        setIsLoading(true);
        setAlert({ type: 'info', message: ODOO_MESSAGES.TESTING_CONNECTION });

        try {
            const response = await testOdooConnection(data);

            if (response.success) {
                setAlert({ type: 'success', message: ODOO_MESSAGES.TEST_CONNECTION_SUCCESS });
                setLastTestStatus('success');
            } else {
                setAlert({ type: 'error', message: response.message || ODOO_MESSAGES.TEST_CONNECTION_FAIL });
                setLastTestStatus('fail');
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
            setLastTestStatus('fail');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConnection = async (data: OdooConnectionPayload) => {
        // Show confirmation if there's existing data
        if (hasExistingData) {
            setPendingSaveData(data);
            setShowConfirmModal(true);
            return;
        }

        // If no existing data, save directly
        await performSave(data);
    };

    const performSave = async (data: OdooConnectionPayload) => {
        setIsLoading(true);
        setAlert({ type: 'info', message: 'Saving connection details...' });

        try {
            // Include the last test status if available
            const payload: OdooConnectionPayload = {
                ...data,
                status: (lastTestStatus as 'success' | 'fail') || 'pending',
            };
            const response = await saveOdooConnection(payload);

            if (response.success) {
                setAlert({ type: 'success', message: 'Connection details saved successfully!' });
                setHasExistingData(true);
                setIsEditing(false);
                setLastTestStatus(null); // Reset after saving

                // Update connection info
                const newStatus = lastTestStatus || 'pending';
                if (newStatus === 'success') {
                    setConnectionInfo('Previously saved connection found. Click "Edit" to modify credentials.');
                } else if (newStatus === 'fail') {
                    setConnectionInfo('Previous connection attempt failed. Click "Edit" to update credentials.');
                } else {
                    setConnectionInfo('Connection details saved but not tested yet. Click "Edit" to modify.');
                }
            } else {
                setAlert({ type: 'error', message: 'Failed to save connection details.' });
            }
        } catch (error: unknown) {
            const errorMessage =
                error && typeof error === 'object' && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
            setAlert({
                type: 'error',
                message: errorMessage || 'An error occurred while saving.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmSave = async () => {
        setShowConfirmModal(false);
        if (pendingSaveData) {
            await performSave(pendingSaveData);
            setPendingSaveData(null);
        }
    };

    const handleCancelSave = () => {
        setShowConfirmModal(false);
        setPendingSaveData(null);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setAlert(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setAlert(null);
        setLastTestStatus(null);

        // Restore original data from state instead of reloading
        if (originalData) {
            reset(originalData);
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

    const fieldsDisabled = hasExistingData && !isEditing;

    return (
        <div className="max-w-2xl p-3">
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Override Existing Credentials?"
                message="This will override any previously saved credentials and cannot be undone. Do you want to proceed?"
                confirmText="Yes, Override"
                cancelText="Cancel"
                onConfirm={handleConfirmSave}
                onCancel={handleCancelSave}
                type="warning"
            />
            <div className="card bg-base-100">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title text-2xl">Odoo Connection Setup</h2>
                        {hasExistingData && !isEditing && (
                            <button type="button" onClick={handleEdit} className="btn btn-sm btn-outline">
                                Edit
                            </button>
                        )}
                        {isEditing && hasExistingData && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-sm btn-ghost">
                                Cancel
                            </button>
                        )}
                    </div>
                    <p className="text-base-content/70 mb-6">
                        Connect your Odoo instance to sync your data seamlessly.
                    </p>

                    {connectionInfo && !isEditing && (
                        <div className="border border-base-300 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <div className="text-info mt-0.5">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5 stroke-current"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    ></path>
                                </svg>
                            </div>
                            <span className="text-sm text-base-content/80">{connectionInfo}</span>
                        </div>
                    )}

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

                    <form onSubmit={handleSubmit(handleTestConnection)} className="space-y-4">
                        <FormInput
                            label={ODOO_FORM_LABELS.ORG_NAME}
                            placeholder={ODOO_FORM_PLACEHOLDERS.ORG_NAME}
                            register={register('orgName')}
                            error={errors.orgName?.message}
                            disabled={fieldsDisabled}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.ODOO_URL}
                            placeholder={ODOO_FORM_PLACEHOLDERS.ODOO_URL}
                            type="url"
                            register={register('odooUrl')}
                            error={errors.odooUrl?.message}
                            disabled={fieldsDisabled}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.DB_NAME}
                            placeholder={ODOO_FORM_PLACEHOLDERS.DB_NAME}
                            register={register('dbName')}
                            error={errors.dbName?.message}
                            disabled={fieldsDisabled}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.USERNAME}
                            placeholder={ODOO_FORM_PLACEHOLDERS.USERNAME}
                            register={register('username')}
                            error={errors.username?.message}
                            disabled={fieldsDisabled}
                        />

                        <FormInput
                            label={ODOO_FORM_LABELS.PASSWORD}
                            placeholder={ODOO_FORM_PLACEHOLDERS.PASSWORD}
                            type="password"
                            register={register('password')}
                            error={errors.password?.message}
                            disabled={fieldsDisabled}
                        />

                        <div className="card-actions justify-end mt-6 gap-2">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={handleSubmit(handleSaveConnection)}
                                    className="btn btn-secondary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading || fieldsDisabled}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
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
