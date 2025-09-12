'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    useAppDispatch,
    useAppSelector,
    fetchHistoryAction,
    selectHistoryItems,
    selectHistoryLoading
} from 'shared-redux';

export function AskHistory() {
    const historyItems = useAppSelector(selectHistoryItems);
    const historyLoading = useAppSelector(selectHistoryLoading);
    const dispatch = useAppDispatch();
    const router = useRouter();

    useEffect(() => {
        dispatch(fetchHistoryAction());
    }, [dispatch]);

    const handleLoadInteraction = (interactionId: string) => {
        router.push(`/stackivdocs/${interactionId}`);
    };

    return (
        <div className="w-full">
            <div className="divider">
                <h3 className="text-lg font-semibold text-base-content">Your History</h3>
            </div>

            {historyLoading ? (
                <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : historyItems && historyItems.length > 0 ? (
                <div className="space-y-3">
                    {historyItems.map((item, index) => (
                        <div
                            key={item.interactionId || index}
                            className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow"
                        >
                            <div className="card-body p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="card-title text-sm font-medium text-base-content">
                                            {item.title || `Interaction ${index + 1}`}
                                        </h4>
                                    </div>
                                    <div className="badge badge-primary badge-sm">
                                        ID: {item.interactionId?.slice(-6) || 'N/A'}
                                    </div>
                                </div>
                                <div className="card-actions justify-end mt-3">
                                    <button
                                        className="btn btn-primary btn-xs"
                                        onClick={() => handleLoadInteraction(item.interactionId)}
                                    >
                                        Use This
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-base-content/60">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto mb-4 opacity-40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <p className="text-sm">No history found</p>
                        <p className="text-xs mt-1">Your interactions will appear here</p>
                    </div>
                </div>
            )}
        </div>
    );
}
