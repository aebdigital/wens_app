import React, { useState, useEffect } from 'react';
import { FileDropZone } from '../../../components/common/FileDropZone';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { compressImage, shouldCompressFile } from '../../../utils/imageCompression';
// Note: uploadToSupabaseStorage is available in photoMigration.ts if migration UI is added later

interface FotkyTabProps {
  uploadedPhotos: { id: string, file: File, url: string, description: string, storagePath?: string }[];
  setUploadedPhotos: React.Dispatch<React.SetStateAction<{ id: string, file: File, url: string, description: string, storagePath?: string }[]>>;
  isLocked?: boolean;
  spisEntryId?: string;
}

export const FotkyTab: React.FC<FotkyTabProps> = ({ uploadedPhotos, setUploadedPhotos, isLocked = false, spisEntryId }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDownload = (e: React.MouseEvent, photo: { url: string, file: File }) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadToSupabase = async (file: File): Promise<{ url: string, storagePath: string } | null> => {
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
      const newPhotos = await Promise.all(files.map(async (originalFile) => {
        // Compress the image if it's a compressible format (JPEG, PNG, WebP, etc.)
        // Professional formats (CAD, PDF, RAW, etc.) are left untouched
        let file = originalFile;
        if (shouldCompressFile(originalFile)) {
          try {
            file = await compressImage(originalFile, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.8,
              outputFormat: 'image/jpeg'
            });
          } catch (compressionError) {
            console.error('Compression failed, using original:', compressionError);
            file = originalFile;
          }
        }

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
          return new Promise<{ id: string, file: File, url: string, description: string, storagePath?: string }>((resolve) => {
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
      <div className="flex-1 overflow-auto">
        {/* Photos Grid */}
        {uploadedPhotos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {uploadedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                {/* Image Container */}
                <div
                  className="aspect-w-16 aspect-h-9 bg-gray-100 cursor-pointer relative"
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  <img
                    src={photo.url}
                    alt={photo.description || 'Project'}
                    className="w-full h-64 object-cover"
                  />

                  {/* Hover Overlay Gradient (optional integration) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />

                  {/* Top Right Actions - Icons Only */}
                  <div className="absolute top-2 right-2 flex gap-2 z-10" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDownload(e, photo)}
                      className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
                      title="Stiahnuť"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id, photo.storagePath)}
                      disabled={isLocked}
                      className={`p-2 bg-red-600/80 hover:bg-red-700/90 text-white rounded-full backdrop-blur-sm transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Odstrániť"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>

                  {/* Bottom Description Overlay - Blur & White Text */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-3 bg-black/30 backdrop-blur-md flex flex-col gap-1 z-10"
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      placeholder="Popis fotky..."
                      value={photo.description}
                      onChange={(e) => {
                        if (isLocked) return;
                        setUploadedPhotos(prev =>
                          prev.map(p =>
                            p.id === photo.id
                              ? { ...p, description: e.target.value }
                              : p
                          )
                        );
                      }}
                      disabled={isLocked}
                      className={`w-full text-sm bg-transparent border-b border-white/30 text-white placeholder-white/60 px-1 py-0.5 focus:border-white focus:outline-none ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                    <span className="text-[10px] text-white/50 truncate px-1">{photo.file.name}</span>
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
        capture="environment"
        icon={
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      {/* Lightbox */}
      {selectedPhotoIndex !== null && (
        <div
          className={`fixed inset-0 z-[60] backdrop-blur-md flex items-center justify-center transition-all duration-300 animate-in fade-in ${isDark ? 'bg-dark-900/95' : 'bg-white/90'}`}
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Close button */}
          <button
            className={`absolute top-4 right-4 p-2 z-50 rounded-full transition-colors shadow-sm ${isDark ? 'text-gray-200 hover:text-white bg-dark-700/50 hover:bg-dark-600/80' : 'text-gray-800 hover:text-gray-600 bg-white/50 hover:bg-white/80'}`}
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          {/* Navigation Buttons */}
          {selectedPhotoIndex > 0 && (
            <button
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 z-50 rounded-full transition-colors shadow-sm ${isDark ? 'text-gray-200 hover:text-white bg-dark-700/50 hover:bg-dark-600/80' : 'text-gray-800 hover:text-gray-600 bg-white/50 hover:bg-white/80'}`}
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex - 1); }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path></svg>
            </button>
          )}

          {selectedPhotoIndex < uploadedPhotos.length - 1 && (
            <button
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 z-50 rounded-full transition-colors shadow-sm ${isDark ? 'text-gray-200 hover:text-white bg-dark-700/50 hover:bg-dark-600/80' : 'text-gray-800 hover:text-gray-600 bg-white/50 hover:bg-white/80'}`}
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
              <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{uploadedPhotos[selectedPhotoIndex].description || uploadedPhotos[selectedPhotoIndex].file.name}</p>
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
