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
    localItems: ObjednavkaItem[] = []
): string => {
    const allOrders = entries.flatMap(e => e.fullFormData?.objednavkyItems || []);
    const allIds = [...allOrders, ...localItems].map(o => o.cisloObjednavky);

    const maxId = allIds.reduce((max, id) => {
        if (!id) return max;
        const num = parseInt(id, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);

    return (maxId + 1).toString().padStart(4, '0');
};
