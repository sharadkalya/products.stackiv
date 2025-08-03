'use client';

import { useState, useRef } from 'react';
import { useTranslation } from 'shared-i18n';

import { stackivPlanetQuery } from '../constants';

export function AskTextUpload() {
    const { t } = useTranslation();
    const [text, setText] = useState(stackivPlanetQuery);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        </div>
    );
}
