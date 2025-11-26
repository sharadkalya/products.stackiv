import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'warning' | 'error' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'warning',
}) => {
    if (!isOpen) return null;

    const getIconColor = () => {
        switch (type) {
            case 'error':
                return 'text-error';
            case 'warning':
                return 'text-warning';
            case 'info':
                return 'text-info';
            default:
                return 'text-warning';
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <div className="flex items-start gap-4">
                    <div className={`mt-1 ${getIconColor()}`}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{title}</h3>
                        <p className="text-base-content/80">{message}</p>
                    </div>
                </div>
                <div className="modal-action">
                    <button onClick={onCancel} className="btn btn-ghost">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="btn btn-primary">
                        {confirmText}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onCancel}></div>
        </div>
    );
};

export default ConfirmModal;
