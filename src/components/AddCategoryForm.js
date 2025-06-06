import React, { useState } from 'react';

const AddCategoryForm = ({
    onSave,
    onCancel,
    categoryColors,
    darkMode,
    category = null,
}) => {
    const [formData, setFormData] = useState({
        name: category?.name || '',
        color: category?.color || categoryColors[0],
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                handleSubmit(true);
            } else {
                handleSubmit(false);
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleSubmit = (addAnother = false) => {
        if (formData.name) {
            onSave(formData, addAnother);
            if (addAnother) {
                setFormData({
                    name: '',
                    color: categoryColors[0],
                });
                setTimeout(() => {
                    const nameInput = document.querySelector('input[placeholder="Category name"]');
                    if (nameInput) nameInput.focus();
                }, 100);
            }
        }
    };

    return (
        <div className="space-y-4" onKeyDown={handleKeyDown}>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name"
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                autoFocus
            />

            <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="grid grid-cols-2 gap-3">
                    {categoryColors.map((color, index) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            className={`h-12 rounded-lg ${color} border-3 ${formData.color === color
                                    ? 'border-blue-500 ring-2 ring-blue-300'
                                    : 'border-transparent hover:border-gray-400'
                                } shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center`}
                            title={`Aurora Gradient ${index + 1}`}
                        >
                            <div className="w-full h-full rounded-md opacity-80"></div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={() => handleSubmit(false)}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                    disabled={!formData.name}
                >
                    {category ? 'Update' : 'Add'} Category
                </button>
                <button
                    onClick={() => handleSubmit(true)}
                    className="bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700"
                    disabled={!formData.name}
                    title="Save and add another (Shift+Enter)"
                >
                    +
                </button>
                <button
                    onClick={onCancel}
                    className={`py-2 px-4 rounded border ${darkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}
                >
                    Cancel
                </button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
                💡 Press Enter to save • Shift+Enter to save & add another • Escape to cancel
            </div>
        </div>
    );
};

export default AddCategoryForm; 
