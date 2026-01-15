import React from 'react';
import FileManager from './FileManager/FileManager';
import { FileItem } from '../types';

interface TechnickeVykresyTabProps {
  isDark: boolean;
  items: any[];
  onUpdate: (items: any[]) => void;
  isLocked?: boolean;
  user?: any;
  spisEntryId?: string;
}

export const TechnickeVykresyTab: React.FC<TechnickeVykresyTabProps> = ({ isDark, items, onUpdate, isLocked = false, user, spisEntryId }) => {
  return (
    <div className="h-full">
      <FileManager
        items={items as FileItem[]}
        onUpdate={(newItems) => onUpdate(newItems as any[])}
        isLocked={isLocked}
        user={user}
        spisEntryId={spisEntryId}
        isDark={isDark}
        moduleName="Technické výkresy"
      />
    </div>
  );
};