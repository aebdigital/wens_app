import React, { useState, useEffect } from 'react';

interface FotkyTabProps {
  uploadedPhotos: {id: string, file: File, url: string, description: string}[];
  setUploadedPhotos: React.Dispatch<React.SetStateAction<{id: string, file: File, url: string, description: string}[]>>;
}

export const FotkyTab: React.FC<FotkyTabProps> = ({ uploadedPhotos, setUploadedPhotos }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const handleDownload = (e: React.MouseEvent, photo: {url: string, file: File}) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="p-2">
      {/* Upload Section */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pridať fotky projektu</h3>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept="image/*" 
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              Promise.all(files.map(file => {
                  return new Promise<{id: string, file: File, url: string, description: string}>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                          resolve({
                              id: Date.now() + Math.random().toString(),
                              file,
                              url: reader.result as string, // Store as Base64 immediately
                              description: ''
                          });
                      };
                      reader.readAsDataURL(file);
                  });
              })).then(newPhotos => {
                  setUploadedPhotos(prev => [...prev, ...newPhotos]);
              });
              e.target.value = ''; // Reset input
            }}
            className="text-xs"
          />
          <span className="text-xs text-gray-600">Vyberte fotky na nahranie</span>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
            <div className="p-2">
              <input 
                type="text" 
                placeholder="Popis fotky..."
                value={photo.description}
                onChange={(e) => {
                  setUploadedPhotos(prev => 
                    prev.map(p => 
                      p.id === photo.id 
                        ? {...p, description: e.target.value}
                        : p
                    )
                  );
                }}
                className="w-full text-xs border border-gray-300 px-2 py-1 rounded focus:border-[#e11b28] focus:ring-1 focus:ring-[#e11b28] outline-none"
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
                    onClick={() => {
                        // Revoke not needed for base64 but good practice if we used blob
                        setUploadedPhotos(prev => prev.filter(p => p.id !== photo.id));
                    }}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded hover:bg-red-50 font-semibold"
                    >
                    Odstrániť
                    </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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

      {uploadedPhotos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Zatiaľ nie sú nahrané žiadne fotky</p>
          <p className="text-xs mt-1">Nahrajte fotky na zobrazenie priebehu projektu</p>
        </div>
      )}
    </div>
  );
};
