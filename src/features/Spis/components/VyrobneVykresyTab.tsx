import React from 'react';
import FileManager from './FileManager/FileManager';
import { FileItem } from '../types';

interface VyrobneVykresyTabProps {
  isDark: boolean;
  items: any[];
  onUpdate: (items: any[]) => void;
  isLocked?: boolean;
  user?: any;
  spisEntryId?: string;
}

export const VyrobneVykresyTab: React.FC<VyrobneVykresyTabProps> = ({ isDark, items, onUpdate, isLocked = false, user, spisEntryId }) => {
  return (
    <div className="h-full">
      <FileManager
        items={items as FileItem[]}
        onUpdate={(newItems) => onUpdate(newItems as any[])}
        isLocked={isLocked}
        user={user}
        spisEntryId={spisEntryId}
        isDark={isDark}
        moduleName="Výrobné výkresy"
      />
    </div>
  );
};