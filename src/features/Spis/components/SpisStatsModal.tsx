import React, { useState, useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { SpisEntry } from '../types';

interface SpisStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: SpisEntry[];
}

// Month names in Slovak
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];

// Parse price string to number (handles formats like "1 234,56" or "1234.56")
const parsePrice = (priceStr: string | undefined): number => {
    if (!priceStr) return 0;
    // Remove spaces, replace comma with dot
    const cleaned = priceStr.replace(/\s/g, '').replace(',', '.');
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
    // Matches: 13. 1. 2026, 13.1.2026, 13/1/2026, 1.1.2026
    const parts = dateStr.match(/^(\d{1,2})[. /]+(\d{1,2})[. /]+(\d{4})/);
    if (parts) {
        // parts[1] is day, parts[2] is month, parts[3] is year
        const d = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
};

export const SpisStatsModal: React.FC<SpisStatsModalProps> = ({ isOpen, onClose, entries }) => {
    const { isDark } = useTheme();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Calculate revenue data from closed Spis entries
    const revenueData = useMemo(() => {
        // Check for 'Uzavreté' status (adjust logic if status string varies)
        const closedEntries = entries.filter(entry =>
            entry.stav === 'Uzavreté' ||
            entry.stav === 'Vybavené' ||
            entry.stav === 'Ukončené' ||
            entry.stav === 'Hotovo'
        );

        // Monthly revenue for selected year
        const monthlyRevenue = Array(12).fill(0);
        let totalRevenue = 0;
        let totalClosedProjects = 0;

        closedEntries.forEach(entry => {
            // Price is usually in fullFormData.cena
            const price = parsePrice(entry.fullFormData?.cena);

            // Only count entries with price > 0
            if (price > 0) {
                totalRevenue += price;
                totalClosedProjects++;

                // Determine which month this belongs to
                // Priority: 1. terminDokoncenia 2. datum (creation)
                const completionDateStr = entry.fullFormData?.terminDokoncenia;
                const creationDateStr = entry.datum;

                let date = parseDate(completionDateStr);
                if (!date) {
                    date = parseDate(creationDateStr);
                }

                if (date && date.getFullYear() === selectedYear) {
                    const month = date.getMonth();
                    monthlyRevenue[month] += price;
                }
            }
        });

        const maxMonthlyRevenue = Math.max(...monthlyRevenue, 1); // At least 1 to avoid division by zero

        return {
            monthlyRevenue,
            totalRevenue,
            totalClosedProjects,
            maxMonthlyRevenue,
            yearlyRevenue: monthlyRevenue.reduce((a, b) => a + b, 0)
        };
    }, [entries, selectedYear]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className={`w-full max-w-5xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-dark-800' : 'bg-white'}`}
            >
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
                    {/* Revenue Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Celkové tržby ({selectedYear})</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {revenueData.yearlyRevenue.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`rounded-lg p-4 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'}`}
                            style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uzavretých projektov (všetky)</p>
                                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{revenueData.totalClosedProjects}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100/10 rounded-full flex items-center justify-center border border-purple-500/20">
                                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Revenue Chart */}
                    <div
                        className={`rounded-lg p-6 mb-2 ${isDark ? 'bg-dark-700' : 'bg-white border border-gray-100'} overflow-x-auto`}
                        style={{ boxShadow: isDark ? 'inset 0 1px 2px #ffffff05' : '0 2px 4px #00000005, 0 1px 2px #00000010' }}
                    >
                        <div className="min-w-[700px] pb-4">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Mesačné tržby
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedYear(selectedYear - 1)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className={`text-lg font-semibold min-w-[60px] text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedYear}
                                    </span>
                                    <button
                                        onClick={() => setSelectedYear(selectedYear + 1)}
                                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Bar Chart */}
                            <div className="h-64 flex items-end justify-between gap-2">
                                {revenueData.monthlyRevenue.map((revenue, index) => {
                                    const heightPercent = revenueData.maxMonthlyRevenue > 0
                                        ? (revenue / revenueData.maxMonthlyRevenue) * 100
                                        : 0;
                                    const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === selectedYear;

                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="relative w-full h-48 flex items-end justify-center group">
                                                {/* Tooltip */}
                                                <div className={`absolute bottom-full mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isDark ? 'bg-dark-500 text-white' : 'bg-gray-800 text-white'}`}>
                                                    {FULL_MONTH_NAMES[index]}: {revenue.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                </div>
                                                {/* Bar */}
                                                <div
                                                    className={`w-full max-w-[40px] rounded-t transition-all duration-300 ${isCurrentMonth ? 'bg-[#e11b28]' : (isDark ? 'bg-emerald-600' : 'bg-emerald-400')} ${revenue > 0 ? 'min-h-[4px]' : ''}`}
                                                    style={{ height: `${Math.max(heightPercent, revenue > 0 ? 2 : 0)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ${isCurrentMonth ? 'font-bold text-[#e11b28]' : ''}`}>
                                                {MONTH_NAMES[index]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-gray-200 dark:border-dark-600">
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
                    </div>
                </div>
            </div>
        </div>
    );
};
