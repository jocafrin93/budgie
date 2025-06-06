import React from 'react';

const ConfirmDialog = ({ confirmDelete, onConfirm, onCancel, darkMode }) => {
    if (!confirmDelete) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg w-96`}>
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p className="mb-6">{confirmDelete.message}</p>
                <div className="flex space-x-2">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onCancel}
                        className={`flex-1 py-2 px-4 rounded border ${darkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
