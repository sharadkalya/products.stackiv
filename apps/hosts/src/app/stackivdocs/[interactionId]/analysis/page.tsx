'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from 'shared-redux';
import { selectActiveSession, loadInteractionAction } from 'shared-redux';

export default function Analysis() {
    const params = useParams();
    const dispatch = useAppDispatch();
    const interactionId = params.interactionId as string;

    const activeSession = useAppSelector(selectActiveSession);
    const [interactionLoaded, setInteractionLoaded] = useState(false);

    // Check if this is the correct interaction loaded in active session
    const isCorrectInteractionLoaded = activeSession?.id === interactionId;

    // Load interaction if not already loaded
    useEffect(() => {
        if (interactionId && !isCorrectInteractionLoaded && !interactionLoaded) {
            setInteractionLoaded(true);
            dispatch(loadInteractionAction({ interactionId }));
        }
    }, [interactionId, isCorrectInteractionLoaded, interactionLoaded, dispatch]);

    // Show loading state while loading interaction
    if (!isCorrectInteractionLoaded) {
        return (
            <div className="min-h-screen bg-base-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                        <p className="mt-4 text-base-content/70">Loading interaction...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <div className="breadcrumbs text-sm">
                        <ul>
                            <li><Link href="/stackivdocs">StackivDocs</Link></li>
                            <li><Link href={`/stackivdocs/${interactionId}`}>Interaction</Link></li>
                            <li>Analysis</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card bg-base-200 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Content Analysis
                            </h2>

                            <div className="text-center py-12">
                                <div className="alert alert-info max-w-lg mx-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <div>
                                        <h3 className="font-bold">Analysis Feature Coming Soon</h3>
                                        <div className="text-xs">Deep content analysis features will be available soon.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center space-x-4">
                        <Link href={`/stackivdocs/${interactionId}/summary`} className="btn btn-outline">
                            View Summary
                        </Link>
                        <Link href={`/stackivdocs/${interactionId}/faq`} className="btn btn-outline">
                            View FAQ
                        </Link>
                        <Link href={`/stackivdocs/${interactionId}/chat`} className="btn btn-outline">
                            Chat with Content
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
                    </div>
                </div>
            </div>
        </div>
    );
}
