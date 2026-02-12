import { useState, useCallback, useRef } from 'react';
import { useResizableColumns } from './useResizableColumns';

export const useResizableTable = (initialColumns: string[]) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(initialColumns);
    const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState(false);

    // Calculate default widths (uniform distribution)
    const defaultWidths = initialColumns.reduce((acc, col) => ({ ...acc, [col]: 100 / initialColumns.length }), {});

    const { columnWidths, startResizing, setColumnWidths } = useResizableColumns({
        defaultWidths,
        visibleColumns,
        tableRef
    });

    const hiddenColumns = initialColumns.filter(col => !visibleColumns.includes(col));

    const isColumnVisible = useCallback((key: string) => visibleColumns.includes(key), [visibleColumns]);

    const toggleColumnVisibility = useCallback((key: string) => {
        setVisibleColumns(prev => {
            if (prev.includes(key)) {
                return prev.filter(c => c !== key);
            } else {
                const newVisible = [...prev, key];
                return newVisible.sort((a, b) => initialColumns.indexOf(a) - initialColumns.indexOf(b));
            }
        });
    }, [initialColumns]);

    return {
        tableRef,
        columnWidths,
        setColumnWidths,
        startResizing,
        visibleColumns,
        hiddenColumns,
        isColumnVisible,
        toggleColumnVisibility,
        showHiddenColumnsMenu,
        setShowHiddenColumnsMenu
    };
};
