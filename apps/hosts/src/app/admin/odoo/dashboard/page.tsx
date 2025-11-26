'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SyncHistory {
    id: string;
    userId: string;
    customerName?: string;
    customerEmail?: string;
    odooUrl?: string;
    status: string;
    initialSyncDone: boolean;
    hasFailedBatches: boolean;
    lastSyncAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface SyncHistoryResponse {
    success: boolean;
    data: SyncHistory[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
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

        fetchSyncHistory();
    }, [page, search, router]);

    const fetchSyncHistory = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '25',
                ...(search && { search }),
            });

            const response = await fetch(`/api/admin/sync-history?${params}`, {
                headers: {
                    'X-Admin-Token': token || '',
                },
            });

            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                router.push('/admin/odoo');
                return;
            }

            const data: SyncHistoryResponse = await response.json();

            if (data.success) {
                setSyncHistory(data.data);
                setPagination(data.pagination);
            } else {
                setError('Failed to fetch sync history');
            }
        } catch {
            setError('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin/odoo');
    };

    const handleViewBatches = (userId: string) => {
        router.push(`/admin/odoo/batch?userId=${userId}`);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            // eslint-disable-next-line camelcase
            in_progress: 'badge-info',
            completed: 'badge-success',
            failed: 'badge-error',
            // eslint-disable-next-line camelcase
            not_started: 'badge-warning',
        };
        return statusMap[status] || 'badge-neutral';
    };

    return (
        <div className="min-h-screen bg-base-200 p-4">
            <div className="container mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Odoo Sync Admin Dashboard</h1>
                    <button onClick={handleLogout} className="btn btn-ghost">
                        Logout
                    </button>
                </div>

                {/* Search */}
                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search by customer name or URL..."
                                className="input input-bordered flex-1"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button
                                onClick={() => {
                                    setPage(1);
                                    fetchSyncHistory();
                                }}
                                className="btn btn-primary"
                            >
                                Search
                            </button>
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
                                                <th>Customer</th>
                                                <th>Odoo URL</th>
                                                <th>Status</th>
                                                <th>Initial Sync</th>
                                                <th>Has Failed Batches</th>
                                                <th>Last Sync</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {syncHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-8">
                                                        No sync history found
                                                    </td>
                                                </tr>
                                            ) : (
                                                syncHistory.map((sync) => (
                                                    <tr key={sync.id}>
                                                        <td>
                                                            <div>
                                                                <div className="font-bold">
                                                                    {sync.customerName || 'N/A'}
                                                                </div>
                                                                <div className="text-sm opacity-50">
                                                                    {sync.customerEmail || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-sm">{sync.odooUrl || 'N/A'}</td>
                                                        <td>
                                                            <span className={`badge ${getStatusBadge(sync.status)}`}>
                                                                {sync.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge ${
                                                                    sync.initialSyncDone
                                                                        ? 'badge-success'
                                                                        : 'badge-warning'
                                                                }`}
                                                            >
                                                                {sync.initialSyncDone ? 'Done' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {sync.hasFailedBatches ? (
                                                                <span className="badge badge-error">Yes</span>
                                                            ) : (
                                                                <span className="badge badge-success">No</span>
                                                            )}
                                                        </td>
                                                        <td className="text-sm">
                                                            {sync.lastSyncAt
                                                                ? new Date(sync.lastSyncAt).toLocaleString()
                                                                : 'Never'}
                                                        </td>
                                                        <td>
                                                            <button
                                                                onClick={() => handleViewBatches(sync.userId)}
                                                                className="btn btn-sm btn-primary"
                                                            >
                                                                View Batches
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

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
