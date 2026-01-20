import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  filename: string;
  isDark?: boolean;
  onDownload?: () => void; // Optional custom download handler (e.g., to generate PDF without QR code)
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  filename,
  isDark = false,
  onDownload: customDownload
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // Use smaller scale on mobile for better initial view
  const getInitialScale = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 0.75; // 75% on mobile
    }
    return 1.5; // 150% on desktop
  };
  const [scale, setScale] = useState(getInitialScale);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const isRenderingRef = useRef(false);

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPdfDoc(null);
      setCurrentPage(1);
      setTotalPages(0);
      setScale(getInitialScale());
      setError(null);
      setIsLoading(true);
    }
  }, [isOpen]);

  // Load PDF document
  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    // Reset state before loading new PDF
    setPdfDoc(null);
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    setTotalPages(0);

    const loadPdf = async () => {
      try {
        console.log('Loading PDF from:', pdfUrl);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        console.log('PDF loaded, pages:', pdf.numPages);
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Nepodarilo sa načítať PDF');
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [isOpen, pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      // Prevent overlapping renders
      if (isRenderingRef.current) {
        return;
      }

      // Cancel any previous render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
        renderTaskRef.current = null;
      }

      isRenderingRef.current = true;

      try {
        const page = await pdfDoc.getPage(currentPage);

        // Get device pixel ratio for sharp rendering
        const pixelRatio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * pixelRatio });

        const canvas = canvasRef.current;
        if (!canvas) {
          isRenderingRef.current = false;
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          isRenderingRef.current = false;
          return;
        }

        // Set canvas dimensions at higher resolution
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Scale down the canvas display size
        canvas.style.width = `${viewport.width / pixelRatio}px`;
        canvas.style.height = `${viewport.height / pixelRatio}px`;

        // Clear canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render PDF page
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;

        console.log('Page rendered successfully');
      } catch (err: any) {
        // Ignore cancellation errors
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      } finally {
        isRenderingRef.current = false;
      }
    };

    // Small delay to ensure canvas is ready
    const timeoutId = setTimeout(renderPage, 50);

    return () => {
      clearTimeout(timeoutId);
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handleDownload = () => {
    // Use custom download handler if provided (e.g., for generating PDF without QR code)
    if (customDownload) {
      customDownload();
      return;
    }
    // Default: download the preview PDF as-is
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  if (!isOpen || !pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full h-full md:w-[95vw] md:h-[95vh] md:max-w-6xl flex flex-col md:rounded-xl shadow-2xl overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between px-3 md:px-4 py-2 md:py-3 border-b ${isDark ? 'border-dark-600 bg-dark-700' : 'border-gray-200 bg-gray-50'}`}>
          {/* Top row on mobile: filename and close button */}
          <div className="flex items-center justify-between md:justify-start md:gap-4 mb-2 md:mb-0">
            <h3 className={`font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {filename}
            </h3>
            {/* Close button - always visible on mobile */}
            <button
              onClick={onClose}
              className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Zavrieť"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {totalPages > 0 && (
              <span className={`hidden md:inline text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Strana {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between md:justify-end gap-1 md:gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Oddialiť"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className={`text-xs md:text-sm min-w-[40px] md:min-w-[50px] text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                title="Priblížiť"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
            </div>

            <div className={`w-px h-5 md:h-6 mx-1 md:mx-2 ${isDark ? 'bg-dark-500' : 'bg-gray-300'}`} />

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg text-xs md:text-sm font-medium hover:from-[#c71325] hover:to-[#9e1019] transition-all"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Stiahnuť</span>
            </button>

            {/* Close button - desktop only (mobile has it in title row) */}
            <button
              onClick={onClose}
              className={`hidden md:flex p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Zavrieť"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-auto ${isDark ? 'bg-dark-900' : 'bg-gray-100'}`}
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28]"></div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Načítavam PDF...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
            </div>
          )}
          {!isLoading && !error && (
            <div className="inline-block p-4 min-w-full">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="shadow-lg bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with page navigation */}
        {totalPages > 1 && !isLoading && !error && (
          <div className={`flex items-center justify-center gap-4 px-4 py-3 border-t ${isDark ? 'border-dark-600 bg-dark-700' : 'border-gray-200 bg-gray-50'}`}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage <= 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Predchádzajúca
            </button>

            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage >= totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              Ďalšia
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
