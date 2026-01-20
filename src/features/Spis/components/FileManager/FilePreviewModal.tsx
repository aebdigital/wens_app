import React from 'react';
import { FileItem } from '../../types';
import { PDFPreviewModal } from '../../../../components/common/PDFPreviewModal';
import { useTheme } from '../../../../contexts/ThemeContext';

interface FilePreviewModalProps {
    file: FileItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, isOpen, onClose }) => {
    const { isDark } = useTheme();

    if (!isOpen || !file) return null;

    const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = file.name.match(/\.pdf$/i);

    // Debug: log full file info
    console.log('FilePreviewModal - full file object:', JSON.stringify(file, null, 2));

    // For PDFs, use the advanced PDFPreviewModal
    if (isPdf && file.url) {
        return (
            <PDFPreviewModal
                isOpen={isOpen}
                onClose={onClose}
                pdfUrl={file.url}
                filename={file.name}
                isDark={isDark}
            />
        );
    }

    // If it's a PDF but no URL, show specific message
    if (isPdf && !file.url) {
        const handleBackdropClick = (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        };

        return (
            <div
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={handleBackdropClick}
            >
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg p-8 text-center">
                    <div className="mb-4">
                        <svg className="w-20 h-20 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        {file.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        PDF súbor nemá URL. Skúste ho nahrať znova.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                    >
                        Zavrieť
                    </button>
                </div>
            </div>
        );
    }

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate pr-4">
                        {file.name}
                    </h3>
                    <div className="flex gap-2">
                        {file.url && (
                            <a
                                href={file.url}
                                download={file.name}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Stiahnuť
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
                    {isImage && file.url ? (
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-center p-8">
                            <div className="mb-4">
                                <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                                Pre tento typ súboru nie je dostupný náhľad.
                            </p>
                            {file.url && (
                                <a
                                    href={file.url}
                                    download={file.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-2.5 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-block"
                                >
                                    Stiahnuť súbor
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
