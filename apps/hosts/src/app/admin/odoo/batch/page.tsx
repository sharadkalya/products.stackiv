'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Batch {
    id: string;
    userId: string;
    module: string;
    status: 'not_started' | 'in_progress' | 'done' | 'failed';
    attempts: number;
    startTime?: Date;
    endTime?: Date;
    lastError?: string;
    recordCountExpected?: number;
    createdAt: Date;
    updatedAt: Date;
}

interface BatchResponse {
    success: boolean;
    data: Batch[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function AdminBatchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [retryingBatchId, setRetryingBatchId] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin/odoo');
            return;
        }

        if (!userId) {
            setError('User ID is required');
            setLoading(false);
            return;
        }

        fetchBatches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, userId, router]);

    const fetchBatches = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({
                userId: userId || '',
                page: page.toString(),
                limit: '25',
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const response = await fetch(`/api/admin/batches?${params}`, {
                headers: {
                    'X-Admin-Token': token || '',
                },
            });

            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                router.push('/admin/odoo');
                return;
            }

            const data: BatchResponse = await response.json();

            if (data.success) {
                setBatches(data.data);
                setPagination(data.pagination);
            } else {
                setError('Failed to fetch batches');
            }
        } catch {
            setError('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    const handleRetryBatch = async (batchId: string) => {
        setRetryingBatchId(batchId);
        setError('');

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/batches/${batchId}/retry`, {
                method: 'POST',
                headers: {
                    'X-Admin-Token': token || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                // Refresh the batches list
                await fetchBatches();
            } else {
                setError(data.message || 'Failed to retry batch');
            }
        } catch {
            setError('An error occurred while retrying batch');
        } finally {
            setRetryingBatchId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            'not_started': 'badge-warning',
            'in_progress': 'badge-info',
            'done': 'badge-success',
            'failed': 'badge-error',
        };
        return statusMap[status] || 'badge-neutral';
    };

    const formatDuration = (batch: Batch) => {
        // Only show execution duration for completed or failed batches
        if (batch.status !== 'done' && batch.status !== 'failed') {
            return 'N/A';
        }

        const duration = new Date(batch.updatedAt).getTime() - new Date(batch.createdAt).getTime();
        const seconds = Math.floor(duration / 1000);

        if (seconds < 60) {
            return `${seconds}s`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes < 60) {
            return `${minutes}m ${remainingSeconds}s`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    return (
        <div className="min-h-screen bg-base-200 p-4">
            <div className="container mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Batch Details</h1>
                        <p className="text-sm opacity-70">User ID: {userId}</p>
                    </div>
                    <button onClick={() => router.push('/admin/odoo/dashboard')} className="btn btn-ghost">
                        Back to Dashboard
                    </button>
                </div>

                {/* Filters */}
                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <div className="flex gap-2 items-center">
                            <label className="label">
                                <span className="label-text font-semibold">Status Filter:</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="all">All</option>
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error mb-6">
                        <span>{error}</span>
                    </div>
                )}

                {/* Table */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <span className="loading loading-spinner loading-lg"></span>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Batch #</th>
                                                <th>Module</th>
                                                <th>Status</th>
                                                <th>Attempts</th>
                                                <th>Records</th>
                                                <th>Exec Time</th>
                                                <th>Time Window Start</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {batches.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="text-center py-8">
                                                        No batches found
                                                    </td>
                                                </tr>
                                            ) : (
                                                batches.map((batch, index) => (
                                                    <tr key={batch.id}>
                                                        <td className="font-bold">{(page - 1) * 25 + index + 1}</td>
                                                        <td>
                                                            <span className="badge badge-outline">{batch.module}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${getStatusBadge(batch.status)}`}>
                                                                {batch.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td>{batch.attempts}</td>
                                                        <td>{batch.recordCountExpected ?? 0}</td>
                                                        <td className="text-sm">
                                                            {formatDuration(batch)}
                                                        </td>
                                                        <td className="text-sm">
                                                            {batch.startTime
                                                                ? new Date(batch.startTime).toLocaleString()
                                                                : 'N/A'}
                                                        </td>
                                                        <td>
                                                            {batch.status === 'failed' && (
                                                                <button
                                                                    onClick={() => handleRetryBatch(batch.id)}
                                                                    className="btn btn-sm btn-warning"
                                                                    disabled={retryingBatchId === batch.id}
                                                                >
                                                                    {retryingBatchId === batch.id ? (
                                                                        <span className="loading loading-spinner loading-xs"></span>
                                                                    ) : (
                                                                        'Retry'
                                                                    )}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Error Details */}
                                {batches.some((b) => b.lastError) && (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-bold mb-3">Error Details</h3>
                                        <div className="space-y-2">
                                            {batches
                                                .filter((b) => b.lastError)
                                                .map((batch, index) => (
                                                    <div key={batch.id} className="alert alert-error">
                                                        <div>
                                                            <div className="font-bold">
                                                                Batch #{(page - 1) * 25 + index + 1} ({batch.module})
                                                            </div>
                                                            <div className="text-sm">{batch.lastError}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center mt-6">
                                        <div className="join">
                                            <button
                                                className="join-item btn"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1}
                                            >
                                                «
                                            </button>
                                            <button className="join-item btn">
                                                Page {pagination.page} of {pagination.totalPages}
                                            </button>
                                            <button
                                                className="join-item btn"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === pagination.totalPages}
                                            >
                                                »
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
