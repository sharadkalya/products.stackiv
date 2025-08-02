'use client';
import { MarkdownRenderer } from '@common/MarkdownRenderer';

import { AskFileUpload } from './components/AskFileUpload';
import { AskTextUpload } from './components/AskTextUpload';
import { Separator } from './components/Separator';
import { useAsk } from './hooks/useAsk';
import './styles/ask.scss';

export type ProcessUploadType = (params?: { text?: string; file?: unknown }) => void;

export function Ask() {
    const { fetchByText, result, error } = useAsk();
    const processUploaded: ProcessUploadType = (params) => {
        const { text } = params ?? {};
        if (text) {
            fetchByText({ prompt: text });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center pt-20 px-4">
            <div className="flex flex-col items-center w-full max-w-xl gap-8">
                <AskFileUpload processUpload={processUploaded} />
                <Separator />
                <AskTextUpload processUpload={processUploaded} />
                {error ? (
                    <p className='text-error border w-full text-center p-2 rounded-md'>{error}</p>
                ) : null}
                <div>
                    <MarkdownRenderer content={result || ''} />
                </div>
            </div>
        </div>
    );
}
