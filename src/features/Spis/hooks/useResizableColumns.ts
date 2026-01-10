import { useState, useCallback, useRef, useEffect } from 'react';

interface ColumnState {
    [key: string]: number;
}

interface UseResizableColumnsProps {
    defaultWidths: ColumnState;
    visibleColumns: string[]; // Ordered list of visible column keys
    tableRef: React.RefObject<HTMLTableElement>;
}

export const useResizableColumns = ({ defaultWidths, visibleColumns, tableRef }: UseResizableColumnsProps) => {
    // We store explicit pixel widths in state, but logic will ensure they sum to table width
    // Or we could store percentages. Let's store pixels to avoid rounding errors, 
    // but on resize we adjust neighbor.
    const [columnWidths, setColumnWidths] = useState<ColumnState>(defaultWidths);

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

        // Do the same for the neighbor if possible, or fallback to state
        // Finding the next header sibling isn't trivial via refs, so we can rely on state logic 
        // OR just calculate the 'next' start width as state to prevent jumps.
        // Actually best is to just track the current one's delta.

        const nextStartWidth = columnWidths[nextKey] || 10;

        resizingRef.current = {
            key,
            nextKey,
            startX: e.clientX,
            startWidth: currentPercentWidth, // Use visual truth
            nextStartWidth: nextStartWidth,  // Use state for neighbor (it will adjust purely by delta)
            tableWidth: tableWidth
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [columnWidths, visibleColumns, tableRef]);

    const stopResizing = useCallback(() => {
        resizingRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // Optional: on stop, we could normalize widths to percentages if we want to be fully responsive
        // but keeping pixels works if we update them correctly on window resize? 
        // For now, let's stick to pixel trading which is robust for manual resizing.
    }, []);

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
        };
    }, [onMouseMove, stopResizing]);

    return { columnWidths, startResizing, setColumnWidths };
};
