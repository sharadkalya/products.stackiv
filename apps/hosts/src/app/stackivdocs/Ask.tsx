'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ingestTextAction, updateIngestTextAction, selectActiveSession, selectIngestedText, useAppDispatch, useAppSelector } from 'shared-redux';

import { showToast } from '@hosts/utils/toast';

import { AskFeatures } from './components/AskFeatures';
import { AskHistory } from './components/AskHistory';
import { AskTextUpload } from './components/AskTextUpload';

import './styles/ask.scss';

export function Ask() {
    const text = useAppSelector(selectIngestedText);
    const activeSession = useAppSelector(selectActiveSession);
    const { pending, error, ingestedData } = activeSession ?? {};
    const { data } = ingestedData ?? {};
    const { userId, interactionId } = data ?? {};

    const dispatch = useAppDispatch();
    const router = useRouter();

    // Handle error notifications
    useEffect(() => {
        if (error) {
            showToast('Error processing text! Please try again.', 'error', 4000);
        }
    }, [error]);

    useEffect(() => {
        if (userId) {
            localStorage.setItem('userId', userId);
        }
    }, [userId, interactionId]);

    const processUploaded = async () => {
        const id = localStorage.getItem('userId');

        try {
            // Dispatch the action and wait for it to complete
            const result = await dispatch(ingestTextAction({
                text,
                userId: id,
            })).unwrap();

            // If successful, show toast and navigate
            if (result?.data?.interactionId) {
                showToast('Text processed successfully!', 'success', 2000);

                // Clear the text area
                dispatch(updateIngestTextAction(''));

                // Navigate to interaction page after a brief delay
                setTimeout(() => {
                    router.push(`/stackivdocs/${result.data.interactionId}`);
                }, 1500);
            }
        } catch (error) {
            // Error handling is already handled by the useEffect above
            console.error('Processing failed:', error);
        }
    };
    // Only disable if there's no text or if currently pending
    // Allow processing new text even if there's an existing interaction
    const isProcessDisabled = !text || pending;

    return (
        <div className="flex flex-col items-center justify-center pt-20 px-4">
            <div className="flex flex-col items-center w-full max-w-xl gap-8">
                {/* <AskFileUpload />
                <Separator /> */}
                <AskTextUpload />
                <div className="w-full flex justify-end">
                    <button
                        onClick={processUploaded}
                        className="btn btn-primary w-full md:w-1/2 lg:w-1/3"
                        disabled={isProcessDisabled}
                    >
                        {pending && <span className="loading loading-ring"></span>}
                        Process
                    </button>
                </div>

                <AskHistory />

                <AskFeatures />
            </div>
        </div>
    );
}
