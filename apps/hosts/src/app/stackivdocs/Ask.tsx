'use client';
import { selectAskQuery, useAppSelector } from 'shared-redux';

import { MarkdownRenderer } from '@common/MarkdownRenderer';

import { AskFeatures } from './components/AskFeatures';
import { AskFileUpload } from './components/AskFileUpload';
import { AskTextUpload } from './components/AskTextUpload';
import { Separator } from './components/Separator';
import { useAsk } from './hooks/useAsk';

import './styles/ask.scss';

export function Ask() {
    const { fetchByText, result, error } = useAsk();
    const query = useAppSelector(selectAskQuery);
    console.log('query', query);
    const processUploaded = () => {
        fetchByText({ prompt: query });
    };

    return (
        <div className="flex flex-col items-center justify-center pt-20 px-4">
            <div className="flex flex-col items-center w-full max-w-xl gap-8">
                <AskFileUpload />
                <Separator />
                <AskTextUpload />
                {error ? (
                    <p className='text-error border w-full text-center p-2 rounded-md'>{error}</p>
                ) : null}
                <div className="w-full flex justify-end">
                    <button
                        onClick={processUploaded}
                        className="btn btn-primary w-full md:w-1/2 lg:w-1/3"
                    >
                        Process
                    </button>
                </div>
                <div className='markdown-wrapper'>
                    <MarkdownRenderer content={result || ''} />
                </div>
                <AskFeatures />
            </div>
        </div>
    );
}
