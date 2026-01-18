import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { SpisEntry, CenovaPonukaItem } from '../types';

interface SpisStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: SpisEntry[];
}

// Month names in Slovak
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];

type FilterType = 'last12months' | 'thisYear' | 'lastYear' | 'custom';

// Parse price string to number (handles formats like "1 234,56" or "1234.56")
const parsePrice = (priceStr: string | number | undefined | null): number => {
    if (priceStr === undefined || priceStr === null) return 0;
    if (typeof priceStr === 'number') return isNaN(priceStr) ? 0 : priceStr;
    // Remove spaces, replace comma with dot
    const cleaned = String(priceStr).replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

// Parse date string (handles ISO, DD.MM.YYYY, DD. MM. YYYY, DD/MM/YYYY)
const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;

    // Try standard date parsing first (ISO)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Try loose format (DD.MM.YYYY, DD. MM. YYYY, DD/MM/YYYY)
    const parts = dateStr.match(/^(\d{1,2})[. /]+(\d{1,2})[. /]+(\d{4})/);
    if (parts) {
        const d = new Date(`${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};

// Format date for input
const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Get last 12 months range
const getLast12MonthsRange = (): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    return { start, end };
};

// Count items in a price offer
const countItemsInOffer = (offer: CenovaPonukaItem): number => {
    let count = 0;
    if (offer.data) {
        // Count vyrobky (products)
        if ('vyrobky' in offer.data && Array.isArray(offer.data.vyrobky)) {
            offer.data.vyrobky.forEach((item: any) => {
                count += parsePrice(item.ks) || 1;
            });
        }
        // Count polozky for puzdra
        if ('polozky' in offer.data && Array.isArray(offer.data.polozky)) {
            offer.data.polozky.forEach((item: any) => {
                count += parsePrice(item.mnozstvo) || 1;
            });
        }
        // Count kovanie
        if ('kovanie' in offer.data && Array.isArray(offer.data.kovanie)) {
            offer.data.kovanie.forEach((item: any) => {
                count += parsePrice(item.ks) || 1;
            });
        }
        // Count montaz
        if ('montaz' in offer.data && Array.isArray(offer.data.montaz)) {
            offer.data.montaz.forEach((item: any) => {
                count += parsePrice(item.ks) || 1;
            });
        }
    }
    return count || 1; // At least 1 item per offer
};

export const SpisStatsModal: React.FC<SpisStatsModalProps> = ({ isOpen, onClose, entries }) => {
    const { isDark } = useTheme();

    // Filter state
    const [filterType, setFilterType] = useState<FilterType>('last12months');
    const [customStartDate, setCustomStartDate] = useState<string>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11);
        date.setDate(1);
        return formatDateForInput(date);
    });
    const [customEndDate, setCustomEndDate] = useState<string>(formatDateForInput(new Date()));

    // Calculate date range based on filter type
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

    // Calculate all statistics
    const stats = useMemo(() => {
        // Filter entries with completed status
        const completedStatuses = ['Uzavreté', 'Vybavené', 'Ukončené', 'Hotovo', 'Dokončené'];

        const filteredEntries = entries.filter(entry => {
            // Check status
            if (!completedStatuses.includes(entry.stav)) return false;

            // Check date range
            const completionDateStr = entry.fullFormData?.terminDokoncenia;
            const creationDateStr = entry.datum;
            let date = parseDate(completionDateStr) || parseDate(creationDateStr);

            if (!date) return false;

            return date >= dateRange.start && date <= dateRange.end;
        });

        // Calculate totals
        let totalPrice = 0;
        let totalDeposits = 0;
        let totalRemainingBalance = 0;
        let totalItems = 0;
        let totalOrders = 0;

        // Monthly data for chart
        const monthlyData: { [key: string]: { revenue: number; deposits: number; items: number } } = {};

        filteredEntries.forEach(entry => {
            const formData = entry.fullFormData;
            if (!formData) return;

            // Get date for monthly grouping
            const completionDateStr = formData.terminDokoncenia;
            const creationDateStr = entry.datum;
            const date = parseDate(completionDateStr) || parseDate(creationDateStr);

            const monthKey = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 'unknown';

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, deposits: 0, items: 0 };
            }

            // Calculate from selected price offer (cenovePonukyItems with selected flag)
            const selectedOffers = formData.cenovePonukyItems?.filter(item => item.selected) || [];

            if (selectedOffers.length > 0) {
                selectedOffers.forEach(offer => {
                    const offerPrice = parsePrice(offer.cenaSDPH);
                    totalPrice += offerPrice;
                    monthlyData[monthKey].revenue += offerPrice;

                    // Count items in offer
                    const itemCount = countItemsInOffer(offer);
                    totalItems += itemCount;
                    monthlyData[monthKey].items += itemCount;

                    // Calculate deposits from offer data
                    if (offer.data && 'deposits' in offer.data && Array.isArray(offer.data.deposits)) {
                        offer.data.deposits.forEach((dep: any) => {
                            const depAmount = parsePrice(dep.amount);
                            totalDeposits += depAmount;
                            monthlyData[monthKey].deposits += depAmount;
                        });
                    } else {
                        // Fallback to platba percentages
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
                // Fallback to cena field in formData
                const price = parsePrice(formData.cena);
                if (price > 0) {
                    totalPrice += price;
                    monthlyData[monthKey].revenue += price;
                    totalOrders++;
                    totalItems++; // Count as 1 item if no detailed breakdown
                }
            }

            // Add deposits from financie section (zálohy)
            const zaloha1 = parsePrice(formData.zaloha1);
            const zaloha2 = parsePrice(formData.zaloha2);
            if (zaloha1 > 0 || zaloha2 > 0) {
                // Only add if not already counted from offers
                if (selectedOffers.length === 0) {
                    totalDeposits += zaloha1 + zaloha2;
                    monthlyData[monthKey].deposits += zaloha1 + zaloha2;
                }
            }

            // Handle dynamic deposits from financieDeposits
            if (formData.financieDeposits && Array.isArray(formData.financieDeposits)) {
                formData.financieDeposits.forEach(dep => {
                    const depAmount = parsePrice(dep.amount);
                    // Avoid double counting - only add if significantly different
                    if (depAmount > 0 && selectedOffers.length === 0) {
                        totalDeposits += depAmount;
                        monthlyData[monthKey].deposits += depAmount;
                    }
                });
            }

            // Add remaining balance (doplatok)
            const doplatok = parsePrice(formData.doplatok);
            if (doplatok > 0) {
                totalRemainingBalance += doplatok;
            }
        });

        // If remaining balance not explicitly stored, calculate it
        if (totalRemainingBalance === 0 && totalPrice > totalDeposits) {
            totalRemainingBalance = totalPrice - totalDeposits;
        }

        // Prepare monthly chart data (sorted by month)
        const sortedMonths = Object.keys(monthlyData).sort();
        const chartData = sortedMonths.map(key => ({
            month: key,
            ...monthlyData[key]
        }));

        return {
            totalPrice,
            totalDeposits,
            totalRemainingBalance,
            totalItems,
            totalOrders,
            filteredCount: filteredEntries.length,
            chartData,
            maxRevenue: Math.max(...chartData.map(d => d.revenue), 1)
        };
    }, [entries, dateRange]);

    // Format month key for display
    const formatMonthLabel = (monthKey: string): string => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        return `${MONTH_NAMES[monthIndex]} ${year.slice(2)}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className={`w-full max-w-6xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-dark-800' : 'bg-white'}`}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
                    <h2 className="text-xl font-bold text-white">Štatistiky tržieb</h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {/* Time Period Filter */}
                    <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-dark-700' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Obdobie:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'last12months', label: 'Posledných 12 mesiacov' },
                                    { value: 'thisYear', label: 'Tento rok' },
                                    { value: 'lastYear', label: 'Minulý rok' },
                                    { value: 'custom', label: 'Vlastné' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFilterType(option.value as FilterType)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                            filterType === option.value
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
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border ${
                                            isDark
                                                ? 'bg-dark-600 border-dark-500 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    />
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>–</span>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border ${
                                            isDark
                                                ? 'bg-dark-600 border-dark-500 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {/* Total Revenue */}
                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Celkové tržby</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.totalPrice.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Súčet všetkých objednávok
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Deposits */}
                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Zálohy</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.totalDeposits.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Prijaté zálohy od zákazníkov
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Remaining Balance */}
                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Doplatky</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.totalRemainingBalance.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Zostatok po zálohách
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100/10 rounded-full flex items-center justify-center border border-orange-500/20">
                                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Total Items */}
                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Počet položiek</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.totalItems.toLocaleString('sk-SK')}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Dvere, nábytok, schody, atď.
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100/10 rounded-full flex items-center justify-center border border-purple-500/20">
                                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Total Orders */}
                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Počet objednávok</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.totalOrders.toLocaleString('sk-SK')}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Uzavretých zákaziek
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-cyan-100/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                                    <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Closed Projects */}
                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uzavretých projektov</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.filteredCount.toLocaleString('sk-SK')}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        V zvolenom období
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-pink-100/10 rounded-full flex items-center justify-center border border-pink-500/20">
                                    <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Revenue Chart */}
                    <div
                        className={`rounded-lg p-6 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'} overflow-x-auto`}
                        style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                    >
                        <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Mesačné tržby
                        </h3>

                        {stats.chartData.length > 0 ? (
                            <div className="min-w-[600px]">
                                {/* Bar Chart */}
                                <div className="h-64 flex items-end justify-between gap-1">
                                    {stats.chartData.map((data, index) => {
                                        const heightPercent = stats.maxRevenue > 0
                                            ? (data.revenue / stats.maxRevenue) * 100
                                            : 0;
                                        const now = new Date();
                                        const [year, month] = data.month.split('-');
                                        const isCurrentMonth = now.getMonth() + 1 === parseInt(month, 10) &&
                                                               now.getFullYear() === parseInt(year, 10);

                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2 min-w-[40px]">
                                                <div className="relative w-full h-48 flex items-end justify-center group">
                                                    {/* Tooltip */}
                                                    <div className={`absolute bottom-full mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isDark ? 'bg-dark-500 text-white' : 'bg-gray-800 text-white'}`}>
                                                        <div className="font-semibold mb-1">{FULL_MONTH_NAMES[parseInt(month, 10) - 1]} {year}</div>
                                                        <div>Tržby: {data.revenue.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                                                        <div>Položky: {data.items}</div>
                                                    </div>
                                                    {/* Bar */}
                                                    <div
                                                        className={`w-full max-w-[35px] rounded-t transition-all duration-300 ${
                                                            isCurrentMonth
                                                                ? 'bg-[#e11b28]'
                                                                : isDark ? 'bg-emerald-600' : 'bg-emerald-400'
                                                        } ${data.revenue > 0 ? 'min-h-[4px]' : ''}`}
                                                        style={{ height: `${Math.max(heightPercent, data.revenue > 0 ? 2 : 0)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ${isCurrentMonth ? 'font-bold text-[#e11b28]' : ''}`}>
                                                    {formatMonthLabel(data.month)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-dark-600">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded ${isDark ? 'bg-emerald-600' : 'bg-emerald-400'}`}></div>
                                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tržby</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-[#e11b28]"></div>
                                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Aktuálny mesiac</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p>Žiadne dáta pre zvolené obdobie</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
