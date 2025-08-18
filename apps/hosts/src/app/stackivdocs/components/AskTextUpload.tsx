'use client';

import { useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'shared-i18n';
import { AppDispatch, selectAskQuery, updateActiveQueryAction } from 'shared-redux';

export function AskTextUpload() {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const query = useSelector(selectAskQuery);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(updateActiveQueryAction(e.target.value));
    }, [dispatch]);

    return (
        <div className="w-full flex flex-col items-end max-w-full">
            <textarea
                ref={textareaRef}
                className="textarea textarea-bordered w-full min-h-[120px] pr-10 resize-none md:resize-vertical max-w-full"
                maxLength={20000}
                value={query}
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
