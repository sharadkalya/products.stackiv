'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppSelector } from 'shared-redux';
import { selectActiveSession, selectHasSessionContent, selectHasProcessedSession } from 'shared-redux';

import { useAsk } from '../../hooks/useAsk';

export default function Summary() {
    const activeSession = useAppSelector(selectActiveSession);
    const hasSessionContent = useAppSelector(selectHasSessionContent);
    const hasProcessedSession = useAppSelector(selectHasProcessedSession);
    const { summaryLoading, summaryText, summaryError, fetchSummary, resetSummary } = useAsk();

    // Timer for loading state
    const [loadingTimer, setLoadingTimer] = useState(0);

    // Get the interaction ID from the correct location
    const interactionId = activeSession?.id || activeSession?.ingestedData?.data?.interactionId;

    // Check if there's an active session with data and interaction ID
    const hasActiveSession = hasSessionContent && !!interactionId;

    // Timer effect for loading state
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (summaryLoading) {
            setLoadingTimer(0);
            interval = setInterval(() => {
                setLoadingTimer(prev => prev + 1);
            }, 1000);
        } else {
            setLoadingTimer(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [summaryLoading]);

    useEffect(() => {
        // If we have an active session and interaction ID, fetch the summary
        // Only trigger if we don't have text, aren't loading, and don't have an error
        if (hasActiveSession && interactionId && !summaryText && !summaryLoading && !summaryError) {
            fetchSummary({ interactionId });
        }
    }, [hasActiveSession, interactionId, summaryText, summaryLoading, summaryError, fetchSummary]);

    const handleRetry = () => {
        resetSummary();
        setLoadingTimer(0); // Reset the timer
        if (interactionId) {
            fetchSummary({ interactionId });
        } else {
            console.warn('No interactionId available for retry');
            console.warn('activeSession.id:', activeSession?.id);
            console.warn('activeSession.ingestedData:', activeSession?.ingestedData);
        }
    };

    // Show session validation message if no active session
    if (!hasActiveSession) {
        return (
            <div className="min-h-screen bg-base-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="alert alert-info max-w-lg mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <h3 className="font-bold">No Content to Summarize</h3>
                                <div className="text-xs">Please process some text first to generate a summary.</div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link href="/stackivdocs" className="btn btn-primary">
                                Go Back to Process Text
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading state
    if (summaryLoading) {
        return (
            <div className="min-h-screen bg-base-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                        <p className="mt-4 text-base-content/70">
                            Generating summary... ({loadingTimer}s)
                        </p>
                        {loadingTimer > 15 && (
                            <p className="mt-2 text-warning text-sm">
                                This is taking longer than usual. The request will timeout at 30 seconds.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (summaryError) {
        return (
            <div className="min-h-screen bg-base-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="alert alert-error max-w-lg mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="font-bold">
                                    {summaryError.includes('timed out') ? 'Request Timed Out' : 'Error'}
                                </h3>
                                <div className="text-xs">
                                    {summaryError.includes('timed out')
                                        ? 'The summary generation is taking longer than expected. Please try again.'
                                        : summaryError
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-x-2">
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    handleRetry();
                                }}
                            >
                                Try Again
                            </button>
                            <Link href="/stackivdocs" className="btn btn-primary">
                                Go Back
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show summary content
    return (
        <div className="min-h-screen bg-base-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <div className="breadcrumbs text-sm">
                        <ul>
                            <li><Link href="/stackivdocs">StackivDocs</Link></li>
                            <li>Summary</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Content Summary
                            </h2>

                            {summaryText ? (
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap text-base-content">
                                        {summaryText}
                                    </div>
                                </div>
                            ) : summaryLoading ? (
                                <div className="text-center py-8">
                                    <div className="loading loading-dots loading-lg text-primary"></div>
                                    <p className="mt-2 text-base-content/70">Processing summary...</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="alert alert-warning">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div>
                                            <h3 className="font-bold">No Summary Available</h3>
                                            <div className="text-xs">Click "Try Again" to generate a summary for this content.</div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                handleRetry();
                                            }}
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center space-x-4">
                        <Link href="/stackivdocs/chat" className="btn btn-outline">
                            Chat with Content
                        </Link>
                        <Link href="/stackivdocs/faq" className="btn btn-outline">
                            View FAQ
                        </Link>
                        <Link href="/stackivdocs" className="btn btn-primary">
                            Process New Text
                        </Link>
                    </div>

                    {/* Debug section - Remove this in production */}
                    <div className="mt-8 p-4 bg-base-300 rounded-lg text-sm">
                        <h3 className="font-bold mb-2">Debug Info:</h3>
                        <p>Active Session ID: {activeSession?.id || 'None'}</p>
                        <p>Resolved Interaction ID: {interactionId || 'None'}</p>
                        <p>Has Session Content: {hasSessionContent ? 'Yes' : 'No'}</p>
                        <p>Has Processed Session: {hasProcessedSession ? 'Yes' : 'No'}</p>
                        <p>Summary Loading: {summaryLoading ? 'Yes' : 'No'}</p>
                        <p>Summary Error: {summaryError || 'None'}</p>
                        <p>Summary Text Length: {summaryText?.length || 0}</p>
                        <p>Ingested Data: {activeSession?.ingestedData ? 'Present' : 'None'}</p>
                        <div className="mt-2">
                            <button
                                className="btn btn-xs btn-secondary"
                                onClick={() => {
                                    if (interactionId) {
                                        fetchSummary({ interactionId });
                                    }
                                }}
                            >
                                Test API Call
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
