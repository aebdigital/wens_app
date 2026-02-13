import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { SpisEntry, CenovaPonukaItem, SpisFormData } from '../types';
import { useSpis, dbToSpisEntry } from '../../../contexts/SpisContext';
import { supabase } from '../../../lib/supabase';

interface SpisStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: SpisEntry[];
}

// Month names in Slovak
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];

type FilterType = 'last12months' | 'thisYear' | 'lastYear' | 'custom';
type TabType = 'overview' | 'cashflow';

// Parse price string to number
const parsePrice = (priceStr: string | number | undefined | null): number => {
    if (priceStr === undefined || priceStr === null) return 0;
    if (typeof priceStr === 'number') return isNaN(priceStr) ? 0 : priceStr;
    const cleaned = String(priceStr).replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

// Parse date string
const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    const parts = dateStr.match(/^(\d{1,2})[. /]+(\d{1,2})[. /]+(\d{4})/);
    if (parts) {
        const d = new Date(`${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
};

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const formatDateDisplay = (dateStr: string | undefined): string => {
    const date = parseDate(dateStr);
    if (!date) return '';
    return `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}`;
};

const getLast12MonthsRange = (): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    return { start, end };
};

const countItemsInOffer = (offer: CenovaPonukaItem): number => {
    let count = 0;
    if (offer.data) {
        if ('vyrobky' in offer.data && Array.isArray(offer.data.vyrobky)) {
            offer.data.vyrobky.forEach((item: any) => count += parsePrice(item.ks) || 1);
        }
        if ('polozky' in offer.data && Array.isArray(offer.data.polozky)) {
            offer.data.polozky.forEach((item: any) => count += parsePrice(item.mnozstvo) || 1);
        }
        if ('kovanie' in offer.data && Array.isArray(offer.data.kovanie)) {
            offer.data.kovanie.forEach((item: any) => count += parsePrice(item.ks) || 1);
        }
        if ('montaz' in offer.data && Array.isArray(offer.data.montaz)) {
            offer.data.montaz.forEach((item: any) => count += parsePrice(item.ks) || 1);
        }
    }
    return count || 1;
};

export const SpisStatsModal: React.FC<SpisStatsModalProps> = ({ isOpen, onClose, entries }) => {
    const { isDark } = useTheme();
    const { updateEntry } = useSpis();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [allEntries, setAllEntries] = useState<SpisEntry[]>([]);
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    // Fetch ALL entries from Supabase when modal opens (paginated entries prop is incomplete)
    useEffect(() => {
        if (!isOpen) return;

        const fetchAllEntries = async () => {
            setIsLoadingAll(true);
            try {
                const { data, error } = await supabase
                    .from('spis_entries')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error('Error loading all entries for stats:', error);
                    setAllEntries(entries); // fallback to paginated entries
                } else {
                    setAllEntries((data || []).map(dbToSpisEntry));
                }
            } catch (err) {
                console.error('Failed to load all entries for stats:', err);
                setAllEntries(entries);
            } finally {
                setIsLoadingAll(false);
            }
        };

        fetchAllEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Use allEntries for stats calculations, fall back to entries prop while loading
    const statsEntries = allEntries.length > 0 ? allEntries : entries;

    // --- Overview Logic ---
    const [filterType, setFilterType] = useState<FilterType>('last12months');
    const [customStartDate, setCustomStartDate] = useState<string>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11);
        date.setDate(1);
        return formatDateForInput(date);
    });
    const [customEndDate, setCustomEndDate] = useState<string>(formatDateForInput(new Date()));

    const dateRange = useMemo(() => {
        const now = new Date();
        let start: Date;
        let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        switch (filterType) {
            case 'last12months': {
                const range = getLast12MonthsRange();
                start = range.start;
                end = range.end;
                break;
            }
            case 'thisYear':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            case 'lastYear':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                break;
            case 'custom':
                start = new Date(customStartDate);
                end = new Date(customEndDate);
                end.setHours(23, 59, 59);
                break;
            default:
                start = getLast12MonthsRange().start;
        }
        return { start, end };
    }, [filterType, customStartDate, customEndDate]);

    const stats = useMemo(() => {
        const excludedStatuses = ['Storno', 'Zrušené'];
        const completedStatuses = ['Uzavreté', 'Vybavené', 'Ukončené', 'Hotovo', 'Dokončené'];

        // Include all entries with order number and financial data (matching cashflow logic)
        const filteredEntries = statsEntries.filter(entry => {
            if (excludedStatuses.includes(entry.stav)) return false;

            // Must have assigned order number
            if (!entry.cisloZakazky || entry.cisloZakazky.trim() === '') return false;

            // Must have financial data: selected price offer or manual price
            const formData = entry.fullFormData;
            if (!formData) return false;
            const hasSelectedOffer = formData.cenovePonukyItems?.some(item => item.selected);
            const hasManualPrice = parsePrice(formData.cena) > 0;
            if (!hasSelectedOffer && !hasManualPrice) return false;

            // Date filter: use creation date primarily, completion date as fallback
            const creationDateStr = entry.datum;
            const completionDateStr = formData.terminDokoncenia;
            let date = parseDate(creationDateStr) || parseDate(completionDateStr);
            if (!date) return false;
            return date >= dateRange.start && date <= dateRange.end;
        });

        let totalPrice = 0;
        let totalDeposits = 0;
        let totalRemainingBalance = 0;
        let totalItems = 0;
        let totalOrders = 0;
        const monthlyData: { [key: string]: { revenue: number; deposits: number; items: number } } = {};

        filteredEntries.forEach(entry => {
            const formData = entry.fullFormData;
            if (!formData) return;

            const creationDateStr = entry.datum;
            const completionDateStr = formData.terminDokoncenia;
            const date = parseDate(creationDateStr) || parseDate(completionDateStr);
            const monthKey = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 'unknown';

            if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, deposits: 0, items: 0 };

            const selectedOffers = formData.cenovePonukyItems?.filter(item => item.selected) || [];

            if (selectedOffers.length > 0) {
                selectedOffers.forEach(offer => {
                    // Use same price priority as cashflow: cenaDohodou > prenesenieDP (cenaBezDPH) > cenaSDPH
                    const offerData = offer.data as any;
                    let offerPrice: number;
                    if (offerData?.cenaDohodou && offerData?.cenaDohodouValue) {
                        offerPrice = parsePrice(offerData.cenaDohodouValue);
                    } else if (offerData?.prenesenieDP) {
                        offerPrice = parsePrice(offer.cenaBezDPH);
                    } else {
                        offerPrice = parsePrice(offer.cenaSDPH);
                    }
                    totalPrice += offerPrice;
                    monthlyData[monthKey].revenue += offerPrice;
                    const itemCount = countItemsInOffer(offer);
                    totalItems += itemCount;
                    monthlyData[monthKey].items += itemCount;

                    if (offer.data && 'deposits' in offer.data && Array.isArray(offer.data.deposits)) {
                        offer.data.deposits.forEach((dep: any) => {
                            const depAmount = parsePrice(dep.amount);
                            totalDeposits += depAmount;
                            monthlyData[monthKey].deposits += depAmount;
                        });
                    } else {
                        const data = offer.data as any;
                        if (data) {
                            const platba1 = parsePrice(data.platba1Amount) || (offerPrice * (parsePrice(data.platba1Percent) || 0) / 100);
                            const platba2 = parsePrice(data.platba2Amount) || (offerPrice * (parsePrice(data.platba2Percent) || 0) / 100);
                            totalDeposits += platba1 + platba2;
                            monthlyData[monthKey].deposits += platba1 + platba2;
                        }
                    }
                });
                totalOrders++;
            } else {
                const price = parsePrice(formData.cena);
                if (price > 0) {
                    totalPrice += price;
                    monthlyData[monthKey].revenue += price;
                    totalOrders++;
                    totalItems++;
                }
            }

            const zaloha1 = parsePrice(formData.zaloha1);
            const zaloha2 = parsePrice(formData.zaloha2);
            if ((zaloha1 > 0 || zaloha2 > 0) && selectedOffers.length === 0) {
                totalDeposits += zaloha1 + zaloha2;
                monthlyData[monthKey].deposits += zaloha1 + zaloha2;
            }

            if (formData.financieDeposits && Array.isArray(formData.financieDeposits) && selectedOffers.length === 0) {
                formData.financieDeposits.forEach(dep => {
                    const depAmount = parsePrice(dep.amount);
                    if (depAmount > 0) {
                        totalDeposits += depAmount;
                        monthlyData[monthKey].deposits += depAmount;
                    }
                });
            }

            const doplatok = parsePrice(formData.doplatok);
            if (doplatok > 0) totalRemainingBalance += doplatok;
        });

        if (totalRemainingBalance === 0 && totalPrice > totalDeposits) {
            totalRemainingBalance = totalPrice - totalDeposits;
        }

        const sortedMonths = Object.keys(monthlyData).sort();
        const chartData = sortedMonths.map(key => ({ month: key, ...monthlyData[key] }));

        const completedCount = filteredEntries.filter(e => completedStatuses.includes(e.stav)).length;

        return {
            totalPrice,
            totalDeposits,
            totalRemainingBalance,
            totalItems,
            totalOrders,
            filteredCount: filteredEntries.length,
            completedCount,
            chartData,
            maxRevenue: Math.max(...chartData.map(d => d.revenue), 1)
        };
    }, [statsEntries, dateRange]);

    const formatMonthLabel = (monthKey: string): string => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        return `${MONTH_NAMES[monthIndex]} ${year.slice(2)}`;
    };

    // --- Cashflow Logic ---
    const cashflowData = useMemo(() => {
        // Filter for "Active" projects (not closed) that have relevant financial data
        // "Data to these columns will be poured after entering the date of the first deposit"
        return statsEntries
            .filter(entry => {
                // Exclude cancelled only (keep closed/completed)
                const closedStatuses = ['Storno', 'Zrušené'];
                if (closedStatuses.includes(entry.stav)) return false;

                // Only show entries with assigned order number
                if (!entry.cisloZakazky || entry.cisloZakazky.trim() === '') return false;

                // Check for first deposit date or general financial activity
                const formData = entry.fullFormData;
                if (!formData) return false;

                // Has deposit date 1?
                if (formData.zaloha1Datum) return true;

                // Or has price offer selected?
                if (formData.cenovePonukyItems?.some(cp => cp.selected)) return true;

                // Or has explicit price?
                if (parsePrice(formData.cena) > 0) return true;

                return false;
            })
            .sort((a, b) => {
                // Sort by číslo zákazky: e.g. "001/26", "112/26", "001/27"
                // First by year (suffix after /), then by number (prefix before /)
                const parseZakazka = (z: string) => {
                    const parts = z.split('/');
                    if (parts.length === 2) {
                        return { num: parseInt(parts[0], 10) || 0, year: parseInt(parts[1], 10) || 0 };
                    }
                    return { num: 0, year: 0 };
                };
                const za = parseZakazka(a.cisloZakazky);
                const zb = parseZakazka(b.cisloZakazky);
                if (za.year !== zb.year) return za.year - zb.year;
                return za.num - zb.num;
            });
    }, [statsEntries]);

    // Helper function to get the correct invoicing name
    const getInvoicingName = (entry: SpisEntry): string => {
        return entry.konecnyZakaznik || entry.kontaktnaOsoba || '';
    };

    const calculateRowData = (entry: SpisEntry) => {
        const formData = entry.fullFormData || {} as SpisFormData;
        const selectedOffer = formData.cenovePonukyItems?.find(i => i.selected);

        let price = 0;
        let deposit1 = 0;
        let deposit1Date = '';
        let deposit2 = 0;
        let deposit2Date = '';
        let deposit3Date = '';
        let remaining = 0;

        let hasDph = false;
        let hasPrenos = false;
        let hasDohoda = false;

        // Price Calculation
        if (selectedOffer) {
            const offerData = selectedOffer.data as any;
            if (offerData) {
                if (offerData.prenesenieDP) hasPrenos = true;
                if (offerData.cenaDohodou) hasDohoda = true;
            }

            if (hasDohoda && offerData?.cenaDohodouValue) {
                price = parsePrice(offerData.cenaDohodouValue);
            } else if (hasPrenos) {
                price = parsePrice(selectedOffer.cenaBezDPH);
            } else {
                price = parsePrice(selectedOffer.cenaSDPH);
            }
        } else {
            price = parsePrice(formData.cena);
        }

        // Deposits Logic: Prioritize dynamic financieDeposits if available
        const dynDeposits = formData.financieDeposits;
        if (dynDeposits && Array.isArray(dynDeposits) && dynDeposits.length > 0) {
            if (dynDeposits.length >= 1) {
                deposit1 = parsePrice(dynDeposits[0].amount);
                deposit1Date = dynDeposits[0].datum;
            }
            if (dynDeposits.length >= 2) {
                deposit2 = parsePrice(dynDeposits[1].amount);
                deposit2Date = dynDeposits[1].datum;
            }
            // Note: If there are more than 2 deposits, they won't seamlessly fit into the 2-column layout yet.
            // The remaining amount (doplatok) handles the balance.
        } else {
            // Fallback to legacy fields
            deposit1 = parsePrice(formData.zaloha1);
            deposit1Date = formData.zaloha1Datum;
            deposit2 = parsePrice(formData.zaloha2);
            deposit2Date = formData.zaloha2Datum;
        }

        remaining = parsePrice(formData.doplatok);

        // If remaining is 0 but price > deposits, calculate it
        // Note: For dynamic deposits with >2 items, this simple check might be inaccurate if we only sum d1+d2
        // But usually doplatok is explicit in formData
        if (remaining === 0 && price > 0) {
            const depositsSum = deposit1 + deposit2;
            // Only auto-calc remaining if it seems completely unset and we have a price
            if (depositsSum < price) {
                remaining = price - depositsSum;
            }
        }

        deposit3Date = formData.doplatokDatum || '';

        return {
            price,
            deposit1,
            deposit1Date,
            deposit2,
            deposit2Date,
            deposit3Date,
            remaining,
            hasDph,
            hasPrenos,
            hasDohoda
        };
    };

    const cashflowStats = useMemo(() => {
        return cashflowData.reduce((acc, entry) => {
            const row = calculateRowData(entry);

            // Total Price
            acc.totalPrice += row.price;

            // Deposit 1
            if (row.deposit1Date) {
                acc.paid.deposit1 += row.deposit1;
            } else {
                acc.pending.deposit1 += row.deposit1;
            }

            // Deposit 2
            if (row.deposit2Date) {
                acc.paid.deposit2 += row.deposit2;
            } else {
                acc.pending.deposit2 += row.deposit2;
            }

            // Remaining (Doplatok)
            // Use deposit3Date as the date for doplatok payment
            if (row.deposit3Date) {
                acc.paid.remaining += row.remaining;
            } else {
                acc.pending.remaining += row.remaining;
            }

            return acc;
        }, {
            totalPrice: 0,
            paid: { deposit1: 0, deposit2: 0, remaining: 0 },
            pending: { deposit1: 0, deposit2: 0, remaining: 0 }
        });
    }, [cashflowData]);

    const handleNoteChange = async (entryId: string, newNote: string) => {
        const entry = statsEntries.find(e => e.id === entryId);
        if (entry && entry.fullFormData) {
            const updatedEntry = {
                ...entry,
                fullFormData: {
                    ...entry.fullFormData,
                    stat_note: newNote
                }
            };
            await updateEntry(updatedEntry);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`w-full max-w-[98vw] rounded-xl shadow-2xl h-[95vh] flex flex-col ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center bg-gradient-to-br from-[#e11b28] to-[#b8141f] shrink-0 rounded-t-xl">
                    <div className="flex items-center gap-8">
                        <h2 className="text-xl font-bold text-white">Štatistiky</h2>

                        {/* Tabs */}
                        <div className="flex p-1 bg-black/20 rounded-lg">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview'
                                    ? 'bg-white text-[#e11b28] shadow-sm'
                                    : 'text-white/80 hover:text-white'
                                    }`}
                            >
                                Prehľad
                            </button>
                            <button
                                onClick={() => setActiveTab('cashflow')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'cashflow'
                                    ? 'bg-white text-[#e11b28] shadow-sm'
                                    : 'text-white/80 hover:text-white'
                                    }`}
                            >
                                Cashflow
                            </button>
                        </div>
                    </div>

                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoadingAll && (
                        <div className={`px-6 py-2 text-xs text-center ${isDark ? 'text-gray-400 bg-dark-700' : 'text-gray-500 bg-gray-50'}`}>
                            Načítavam všetky záznamy...
                        </div>
                    )}
                    {activeTab === 'overview' ? (
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Time Period Filter */}
                            <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-dark-700' : 'bg-gray-50 border border-gray-200'}`}>
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Obdobie:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {([
                                            { value: 'last12months', label: 'Posledných 12 mesiacov' },
                                            { value: 'thisYear', label: 'Tento rok' },
                                            { value: 'lastYear', label: 'Minulý rok' },
                                            { value: 'custom', label: 'Vlastné' }
                                        ] as const).map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => setFilterType(option.value as FilterType)}
                                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filterType === option.value
                                                    ? 'bg-[#e11b28] text-white'
                                                    : isDark
                                                        ? 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                    {filterType === 'custom' && (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className={`px-3 py-1.5 text-sm rounded-lg border ${isDark ? 'bg-dark-600 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>–</span>
                                            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className={`px-3 py-1.5 text-sm rounded-lg border ${isDark ? 'bg-dark-600 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                <StatsCard title="Celkové tržby" value={stats.totalPrice} icon="money" color="emerald" isDark={isDark} />
                                <StatsCard title="Zálohy" value={cashflowStats.paid.deposit1 + cashflowStats.paid.deposit2 + cashflowStats.paid.remaining} icon="cash" color="blue" isDark={isDark} />
                                <StatsCard title="Doplatky" value={cashflowStats.pending.deposit1 + cashflowStats.pending.deposit2 + cashflowStats.pending.remaining} icon="scale" color="orange" isDark={isDark} />
                                <StatsCard title="Počet položiek" value={stats.totalItems} icon="list" color="purple" isDark={isDark} isCurrency={false} />
                                <StatsCard title="Počet zakázok" value={stats.totalOrders} icon="cart" color="cyan" isDark={isDark} isCurrency={false} />
                                <StatsCard title="Uzavretých projektov" value={stats.completedCount} icon="check" color="pink" isDark={isDark} isCurrency={false} />
                            </div>

                            {/* Chart */}
                            <div className={`rounded-lg p-6 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'} overflow-x-auto shadow-sm`}>
                                <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mesačné tržby</h3>
                                {stats.chartData.length > 0 ? (
                                    <div className="min-w-[600px]">
                                        <div className="h-64 flex items-end justify-between gap-1">
                                            {stats.chartData.map((data, index) => {
                                                const heightPercent = stats.maxRevenue > 0 ? (data.revenue / stats.maxRevenue) * 100 : 0;
                                                const [year, month] = data.month.split('-');
                                                const isCurrentMonth = new Date().getMonth() + 1 === parseInt(month, 10) && new Date().getFullYear() === parseInt(year, 10);
                                                return (
                                                    <div key={index} className="flex-1 flex flex-col items-center gap-2 min-w-[40px]">
                                                        <div className="relative w-full h-48 flex items-end justify-center group">
                                                            <div className={`absolute bottom-full mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isDark ? 'bg-dark-500 text-white' : 'bg-gray-800 text-white'}`}>
                                                                <div className="font-semibold mb-1">{FULL_MONTH_NAMES[parseInt(month, 10) - 1]} {year}</div>
                                                                <div>Tržby: {data.revenue.toLocaleString('sk-SK', { minimumFractionDigits: 2 })} €</div>
                                                                <div>Položky: {data.items}</div>
                                                            </div>
                                                            <div className={`w-full max-w-[35px] rounded-t transition-all ${isCurrentMonth ? 'bg-[#e11b28]' : isDark ? 'bg-emerald-600' : 'bg-emerald-400'} ${data.revenue > 0 ? 'min-h-[4px]' : ''}`} style={{ height: `${Math.max(heightPercent, data.revenue > 0 ? 2 : 0)}%` }} />
                                                        </div>
                                                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ${isCurrentMonth ? 'font-bold text-[#e11b28]' : ''}`}>{formatMonthLabel(data.month)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">Žiadne dáta pre zvolené obdobie</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto bg-white border-t border-gray-200 dark:border-dark-600">
                            {/* Cashflow Table */}
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className={`sticky top-0 z-10 shadow-sm ${isDark ? 'bg-dark-700 text-gray-200' : 'bg-white text-gray-700'} font-semibold border-b ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">číslo CP</th>
                                        <th className="px-4 py-3 whitespace-nowrap">číslo zákazky</th>
                                        <th className="px-4 py-3">Meno</th>
                                        <th className="px-2 py-3 whitespace-nowrap text-center text-xs">s DPH / DP / dohoda</th>
                                        <th className="px-4 py-3 text-right">CENA</th>
                                        <th className="px-4 py-3 whitespace-nowrap">dátum 1</th>
                                        <th className="px-4 py-3 text-right">záloha 1</th>
                                        <th className="px-4 py-3 whitespace-nowrap">dátum 2</th>
                                        <th className="px-4 py-3 text-right">záloha 2</th>
                                        <th className="px-4 py-3 whitespace-nowrap">dátum 3</th>
                                        <th className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">doplatok</th>
                                        <th className="px-4 py-3 min-w-[300px]">poznámky</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-dark-600' : 'divide-gray-200'} ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                                    {cashflowData.map((entry) => {
                                        const rowData = calculateRowData(entry);
                                        return (
                                            <tr key={entry.id} className={`transition-colors ${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'}`}>
                                                <td className={`px-4 py-3 font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{entry.cisloCP}</td>
                                                <td className="px-4 py-3">{entry.cisloZakazky}</td>
                                                <td className="px-4 py-3 truncate max-w-[200px]" title={getInvoicingName(entry)}>
                                                    {getInvoicingName(entry)}
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        {rowData.hasPrenos && <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-bold" title="Prenos daňovej povinnosti">DP</span>}
                                                        {rowData.hasDohoda && <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold" title="Cena dohodou">DOH</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">
                                                    {rowData.price.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs text-center">{formatDateDisplay(rowData.deposit1Date)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {rowData.deposit1 > 0 ? rowData.deposit1.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs text-center">{formatDateDisplay(rowData.deposit2Date)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {rowData.deposit2 > 0 ? rowData.deposit2.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs text-center">{formatDateDisplay(rowData.deposit3Date)}</td>
                                                <td className={`px-4 py-3 text-right font-bold ${isDark ? 'text-blue-400 bg-blue-900/10' : 'text-blue-600 bg-blue-50/30'}`}>
                                                    {rowData.remaining.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={entry.fullFormData?.stat_note || ''}
                                                        onChange={(e) => handleNoteChange(entry.id!, e.target.value)}
                                                        className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all ${isDark
                                                            ? 'bg-dark-700 border-dark-600 text-gray-200 focus:bg-dark-600'
                                                            : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:border-blue-300'
                                                            }`}
                                                        placeholder="Poznámka..."
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Footer / Paid Totals (Uhradené) */}
                                    <tr className={`sticky bottom-[45px] font-bold border-t-2 shadow-sm ${isDark ? 'bg-dark-750 text-emerald-400 border-dark-500' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                        <td className="px-4 py-3 text-right" colSpan={3}></td>
                                        <td className={`px-4 py-3 text-right text-base ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Spolu</td>
                                        <td className={`px-4 py-3 text-right font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                            {cashflowStats.totalPrice.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">Uhradené</td>
                                        <td className="px-4 py-3 text-right">
                                            {cashflowStats.paid.deposit1.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right">
                                            {cashflowStats.paid.deposit2.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right">
                                            {cashflowStats.paid.remaining.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                    </tr>

                                    {/* Footer / Pending Totals (Neuhradené/Očakávané) */}
                                    <tr className={`sticky bottom-0 font-bold border-t border-dashed shadow-lg ${isDark ? 'bg-dark-700 text-orange-400 border-dark-600' : 'bg-gray-100 text-orange-600 border-gray-300'}`}>
                                        <td className="px-4 py-3 text-right" colSpan={5}></td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">Na úhradu</td>
                                        <td className="px-4 py-3 text-right">
                                            {cashflowStats.pending.deposit1.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right">
                                            {cashflowStats.pending.deposit2.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right">
                                            {cashflowStats.pending.remaining.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Component for Stats Cards
const StatsCard = ({ title, value, subtitle, icon, color, isDark, isCurrency = true }: any) => {
    const getColorClasses = (color: string) => {
        switch (color) {
            case 'emerald': return 'text-emerald-500 bg-emerald-100/10 border-emerald-500/20';
            case 'blue': return 'text-blue-500 bg-blue-100/10 border-blue-500/20';
            case 'orange': return 'text-orange-500 bg-orange-100/10 border-orange-500/20';
            case 'purple': return 'text-purple-500 bg-purple-100/10 border-purple-500/20';
            case 'cyan': return 'text-cyan-500 bg-cyan-100/10 border-cyan-500/20';
            case 'pink': return 'text-pink-500 bg-pink-100/10 border-pink-500/20';
            default: return 'text-gray-500 bg-gray-100/10 border-gray-500/20';
        }
    };

    return (
        <div className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'} shadow-sm`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isCurrency ? `${value.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : value.toLocaleString('sk-SK')}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${getColorClasses(color)}`}>
                    <StatsIcon name={icon} />
                </div>
            </div>
        </div>
    );
};

const StatsIcon = ({ name }: { name: string }) => {
    switch (name) {
        case 'money': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'cash': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
        case 'scale': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>; // Replaced with better icon manually if needed, standard scale icon might differ
        case 'list': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>; // Simple list
        case 'cart': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
        case 'check': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
        default: return null;
    }
};
