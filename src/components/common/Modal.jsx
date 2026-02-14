import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            // Lock both body and the main content area scroll
            document.body.style.overflow = 'hidden';
            const mainEl = document.querySelector('main');
            if (mainEl) mainEl.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
            const mainEl = document.querySelector('main');
            if (mainEl) mainEl.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Dark overlay — click to close */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal card — centered */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden zoom-in-95 fade-in z-10"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
