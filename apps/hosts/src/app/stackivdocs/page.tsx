'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

export default function StackivDocsPage() {
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        alert('Submitted!');
    };

    return (
        <div className="flex flex-col items-center justify-center pt-20 px-4">
            <h1 className="text-3xl font-bold mb-4">StackivDocs AI</h1>
            <p className="text-md max-w-xl text-center mb-8 leading-relaxed">
                StackivDocs AI helps you upload documents, summarise them, critique them, generate Q&A, prep for sessions, and much more.<br />
                To use, upload a PDF file or paste/type your content below.
            </p>

            <div className="flex flex-col items-center w-full max-w-xl gap-8">
                {/* File Dropzone */}
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 w-full cursor-pointer transition ${isDragActive ? 'border-primary bg-base-200' : 'border-base-300 bg-base-100'}`}>
                    <input {...getInputProps()} ref={fileInputRef} />
                    <div className="flex flex-col items-center">
                        {file ? (
                            <div className="flex items-center gap-2 mb-2 bg-base-200 px-3 py-1 rounded-lg shadow">
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
                            <span className="mb-2 text-base-content">
                                Drag & drop a PDF here, or click to select file
                            </span>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleUploadClick}
                        >
                            Upload PDF
                        </button>
                    </div>
                </div>

                {/* Divider with "OR" */}
                <div className="flex items-center w-full">
                    <div className="flex-1 h-0.5 rounded-full bg-accent" />
                    <span className="mx-4 px-3 py-1 rounded-full bg-accent text-base-100 font-semibold shadow">
                        OR
                    </span>
                    <div className="flex-1 h-0.5 rounded-full bg-accent" />
                </div>

                {/* Textarea and Send button */}
                <div className="w-full flex flex-col items-end">
                    <textarea
                        ref={textareaRef}
                        className="textarea textarea-bordered w-full min-h-[120px] pr-10 resize-none md:resize-vertical"
                        maxLength={20000}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Paste or type your content here (max 20,000 characters)"
                        style={{
                            maxHeight: '400px',
                            resize: 'vertical',
                        }}
                    />
                    <button
                        className="mt-2 btn btn-primary btn-sm"
                        onClick={handleSend}
                        disabled={!text && !file}
                        aria-label="Send"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
