'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'shared-i18n';

import { ProcessUploadType } from '../Ask';

interface IAskFileUpload {
    processUpload: ProcessUploadType
};

export function AskFileUpload(props: IAskFileUpload) {
    const { processUpload } = props;
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            // Reset the input value so user can re-select the same file
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
        noClick: true, // Prevent dropzone from opening dialog on click
    });

    const handleUploadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent dropzone click
        fileInputRef.current?.click();
    };

    const handleSend = () => {
        processUpload();
    };

    return (
        <div className="w-full">
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 w-full cursor-pointer transition ${isDragActive ? 'border-primary bg-base-200' : 'border-base-300 bg-base-100'}`}>
                <input {...getInputProps()} ref={fileInputRef} />
                <div className="flex flex-col items-center">
                    {file ? (
                        <div className="flex items-center gap-2 bg-base-200 px-3 py-1 rounded-lg shadow w-full justify-between">
                            <span className="font-medium text-base-content truncate max-w-[180px]">{file.name}</span>
                            <button
                                type="button"
                                className="text-error text-xl font-bold px-2 focus:outline-none"
                                aria-label="Clear file"
                                onClick={() => setFile(null)}
                            >
                                &#10005;
                            </button>
                        </div>
                    ) : (
                        <>
                            <span className="text-base-content">
                                {t('stackivDocsPage.dragAndDrop')}
                            </span>
                            {/* File selection button */}
                            <button
                                type="button"
                                className="btn btn-primary mt-2"
                                onClick={handleUploadClick}
                            >
                                {t('stackivDocsPage.uploadPdfButton')}
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* Upload button below dropzone */}
            <div className="flex justify-end mt-2">
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSend}
                    disabled={!file}
                    aria-label="Upload file"
                >
                    {t('stackivDocsPage.uploadButton')}
                </button>
            </div>
        </div>
    );
}
