'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'shared-i18n';

import { ProcessUploadType } from '../Ask';
import { stackivPlanetQuery } from '../constants';

interface IAskTextUpload {
    processUpload: ProcessUploadType;
}

export function AskTextUpload(props: IAskTextUpload) {
    const { processUpload } = props;
    const { t } = useTranslation();
    const [text, setText] = useState(stackivPlanetQuery);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        processUpload({ text });
    };

    return (
        <div className="w-full flex flex-col items-end max-w-full">
            <textarea
                ref={textareaRef}
                className="textarea textarea-bordered w-full min-h-[120px] pr-10 resize-none md:resize-vertical max-w-full"
                maxLength={20000}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t('stackivDocsPage.placeholder')}
                style={{
                    maxHeight: '400px',
                    resize: 'vertical',
                }}
            />
            {/* Send button for textarea */}
            <button
                className="mt-2 btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={!text}
                aria-label="Send text"
            >
                {t('stackivDocsPage.sendButton')}
            </button>
        </div>
    );
}
