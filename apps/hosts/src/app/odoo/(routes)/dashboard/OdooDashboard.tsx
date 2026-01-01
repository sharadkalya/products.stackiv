'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getOdooStatus, initOdooDashboard, getOdooDashboard } from 'shared-api';
import { SyncStatus } from 'shared-types';

export function OdooDashboard() {
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [connectionAvailable, setConnectionAvailable] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string>('');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Step 1: Call /status endpoint
                const statusResponse = await getOdooStatus();

                if (!statusResponse.exists || !statusResponse.status) {
                    // No status record exists
                    setConnectionAvailable(false);
                    setSyncStatus(null);
                    setIsLoading(false);
                    return;
                }

                const { connectionInfoAvailable, syncStatus: currentSyncStatus } = statusResponse.status;
                setConnectionAvailable(connectionInfoAvailable);
                setSyncStatus(currentSyncStatus);

                // Step 2: Based on syncStatus, call appropriate endpoint
                if (currentSyncStatus === 'not_started') {
                    // Call /init to trigger sync
                    const initResponse = await initOdooDashboard();
                    setActionMessage(initResponse.message);
                } else if (currentSyncStatus === 'done') {
                    // Only call /dashboard when sync is complete
                    const dashboardResponse = await getOdooDashboard();
                    setActionMessage(dashboardResponse.message);
                }
                // For 'pending', 'in_progress', 'failed' - just display status, don't call /dashboard
            } catch (err) {
                console.error('Error loading dashboard:', err);
                setError('Failed to load dashboard. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <span>{error}</span>
            </div>
        );
    }

    // No connection available
    if (!connectionAvailable) {
        return (
            <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg
                                className="h-6 w-6 text-warning"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">
                                Connection Setup Required
                            </h3>
                            <p className="mt-2 text-base-content/70">
                                You need to add connection details to sync Odoo data.
                                You can go to{' '}
                                <Link
                                    href="/odoo/connection-setup"
                                    className="link link-primary font-medium"
                                >
                                    Odoo Connection Setup
                                </Link>
                                {' '}page and save your connection.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Display sync status
    const getStatusIcon = () => {
        switch (syncStatus) {
            case 'not_started':
            case 'pending':
                return (
                    <svg
                        className="h-6 w-6 text-info"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case 'in_progress':
                return (
                    <svg
                        className="h-6 w-6 text-info animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                );
            case 'done':
                return (
                    <svg
                        className="h-6 w-6 text-success"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case 'failed':
                return (
                    <svg
                        className="h-6 w-6 text-error"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getStatusMessage = () => {
        switch (syncStatus) {
            case 'not_started':
                return 'Sync has not started yet. Initializing...';
            case 'pending':
                return 'Sync is pending. Processing will begin shortly.';
            case 'in_progress':
                return 'Sync is currently in progress. Please wait...';
            case 'done':
                return 'Data sync completed successfully!';
            case 'failed':
                return 'Sync failed. Please try again or contact support.';
            default:
                return 'Status unknown.';
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon()}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-base-content">
                            {syncStatus ? syncStatus.replace('_', ' ').toUpperCase() : 'Status'}
                        </h3>
                        <p className="mt-2 text-base-content/70">
                            {getStatusMessage()}
                        </p>
                        {actionMessage && (
                            <div className="mt-4 p-3 bg-base-200 rounded-lg">
                                <p className="text-sm text-base-content/80">
                                    <strong>System:</strong> {actionMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
