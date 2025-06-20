// src/components/ModalSystem.js
import React from 'react';

/**
 * A reusable modal system component that can render different content based on a type parameter.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.title - The title of the modal
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {React.ReactNode} props.children - The content to render inside the modal
 * @param {string} props.size - The size of the modal ('sm', 'md', 'lg', 'xl', or 'full')
 * @param {boolean} props.closeOnOverlayClick - Whether to close the modal when the overlay is clicked
 * @param {string} props.overlayClassName - Additional classes for the overlay
 * @param {string} props.modalClassName - Additional classes for the modal
 */
const ModalSystem = ({
    isOpen,
    title,
    onClose,
    children,
    size = 'md',
    closeOnOverlayClick = true,
    overlayClassName = '',
    modalClassName = ''
}) => {
    if (!isOpen) return null;

    // Size classes
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full'
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
            onClose();
        }
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${overlayClassName}`}
            onClick={handleOverlayClick}
        >
            <div 
                className={`bg-theme-primary rounded-lg shadow-xl overflow-hidden ${sizeClasses[size]} w-full mx-4 ${modalClassName}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-theme-secondary flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-theme-tertiary hover:text-theme-secondary transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ModalSystem;