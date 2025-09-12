'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
    useAppDispatch,
    useAppSelector,
    loadInteractionAction,
    selectActiveSession,
} from 'shared-redux';

// Create selectors for the load interaction states (global pending for loadInteraction)
const selectLoadInteractionPending = (state: { ask: { pending: boolean } }) => state.ask.pending;
const selectLoadInteractionError = (state: { ask: { error: string | null } }) => state.ask.error;

export default function InteractionPage() {
    const params = useParams();
    const router = useRouter();
    const interactionId = params.interactionId as string;
    const activeSession = useAppSelector(selectActiveSession);
    const loadingInteraction = useAppSelector(selectLoadInteractionPending);
    const loadInteractionError = useAppSelector(selectLoadInteractionError);
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Only load interaction if we don't already have it in the activeSession
        // or if the current session is for a different interaction
        const hasMatchingSession = activeSession?.id === interactionId;

        if (interactionId && !hasMatchingSession) {
            dispatch(loadInteractionAction({ interactionId }));
        }
    }, [interactionId, dispatch, activeSession?.id, activeSession?.originalText, activeSession?.text]);

    // Get the title from the active session or fallback
    const title = activeSession?.ingestedData?.data?.title ||
        (activeSession?.originalText ?
            (activeSession.originalText.length > 50 ?
                activeSession.originalText.substring(0, 50) + '...' :
                activeSession.originalText) :
            activeSession?.text ?
                (activeSession.text.length > 50 ?
                    activeSession.text.substring(0, 50) + '...' :
                    activeSession.text) :
                'Loading Interaction...');

    return (
        <div className="flex flex-col items-center justify-center pt-5 px-4">
            <div className="flex flex-col items-center w-full max-w-4xl gap-8">
                {/* Back button */}
                <div className="w-full">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => router.push('/stackivdocs')}
                    >
                        ← Back to Ask
                    </button>
                </div>

                <div className="w-full text-center">
                    <h4 className="text-xl font-semibold text-base-content mb-4">
                        {title}
                    </h4>
                    <div className="badge badge-primary">
                        ID: {interactionId?.slice(-6) || 'N/A'}
                    </div>
                </div>

                {/* Content will be displayed here based on the loaded interaction */}
                {(() => {
                    const hasMatchingSession = activeSession?.id === interactionId;
                    const hasContent = activeSession?.originalText || activeSession?.text;
                    const isActuallyLoading = loadingInteraction && !hasMatchingSession;

                    if (loadInteractionError) {
                        return (
                            <div className="w-full space-y-4">
                                <div className="alert alert-error">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Error loading interaction: {loadInteractionError}</span>
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => dispatch(loadInteractionAction({ interactionId }))}
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    if (hasMatchingSession && hasContent) {
                        return (
                            <div className="w-full space-y-6">
                                {/* Display the interaction content */}
                                <div className="card bg-base-100 shadow-sm border border-base-300">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">Original Text</h3>
                                        <div className="prose max-w-none">
                                            <p className="whitespace-pre-wrap">{activeSession.originalText || activeSession.text}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation buttons to other features */}
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => router.push(`/stackivdocs/${interactionId}/summary`)}
                                    >
                                        Generate Summary
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => router.push(`/stackivdocs/${interactionId}/chat`)}
                                    >
                                        Chat with AI
                                    </button>
                                    <button
                                        className="btn btn-accent"
                                        onClick={() => router.push(`/stackivdocs/${interactionId}/faq`)}
                                    >
                                        Generate FAQ
                                    </button>
                                    <button
                                        className="btn btn-info"
                                        onClick={() => router.push(`/stackivdocs/${interactionId}/analysis`)}
                                    >
                                        Deep Analysis
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    if (isActuallyLoading) {
                        return (
                            <div className="flex justify-center py-8">
                                <span className="loading loading-spinner loading-lg"></span>
                                <span className="ml-2">Loading interaction...</span>
                            </div>
                        );
                    }

                    // Fallback for when we don't have content and not loading
                    return (
                        <div className="text-center py-8 space-y-4">
                            <div className="text-base-content/60">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No interaction data found.</p>
                                <p className="text-xs mt-1">This interaction may not exist or may have been deleted.</p>
                            </div>
                            <div className="flex justify-center gap-2">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => dispatch(loadInteractionAction({ interactionId }))}
                                >
                                    Try Again
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => router.push('/stackivdocs')}
                                >
                                    Back to Ask
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
