import React from 'react';
import { FileDropZone } from '../../../components/common/FileDropZone';
import { CustomDatePicker } from '../../../components/common/CustomDatePicker';

interface VyrobneVykresyTabProps {
  isDark: boolean;
  items: any[];
  onUpdate: (items: any[]) => void;
  isLocked?: boolean;
  user?: any;
}

export const VyrobneVykresyTab: React.FC<VyrobneVykresyTabProps> = ({ isDark, items, onUpdate, isLocked = false, user }) => {

  const handleUpdate = (index: number, field: string, value: string) => {
    if (isLocked) return;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate(newItems);
  };

  const handleDrop = (files: File[]) => {
    if (isLocked) return;
    const userName = user ? `${user.firstName} ${user.lastName}` : '';
    
    const newItems = files.map(file => ({
      popis: '',
      subor: file.name,
      odoslane: '',
      vytvoril: userName,
      file: file
    }));
    
    onUpdate([...items, ...newItems]);
  };

  const handleDeleteItem = (index: number) => {
    if (isLocked) return;
    onUpdate(items.filter((_, i) => i !== index));
  };

  const handleDownload = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (item.file) {
        const url = URL.createObjectURL(item.file);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.subor || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        alert('Súbor nie je k dispozícii pre stiahnutie.');
    }
  };

  return (
    <div className="p-2 h-full flex flex-col gap-4">
      <div className="flex-1 overflow-auto">
        <table className={`w-full text-xs border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
          <thead className="sticky top-0">
            <tr className="bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Súbor</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Popis</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Odoslané</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white">Vytvoril</th>
              <th className="border border-white/20 px-3 py-2.5 font-semibold text-white w-24">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`row-${index}`} className={isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                <td className={`border px-3 py-2 ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} truncate max-w-[150px]`} title={item.subor}>
                  {item.subor || '-'}
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="text"
                    value={item.popis || ''}
                    onChange={(e) => handleUpdate(index, 'popis', e.target.value)}
                    disabled={isLocked}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <CustomDatePicker
                    value={item.odoslane || ''}
                    onChange={(val) => handleUpdate(index, 'odoslane', val)}
                    disabled={isLocked}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className={`border px-1 py-1 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="text"
                    value={item.vytvoril || ''}
                    onChange={(e) => handleUpdate(index, 'vytvoril', e.target.value)}
                    disabled={isLocked}
                    className={`w-full h-8 text-xs border-0 bg-transparent rounded px-2 ${isDark ? 'text-white focus:bg-gray-700 focus:border focus:border-[#e11b28]' : 'focus:bg-white focus:border focus:border-[#e11b28]'} ${isLocked ? 'cursor-not-allowed' : ''}`}
                  />
                </td>
                <td className={`border px-1 py-1 text-center ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                   <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={(e) => handleDownload(e, item)}
                        className={`p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded ${(!item.file) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Stiahnuť"
                        disabled={!item.file}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                    <button
                        onClick={() => handleDeleteItem(index)}
                        disabled={isLocked}
                        className={`p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Odstrániť"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                   </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className={`border px-3 py-8 text-center ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                  Žiadne výrobné výkresy. Nahrajte súbory nižšie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FileDropZone
        onDrop={handleDrop}
        multiple={true}
        disabled={isLocked}
        text="Kliknite alebo potiahnite súbory sem pre nahranie výkresov"
      />
    </div>
  );
};