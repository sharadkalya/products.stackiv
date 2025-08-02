import React from 'react';
import { createPortal } from 'react-dom';

type FullScreenLoaderProps = {
    children?: React.ReactNode;
};

export const FullScreenLoader = ({ children }: FullScreenLoaderProps) => {
    return createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[20] bg-black bg-opacity-50 flex items-center justify-center flex-col">
            <div className="loading loading-spinner loading-lg text-white">
            </div>
            <div>
                {children}
            </div>
        </div>,
        document.body,
    );
};
