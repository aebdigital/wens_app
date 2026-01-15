import React, { useState, useMemo, useEffect } from 'react';
import { FileItem } from '../../types';
import { supabase } from '../../../../lib/supabase';
import { FileDropZone } from '../../../../components/common/FileDropZone'; // Check relative path
import { FilePreviewModal } from './FilePreviewModal';
import toast from 'react-hot-toast';

// Simple ID generator if UUID not available
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

interface FileManagerProps {
    items: FileItem[];
    onUpdate: (items: FileItem[]) => void;
    isLocked?: boolean;
    user?: any;
    spisEntryId?: string;
    isDark: boolean;
    allowedExtensions?: string[];
    moduleName?: string; // e.g. "Meranie", "Výrobné"
}

const FileManager: React.FC<FileManagerProps> = ({
    items,
    onUpdate,
    isLocked = false,
    user,
    spisEntryId,
    isDark,
    moduleName = 'Dokumenty'
}) => {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [movingItem, setMovingItem] = useState<FileItem | null>(null);

    // Ensure all items have IDs and basic fields (Migration for legacy data)
    useEffect(() => {
        let hasChanges = false;
        // Helper to safely access legacy fields
        const legacyMap = (item: any, field: string) => item[field];

        const migratedItems = items.map(item => {
            let newItem = { ...item };
            if (!newItem.id) { newItem.id = generateId(); hasChanges = true; }
            if (!newItem.type) { newItem.type = 'file'; hasChanges = true; }
            if (newItem.parentId === undefined) { newItem.parentId = null; hasChanges = true; }

            // Map legacy fields
            if (!newItem.createdAt && legacyMap(item, 'datum')) { newItem.createdAt = legacyMap(item, 'datum'); hasChanges = true; }
            if (!newItem.createdAt) { newItem.createdAt = new Date().toISOString(); hasChanges = true; }

            if (!newItem.name && legacyMap(item, 'subor')) { newItem.name = legacyMap(item, 'subor'); hasChanges = true; }
            if (!newItem.description && legacyMap(item, 'popis')) { newItem.description = legacyMap(item, 'popis'); hasChanges = true; }

            // Specific fields
            if (!newItem.category && legacyMap(item, 'kategoria')) { newItem.category = legacyMap(item, 'kategoria'); hasChanges = true; }
            if (!newItem.sent && legacyMap(item, 'odoslane')) { newItem.sent = legacyMap(item, 'odoslane'); hasChanges = true; }
            if (!newItem.supplier && legacyMap(item, 'dodavatel')) { newItem.supplier = legacyMap(item, 'dodavatel'); hasChanges = true; }

            return newItem;
        });

        if (hasChanges) {
            onUpdate(migratedItems);
        }
    }, [items, onUpdate]);

    // Derived state
    const currentFolder = useMemo(() =>
        items.find(i => i.id === currentFolderId),
        [items, currentFolderId]
    );

    const folderContents = useMemo(() => {
        const filtered = items.filter(i => i.parentId === currentFolderId);
        return filtered.sort((a, b) => {
            // 1. Folders always first
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            // 2. Sort by Date Created (Newest first)
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [items, currentFolderId]);

    const folderChain = useMemo(() => {
        const chain: FileItem[] = [];
        let current = currentFolder;
        while (current) {
            chain.unshift(current);
            const parentId = current.parentId;
            current = items.find(i => i.id === parentId);
        }
        return chain;
    }, [items, currentFolder]);

    // Actions
    const handleCreateFolder = () => {
        const name = prompt("Zadajte názov priečinka:");
        if (!name) return;

        const newFolder: FileItem = {
            id: generateId(),
            name,
            type: 'folder',
            parentId: currentFolderId,
            createdAt: new Date().toISOString(),
            createdBy: user ? `${user.firstName} ${user.lastName}` : 'System'
        };

        onUpdate([...items, newFolder]);
    };

    const handleDelete = async (item: FileItem) => {
        if (!window.confirm(`Naozaj chcete vymazať ${item.type === 'folder' ? 'priečinok a jeho obsah' : 'súbor'} "${item.name}"?`)) return;

        // Recursive delete logic
        const getDescendants = (parentId: string): string[] => {
            const children = items.filter(i => i.parentId === parentId);
            let ids = children.map(c => c.id);
            children.forEach(c => {
                if (c.type === 'folder') ids = [...ids, ...getDescendants(c.id)];
            });
            return ids;
        };

        const idsToDelete = [item.id, ...(item.type === 'folder' ? getDescendants(item.id) : [])];

        // Delete files from storage
        const itemsToDelete = items.filter(i => idsToDelete.includes(i.id));
        for (const i of itemsToDelete) {
            if (i.type === 'file' && i.storagePath) {
                try {
                    await supabase.storage.from('photos').remove([i.storagePath]);
                } catch (e) {
                    console.error("Error deleting file:", e);
                }
            }
        }

        onUpdate(items.filter(i => !idsToDelete.includes(i.id)));
    };

    const uploadToSupabase = async (file: File): Promise<{ url: string, storagePath: string } | null> => {
        if (!user) return null;
        try {
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${Date.now()}_${sanitizedName}`;
            const storagePath = `${user.id}/${spisEntryId || 'temp'}/documents/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(storagePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('photos').getPublicUrl(storagePath);
            return { url: data.publicUrl, storagePath };
        } catch (error) {
            console.error('Upload failed:', error);
            return null;
        }
    };

    const handleDrop = async (files: File[]) => {
        if (isLocked) return;
        setIsUploading(true);
        const userName = user ? `${user.firstName} ${user.lastName}` : '';

        try {
            const newItemsPromises = files.map(async (file) => {
                const uploadResult = await uploadToSupabase(file);
                return {
                    id: generateId(),
                    name: file.name,
                    type: 'file',
                    parentId: currentFolderId,
                    url: uploadResult?.url,
                    storagePath: uploadResult?.storagePath,
                    createdAt: new Date().toISOString(),
                    createdBy: userName,
                    description: ''
                } as FileItem;
            });

            const newItems = await Promise.all(newItemsPromises);
            onUpdate([...items, ...newItems]);
        } catch (e) {
            toast.error("Chyba pri nahrávaní súborov");
        } finally {
            setIsUploading(false);
        }
    };

    const handleMove = (targetFolderId: string | null) => {
        if (!movingItem) return;
        // Prevent moving folder into itself or its children
        if (movingItem.type === 'folder') {
            if (targetFolderId === movingItem.id) return;
            // Check if target is child of movingItem
            // (Simple check: if targetFolderId exists, crawl up parents. if hit movingItem.id, invalid)
        }

        const updated = items.map(i => i.id === movingItem.id ? { ...i, parentId: targetFolderId } : i);
        onUpdate(updated);
        setMovingItem(null);
        toast.success("Položka presunutá");
    };

    // Icon Helpers with configurable size
    const FileIcon = ({ type, name, className = "w-10 h-10" }: { type: string, name: string, className?: string }) => {
        if (type === 'folder') return (
            <svg className={`${className} text-blue-400`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
        );
        if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return (
            <svg className={`${className} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
        if (name.match(/\.pdf$/i)) return (
            <svg className={`${className} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
        // Generic
        return (
            <svg className={`${className} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    };

    return (
        <div className="flex flex-col h-auto gap-2">
            {/* Toolbar */}
            <div className={`flex items-center justify-between p-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 overflow-x-auto text-sm">
                    <button
                        onClick={() => setCurrentFolderId(null)}
                        className={`px-2 py-1 rounded hover:opacity-80 ${!currentFolderId ? (isDark ? 'text-white font-bold' : 'text-gray-900 font-bold') : 'text-gray-500'}`}
                    >
                        Domov
                    </button>
                    {folderChain.map((f, i) => (
                        <React.Fragment key={f.id}>
                            <span className="text-gray-400">/</span>
                            <button
                                onClick={() => setCurrentFolderId(f.id)}
                                className={`px-2 py-1 rounded hover:opacity-80 ${f.id === currentFolderId ? (isDark ? 'text-white font-bold' : 'text-gray-900 font-bold') : 'text-gray-500'}`}
                            >
                                {f.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleCreateFolder()}
                        disabled={isLocked}
                        className={`p-1.5 rounded hover:bg-opacity-20 ${isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`}
                        title="Nový priečinok"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                    </button>
                </div>
            </div>

            {/* Main Content Area (List View Only) */}
            <div className={`h-[520px] border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} rounded-lg overflow-auto`}>

                {/* Empty State */}
                {folderContents.length === 0 && !isUploading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <p>Prázdny priečinok</p>
                        {!isLocked && <p className="text-sm">Nahrajte súbory alebo vytvorte nový priečinok</p>}
                    </div>
                )}

                {/* List View Table */}
                {folderContents.length > 0 && (
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs uppercase border-b sticky top-0 ${isDark ? 'text-gray-400 bg-gray-800 border-gray-700' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                            <tr>
                                <th className="px-4 py-2 w-8"></th>
                                <th className="px-4 py-2">Názov</th>
                                <th className="px-4 py-2 w-32">Dátum</th>
                                <th className="px-4 py-2 text-right">Akcie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folderContents.map(item => (
                                <tr
                                    key={item.id}
                                    className={`border-b cursor-pointer transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800 text-gray-100' : 'border-gray-100 hover:bg-gray-50 text-gray-900'}`}
                                    onClick={() => {
                                        if (item.type === 'folder') setCurrentFolderId(item.id);
                                        else setPreviewFile(item);
                                    }}
                                >
                                    <td className="px-4 py-2">
                                        <div className="flex items-center justify-center">
                                            <FileIcon type={item.type} name={item.name} className="w-6 h-6" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="px-4 py-2 text-xs opacity-70">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('sk-SK') : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {!isLocked && (
                                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setMovingItem(item)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="Presunúť"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Vymazať"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Upload Zone */}
            <div className="h-24 flex-none">
                <FileDropZone
                    onDrop={handleDrop}
                    multiple={true}
                    disabled={isLocked || isUploading}
                    text={isUploading ? "Nahrávam..." : `Nahrať súbory do "${currentFolder ? currentFolder.name : 'Domov'}"`}
                />
            </div>

            {/* Move Item Modal (Simple overlay) */}
            {movingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setMovingItem(null)}>
                    <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg p-6 max-w-sm w-full shadow-xl`} onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Presunúť "{movingItem.name}"</h3>
                        <div className={`max-h-60 overflow-y-auto border rounded mb-4 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div
                                className={`p-2 cursor-pointer ${currentFolderId === null ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                                onClick={() => handleMove(null)}
                            >
                                📁 Domov
                            </div>
                            {items.filter(i => i.type === 'folder' && i.id !== movingItem.id).map(folder => (
                                <div
                                    key={folder.id}
                                    className={`p-2 cursor-pointer flex items-center gap-2 ${folder.id === currentFolderId ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                                    onClick={() => handleMove(folder.id)}
                                >
                                    <span>📁</span> {folder.name}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setMovingItem(null)}
                                className={`px-4 py-2 rounded ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                Zrušiť
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <FilePreviewModal
                file={previewFile}
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
            />
        </div>
    );
};

export default FileManager;
