'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppSelector } from 'shared-redux';
import { selectActiveSession, selectHasSessionContent, selectHasProcessedSession } from 'shared-redux';

import { useAsk } from '../../hooks/useAsk';

export default function FAQ() {
    const activeSession = useAppSelector(selectActiveSession);
    const hasSessionContent = useAppSelector(selectHasSessionContent);
    const hasProcessedSession = useAppSelector(selectHasProcessedSession);
    const { faqLoading, faqText, faqError, fetchFaq, resetFaq } = useAsk();

    // Timer for loading state
    const [loadingTimer, setLoadingTimer] = useState(0);

    // Get the interaction ID from the correct location
    const interactionId = activeSession?.id || activeSession?.ingestedData?.data?.interactionId;

    // Check if there's an active session with data and interaction ID
    const hasActiveSession = hasSessionContent && !!interactionId;

    // Timer effect for loading state
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (faqLoading) {
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
    }, [faqLoading]);

    useEffect(() => {
        // If we have an active session and interaction ID, fetch the FAQ
        // Only trigger if we don't have text, aren't loading, and don't have an error
        if (hasActiveSession && interactionId && !faqText && !faqLoading && !faqError) {
            fetchFaq({ interactionId });
        }
    }, [hasActiveSession, interactionId, faqText, faqLoading, faqError, fetchFaq]);

    const handleRetry = () => {
        resetFaq();
        setLoadingTimer(0); // Reset the timer
        if (interactionId) {
            fetchFaq({ interactionId });
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
                                <h3 className="font-bold">No Content for FAQ</h3>
                                <div className="text-xs">Please process some text first to generate frequently asked questions.</div>
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
    if (faqLoading) {
        return (
            <div className="min-h-screen bg-base-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                        <p className="mt-4 text-base-content/70">
                            Generating FAQ... ({loadingTimer}s)
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
    if (faqError) {
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
                                    {faqError.includes('timed out') ? 'Request Timed Out' : 'Error'}
                                </h3>
                                <div className="text-xs">
                                    {faqError.includes('timed out')
                                        ? 'The FAQ generation is taking longer than expected. Please try again.'
                                        : faqError
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

    // Show FAQ content
    return (
        <div className="min-h-screen bg-base-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <div className="breadcrumbs text-sm">
                        <ul>
                            <li><Link href="/stackivdocs">StackivDocs</Link></li>
                            <li>FAQ</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Frequently Asked Questions
                            </h2>

                            {faqText ? (
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-wrap text-base-content">
                                        {faqText}
                                    </div>
                                </div>
                            ) : faqLoading ? (
                                <div className="text-center py-8">
                                    <div className="loading loading-dots loading-lg text-primary"></div>
                                    <p className="mt-2 text-base-content/70">Processing FAQ...</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="alert alert-warning">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div>
                                            <h3 className="font-bold">No FAQ Available</h3>
                                            <div className="text-xs">Click "Generate FAQ" to create frequently asked questions for this content.</div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                handleRetry();
                                            }}
                                        >
                                            Generate FAQ
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
                        <Link href="/stackivdocs/summary" className="btn btn-outline">
                            View Summary
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
                        <p>FAQ Loading: {faqLoading ? 'Yes' : 'No'}</p>
                        <p>FAQ Error: {faqError || 'None'}</p>
                        <p>FAQ Text Length: {faqText?.length || 0}</p>
                        <p>Ingested Data: {activeSession?.ingestedData ? 'Present' : 'None'}</p>
                        <div className="mt-2">
                            <button
                                className="btn btn-xs btn-secondary"
                                onClick={() => {
                                    if (interactionId) {
                                        fetchFaq({ interactionId });
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
