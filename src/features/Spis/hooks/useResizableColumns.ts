import { useState, useCallback, useRef, useEffect } from 'react';

interface ColumnState {
    [key: string]: number;
}

interface UseResizableColumnsProps {
    defaultWidths: ColumnState;
    savedWidths?: ColumnState; // Widths loaded from quote data
    visibleColumns: string[]; // Ordered list of visible column keys
    tableRef: React.RefObject<HTMLTableElement>;
    onWidthsChange?: (widths: ColumnState) => void; // Callback to save widths to quote data
}

export const useResizableColumns = ({ defaultWidths, savedWidths, visibleColumns, tableRef, onWidthsChange }: UseResizableColumnsProps) => {
    // Initialize with saved widths if available, otherwise use defaults
    const [columnWidths, setColumnWidths] = useState<ColumnState>(() => ({
        ...defaultWidths,
        ...(savedWidths || {})
    }));

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update widths if savedWidths changes (e.g., when switching quotes)
    useEffect(() => {
        if (savedWidths) {
            setColumnWidths(prev => ({
                ...defaultWidths,
                ...savedWidths
            }));
        }
    }, [savedWidths, defaultWidths]);

    // We need to track the "start" state of both columns being resized
    const resizingRef = useRef<{
        key: string;
        nextKey: string;
        startX: number;
        startWidth: number;
        nextStartWidth: number;
        tableWidth: number;
    } | null>(null);

    const startResizing = useCallback((key: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const currentIndex = visibleColumns.indexOf(key);
        if (currentIndex === -1 || currentIndex === visibleColumns.length - 1) return;

        if (!tableRef.current) return;

        const nextKey = visibleColumns[currentIndex + 1];

        // precise table width
        const tableRect = tableRef.current.getBoundingClientRect();
        const tableWidth = tableRect.width;

        // Get actual current pixel width of the column being resized to avoid state drift
        // We assume the handle is inside the header cell
        const headerCell = (e.target as HTMLElement).closest('th');
        const currentPixelWidth = headerCell?.getBoundingClientRect().width || 0;

        // Calculate the starting percentage from the ACTUAL visual width
        // This ensures the mouse stays synced 1:1 with the border
        const currentPercentWidth = (currentPixelWidth / tableWidth) * 100;

        // Try to get next sibling width from DOM for consistency
        // If we mix DOM width for current and State width for next, the sum changes causing jumps
        const nextHeaderCell = headerCell?.nextElementSibling as HTMLElement;
        let nextPercentWidth = columnWidths[nextKey] || 10;

        if (nextHeaderCell) {
            const nextPixelWidth = nextHeaderCell.getBoundingClientRect().width || 0;
            nextPercentWidth = (nextPixelWidth / tableWidth) * 100;
        }

        resizingRef.current = {
            key,
            nextKey,
            startX: e.clientX,
            startWidth: currentPercentWidth, // Use visual truth
            nextStartWidth: nextPercentWidth,  // Use visual truth for neighbor too
            tableWidth: tableWidth
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [columnWidths, visibleColumns, tableRef]);

    const stopResizing = useCallback(() => {
        if (resizingRef.current && onWidthsChange) {
            // Save widths after resizing stops (debounced)
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                setColumnWidths(currentWidths => {
                    onWidthsChange(currentWidths);
                    return currentWidths;
                });
            }, 300); // Debounce for 300ms
        }

        resizingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [onWidthsChange]);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (resizingRef.current) {
            const { key, nextKey, startX, startWidth, nextStartWidth, tableWidth } = resizingRef.current;
            const diffPx = e.clientX - startX;

            // Convert pixel difference to percentage
            // If tableWidth is 1000px, 10px diff is 1%
            const diffPercent = (diffPx / tableWidth) * 100;

            // Constrain resize so neither column goes below ~2% (roughly 20-30px)
            const MIN_PERCENT = 2;

            let newWidth = startWidth + diffPercent;
            let newNextWidth = nextStartWidth - diffPercent;

            // Apply constraints
            if (newWidth < MIN_PERCENT) {
                const correction = MIN_PERCENT - newWidth;
                newWidth = MIN_PERCENT;
                newNextWidth -= correction;
            } else if (newNextWidth < MIN_PERCENT) {
                const correction = MIN_PERCENT - newNextWidth;
                newNextWidth = MIN_PERCENT;
                newWidth -= correction;
            }

            setColumnWidths(prev => ({
                ...prev,
                [key]: newWidth,
                [nextKey]: newNextWidth
            }));
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', stopResizing);
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [onMouseMove, stopResizing]);

    return { columnWidths, startResizing, setColumnWidths };
};
