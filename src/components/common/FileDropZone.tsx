import React, { useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  text?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onDrop,
  accept,
  multiple = false,
  text = 'Kliknite alebo potiahnite súbory sem pre nahranie',
  icon,
  disabled = false,
  className = '',
}) => {
  const { isDark } = useTheme();
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onDrop(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onDrop(files);
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-16 text-center transition-all cursor-pointer
        flex flex-col items-center justify-center gap-4 min-h-[250px]
        ${isDragActive 
          ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') 
          : (isDark ? 'border-dark-500 hover:border-gray-500 bg-dark-800' : 'border-gray-300 hover:border-gray-400 bg-gray-50')}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
      />
      
      {icon || (
        <svg className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )}
      
      <p className={`text-base font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        {text}
      </p>
    </div>
  );
};