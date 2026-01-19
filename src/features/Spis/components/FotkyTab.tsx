import React, { useMemo } from 'react';
import FileManager from './FileManager/FileManager';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { FileItem } from '../types';

interface FotkyTabProps {
  uploadedPhotos: any[];
  setUploadedPhotos: React.Dispatch<React.SetStateAction<any[]>>;
  isLocked?: boolean;
  spisEntryId?: string;
}

export const FotkyTab: React.FC<FotkyTabProps> = ({ uploadedPhotos, setUploadedPhotos, isLocked = false, spisEntryId }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Convert uploadedPhotos (legacy/hybrid format) to FileItem[] for FileManager
  const items: FileItem[] = useMemo(() => {
    return uploadedPhotos.map(p => ({
      id: p.id,
      name: p.name || p.file?.name || 'Photo',
      type: p.type || 'file',
      url: p.url,
      storagePath: p.storagePath,
      description: p.description || '',
      parentId: p.parentId || null,
      createdAt: p.createdAt || new Date().toISOString(),
      createdBy: p.createdBy || 'System'
    }));
  }, [uploadedPhotos]);

  const handleUpdate = (newItems: FileItem[]) => {
    // Convert FileItem[] back to uploadedPhotos structure
    // We maintain 'file' property with a mock object for compatibility with other parts of the app that might expect it
    const newPhotos = newItems.map(item => ({
      id: item.id,
      file: { name: item.name } as File,
      name: item.name,
      type: item.type,
      url: item.url,
      storagePath: item.storagePath,
      description: item.description,
      parentId: item.parentId,
      createdAt: item.createdAt,
      createdBy: item.createdBy
    }));
    setUploadedPhotos(newPhotos);
  };

  return (
    <div className="h-full">
      <FileManager
        items={items}
        onUpdate={handleUpdate}
        isLocked={isLocked}
        user={user}
        spisEntryId={spisEntryId}
        isDark={isDark}
        moduleName="Fotky"
        allowedExtensions={['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']}
      />
    </div>
  );
};
