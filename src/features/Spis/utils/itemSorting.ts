/**
 * Utility for sorting items in generic tables to keep specific items at the bottom.
 */

export const sortPinnedItems = <T extends { nazov: string }>(items: T[], pinnedPatterns: string[]): T[] => {
    const normalItems: T[] = [];
    const pinnedItems: T[] = [];

    items.forEach(item => {
        const isPinned = pinnedPatterns.some(pattern =>
            item.nazov.toLowerCase().includes(pattern.toLowerCase())
        );
        if (isPinned) {
            pinnedItems.push(item);
        } else {
            normalItems.push(item);
        }
    });

    // Sort pinned items based on the order of patterns in the array
    pinnedItems.sort((a, b) => {
        const aPatternIndex = pinnedPatterns.findIndex(pattern =>
            a.nazov.toLowerCase().includes(pattern.toLowerCase())
        );
        const bPatternIndex = pinnedPatterns.findIndex(pattern =>
            b.nazov.toLowerCase().includes(pattern.toLowerCase())
        );
        return aPatternIndex - bPatternIndex;
    });

    return [...normalItems, ...pinnedItems];
};
