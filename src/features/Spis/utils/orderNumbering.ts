import { ObjednavkaItem, SpisEntry } from '../types';

/**
 * Calculates the next sequential order number based on all existing orders.
 *
 * @param entries All project entries (from SpisContext)
 * @param localItems (Optional) Local order items not yet persisted to entries
 * @returns A 4-digit padded string (e.g., "0015")
 */
export const calculateNextOrderNumber = (
    entries: SpisEntry[],
    localItems: ObjednavkaItem[] = [],
    standaloneOrders: any[] = []
): string => {
    // Collect order numbers from SpisEntries
    const allOrders = entries.flatMap(e => e.fullFormData?.objednavkyItems || []);
    const spisIds = allOrders.map(o => o.cisloObjednavky);

    // Collect order numbers from localItems
    const localIds = localItems.map(o => o.cisloObjednavky);

    // Collect order numbers from StandaloneOrders
    const standaloneIds = standaloneOrders.map(o => o.cislo_objednavky);

    // Combine all IDs
    const allIds = [...spisIds, ...localIds, ...standaloneIds];

    console.log('calculateNextOrderNumber Debug:', {
        spisIds,
        localIds,
        standaloneOrdersCount: standaloneOrders.length,
        standaloneIds,
        allIds
    });

    const maxId = allIds.reduce((max, id) => {
        if (!id) return max;
        const num = parseInt(id, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);

    return (maxId + 1).toString().padStart(4, '0');
};
