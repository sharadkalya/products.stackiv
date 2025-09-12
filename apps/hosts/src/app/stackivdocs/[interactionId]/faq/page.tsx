'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from 'shared-redux';
import { selectActiveSession, loadInteractionAction } from 'shared-redux';

import { useAsk } from '../../hooks/useAsk';

export default function FAQ() {
    const params = useParams();
    const dispatch = useAppDispatch();
    const interactionId = params.interactionId as string;

    const activeSession = useAppSelector(selectActiveSession);
    const { faqLoading, faqText, faqError, fetchFaq, resetFaq } = useAsk();

    // Timer for loading state
    const [loadingTimer, setLoadingTimer] = useState(0);
    const [interactionLoaded, setInteractionLoaded] = useState(false);

    // Check if this is the correct interaction loaded in active session
    const isCorrectInteractionLoaded = activeSession?.id === interactionId;
    const hasFaqData = !!faqText;

    // Load interaction if not already loaded
    useEffect(() => {
        if (interactionId && !isCorrectInteractionLoaded && !interactionLoaded) {
            setInteractionLoaded(true);
            dispatch(loadInteractionAction({ interactionId }));
        }
    }, [interactionId, isCorrectInteractionLoaded, interactionLoaded, dispatch]);

    // Fetch FAQ once interaction is loaded and we don't have FAQ data
    useEffect(() => {
        if (isCorrectInteractionLoaded && !hasFaqData && !faqLoading && !faqError) {
            fetchFaq({ interactionId });
        }
    }, [isCorrectInteractionLoaded, hasFaqData, faqLoading, faqError, interactionId, fetchFaq]);

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

    const handleRetry = () => {
        resetFaq();
        setLoadingTimer(0);
        fetchFaq({ interactionId });
    };

    // Show loading state while loading interaction or FAQ
    if ((!isCorrectInteractionLoaded && !faqError) || faqLoading) {
        return (
            <div className="min-h-screen bg-base-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                        <p className="mt-4 text-base-content/70">
                            {!isCorrectInteractionLoaded
                                ? 'Loading interaction...'
                                : `Generating FAQ... (${loadingTimer}s)`
                            }
                        </p>
                        {faqLoading && loadingTimer > 15 && (
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
                                onClick={handleRetry}
                            >
                                Try Again
                            </button>
                            <Link href={`/stackivdocs/${interactionId}`} className="btn btn-primary">
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
                            <li><Link href={`/stackivdocs/${interactionId}`}>Interaction</Link></li>
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
                            ) : (
                                <div className="text-center py-8">
                                    <div className="alert alert-warning">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div>
                                            <h3 className="font-bold">No FAQ Available</h3>
                                            <div className="text-xs">Click &quot;Generate FAQ&quot; to create frequently asked questions for this content.</div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleRetry}
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
                        <Link href={`/stackivdocs/${interactionId}/chat`} className="btn btn-outline">
                            Chat with Content
                        </Link>
                        <Link href={`/stackivdocs/${interactionId}/summary`} className="btn btn-outline">
                            View Summary
                        </Link>
                        <Link href={`/stackivdocs/${interactionId}`} className="btn btn-primary">
                            Back to Interaction
                        </Link>
                    </div>

                    {/* Debug section - Remove this in production */}
                    <div className="mt-8 p-4 bg-base-300 rounded-lg text-sm">
                        <h3 className="font-bold mb-2">Debug Info:</h3>
                        <p>URL Interaction ID: {interactionId}</p>
                        <p>Active Session ID: {activeSession?.id || 'None'}</p>
                        <p>Is Correct Interaction: {isCorrectInteractionLoaded ? 'Yes' : 'No'}</p>
                        <p>Has FAQ Data: {hasFaqData ? 'Yes' : 'No'}</p>
                        <p>FAQ Loading: {faqLoading ? 'Yes' : 'No'}</p>
                        <p>FAQ Error: {faqError || 'None'}</p>
                        <p>FAQ Text Length: {faqText?.length || 0}</p>
                        <div className="mt-2">
                            <button
                                className="btn btn-xs btn-secondary"
                                onClick={() => fetchFaq({ interactionId })}
                            >
                                Force Generate FAQ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
