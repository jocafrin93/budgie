import React from 'react';

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                <h3 className="text-lg font-semibold mb-4 text-theme-primary">{title}</h3>
                <p className="mb-6 text-theme-secondary">{message}</p>
                <div className="flex space-x-2">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 text-theme-primary py-2 px-4 rounded hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 px-4 rounded border border-theme-primary hover:bg-theme-hover text-theme-primary transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;