import React, { useState } from 'react';

interface GalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (base64: string) => void;
    isDark: boolean;
}

// Define the available images (hardcoded based on public/test content)
const IMAGE_GROUPS = {
    'A': ['A1', 'A2', 'a3', 'a4'],
    'B': ['b1', 'b2', 'b3', 'b4'],
    'C': ['c1', 'c2', 'c3', 'c4'],
    'D': ['d1', 'd2', 'd3', 'd4'],
    'E': ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'],
    'F': ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'],
    'G': ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    'H': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'],
    'I': ['i1', 'i2', 'i3', 'i4'],
    'S': ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
    'V': ['v1', 'v2', 'v3'],
    'Ostatné': ['do-al-zar', 'noname', 'no-name2']
};

export const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, onSelect, isDark }) => {
    if (!isOpen) return null;

    const handleImageClick = async (filaname: string) => {
        try {
            // Fetch the image from the public folder
            const response = await fetch(`/test/${filaname}.png`);
            if (!response.ok) throw new Error('Image not found');

            const blob = await response.blob();

            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    onSelect(reader.result);
                    onClose();
                }
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error loading gallery image:', error);
            alert('Nepodarilo sa načítať obrázok');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`w-full max-w-6xl h-[85vh] flex flex-col rounded-xl shadow-2xl ${isDark ? 'bg-dark-800 text-white' : 'bg-white text-gray-900'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
                    <h2 className="text-xl font-bold">Galéria modelov</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Single Scrollable List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                        {Object.entries(IMAGE_GROUPS).map(([group, images]) => (
                            <div key={group}>
                                <h3 className={`text-lg font-bold mb-3 pb-1 border-b ${isDark ? 'border-dark-600 text-gray-300' : 'border-gray-200 text-gray-700'}`}>
                                    Séria {group}
                                </h3>
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                                    {images.map((filename) => (
                                        <button
                                            key={filename}
                                            onClick={() => handleImageClick(filename)}
                                            className={`group relative aspect-[1/2] rounded overflow-hidden border transition-all ${isDark
                                                ? 'border-dark-600 hover:border-[#e11b28] bg-dark-700'
                                                : 'border-gray-200 hover:border-[#e11b28] bg-white'
                                                }`}
                                        >
                                            <img
                                                src={`/test/${filename}.png`}
                                                alt={filename}
                                                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className={`absolute bottom-0 left-0 right-0 py-1 text-center text-[10px] font-semibold ${isDark ? 'bg-dark-900/80' : 'bg-gray-100/90'
                                                }`}>
                                                {filename.toUpperCase().replace('.PNG', '')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
