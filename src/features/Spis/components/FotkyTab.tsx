import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../../../components/common/FileDropZone';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface FotkyTabProps {
  uploadedPhotos: {id: string, file: File, url: string, description: string, storagePath?: string}[];
  setUploadedPhotos: React.Dispatch<React.SetStateAction<{id: string, file: File, url: string, description: string, storagePath?: string}[]>>;
  isLocked?: boolean;
  spisEntryId?: string;
}

export const FotkyTab: React.FC<FotkyTabProps> = ({ uploadedPhotos, setUploadedPhotos, isLocked = false, spisEntryId }) => {
  const { user } = useAuth();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDownload = (e: React.MouseEvent, photo: {url: string, file: File}) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadToSupabase = async (file: File): Promise<{url: string, storagePath: string} | null> => {
    if (!user) return null;

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `${user.id}/${spisEntryId || 'temp'}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(storagePath);

      return {
        url: urlData.publicUrl,
        storagePath
      };
    } catch (error) {
      console.error('Failed to upload to Supabase:', error);
      return null;
    }
  };

  const handleDrop = async (files: File[]) => {
    if (isLocked || !user) return;

    setIsUploading(true);

    try {
      const newPhotos = await Promise.all(files.map(async (file) => {
        // First, try to upload to Supabase Storage
        const uploadResult = await uploadToSupabase(file);

        if (uploadResult) {
          // Successfully uploaded to Supabase
          return {
            id: Date.now() + Math.random().toString(),
            file,
            url: uploadResult.url,
            storagePath: uploadResult.storagePath,
            description: ''
          };
        } else {
          // Fallback to base64 if upload fails
          return new Promise<{id: string, file: File, url: string, description: string, storagePath?: string}>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: Date.now() + Math.random().toString(),
                file,
                url: reader.result as string,
                description: ''
              });
            };
            reader.readAsDataURL(file);
          });
        }
      }));

      setUploadedPhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Error handling file drop:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId: string, storagePath?: string) => {
    if (isLocked) return;

    // If photo was stored in Supabase, delete it
    if (storagePath) {
      try {
        await supabase.storage.from('photos').remove([storagePath]);
      } catch (error) {
        console.error('Error deleting from storage:', error);
      }
    }

    setUploadedPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex(prev => (prev !== null && prev < uploadedPhotos.length - 1 ? prev + 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, uploadedPhotos.length]);

  return (
    <div className="p-2 flex flex-col gap-4 h-full">
      <h3 className="text-base font-semibold text-gray-700 mb-2">Pridané fotografie</h3>

      <div className="flex-1 overflow-auto">
        {/* Photos Grid */}
        {uploadedPhotos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {uploadedPhotos.map((photo, index) => (
              <div key={photo.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div
                  className="aspect-w-16 aspect-h-9 bg-gray-100 cursor-pointer relative group"
                  onClick={() => setSelectedPhotoIndex(index)}
                  >
                  <img
                      src={photo.url}
                      alt={photo.description || 'Project'}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                  </div>
                  {/* Storage indicator */}
                  {photo.storagePath && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cloud
                    </div>
                  )}
                  </div>
                  <div className="p-2">
                  <input
                      type="text"
                      placeholder="Popis fotky..."
                      value={photo.description}
                      onChange={(e) => {
                      if (isLocked) return;
                      setUploadedPhotos(prev =>
                          prev.map(p =>
                          p.id === photo.id
                              ? {...p, description: e.target.value}
                              : p
                          )
                      );
                      }}
                      disabled={isLocked}
                      className={`w-full text-xs border border-gray-300 px-2 py-1 rounded focus:border-[#e11b28] focus:ring-1 focus:ring-[#e11b28] outline-none ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500 truncate max-w-[120px]" title={photo.file.name}>{photo.file.name}</span>
                      <div className="flex gap-2">
                          <button
                              onClick={(e) => handleDownload(e, photo)}
                              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 font-semibold flex items-center"
                              title="Stiahnuť"
                          >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                              Stiahnuť
                          </button>
                          <button
                          onClick={() => handleDelete(photo.id, photo.storagePath)}
                          disabled={isLocked}
                          className={`text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded hover:bg-red-50 font-semibold ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                          Odstrániť
                          </button>
                      </div>
                  </div>
                  </div>
              </div>
              ))}
          </div>
        )}

        {uploadedPhotos.length === 0 && !isUploading && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Zatiaľ nie sú nahrané žiadne fotky</p>
            <p className="text-xs mt-1">Nahrajte fotky na zobrazenie priebehu projektu</p>
          </div>
        )}

        {isUploading && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28] mx-auto mb-4"></div>
            <p className="text-sm">Nahrávam fotky...</p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <FileDropZone
        onDrop={handleDrop}
        accept="image/*"
        multiple={true}
        disabled={isLocked || isUploading}
        text={isUploading ? "Nahrávam..." : "Kliknite alebo potiahnite fotky sem pre nahranie"}
        icon={
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        }
      />

      {/* Lightbox */}
      {selectedPhotoIndex !== null && (
        <div
            className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-md flex items-center justify-center transition-all duration-300 animate-in fade-in"
            onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-gray-800 hover:text-gray-600 p-2 z-50 bg-white/50 rounded-full hover:bg-white/80 transition-colors shadow-sm"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          {/* Navigation Buttons */}
          {selectedPhotoIndex > 0 && (
            <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 hover:text-gray-600 p-3 z-50 bg-white/50 rounded-full hover:bg-white/80 transition-colors shadow-sm"
                onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex - 1); }}
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path></svg>
            </button>
          )}

          {selectedPhotoIndex < uploadedPhotos.length - 1 && (
            <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-800 hover:text-gray-600 p-3 z-50 bg-white/50 rounded-full hover:bg-white/80 transition-colors shadow-sm"
                onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex + 1); }}
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path></svg>
            </button>
          )}

          {/* Main Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
                key={selectedPhotoIndex} // Force re-render for animation
                src={uploadedPhotos[selectedPhotoIndex].url}
                alt={uploadedPhotos[selectedPhotoIndex].description}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300"
            />
            <div className="mt-6 flex gap-4 items-center animate-in slide-in-from-bottom-4 duration-300 delay-100">
                 <p className="text-gray-800 text-lg font-medium">{uploadedPhotos[selectedPhotoIndex].description || uploadedPhotos[selectedPhotoIndex].file.name}</p>
                 <button
                    onClick={(e) => handleDownload(e, uploadedPhotos[selectedPhotoIndex])}
                    className="flex items-center gap-2 px-4 py-2 bg-[#e11b28] text-white rounded hover:bg-[#c71325] transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                 >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                     Stiahnuť
                 </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
