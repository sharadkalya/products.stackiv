'use client';

import { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'shared-i18n';
import { AppDispatch, selectIngestedText, updateIngestTextAction } from 'shared-redux';

export function AskTextUpload() {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const text = useSelector(selectIngestedText);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(updateIngestTextAction(e.target.value));
    }, [dispatch]);

    return (
        <div className="w-full flex flex-col items-end max-w-full">
            <textarea
                ref={textareaRef}
                className="textarea textarea-bordered w-full min-h-[120px] pr-10 resize-none md:resize-vertical max-w-full"
                maxLength={20000}
                value={text}
                placeholder={t('stackivDocsPage.placeholder')}
                style={{
                    maxHeight: '400px',
                    resize: 'vertical',
                    fontSize: '16px',
                }}
                onChange={onChange}
            />
        </div>
    );
}
