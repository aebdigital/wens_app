import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { CustomDatePicker } from './common/CustomDatePicker';
import { supabase, DbDovolenka } from '../lib/supabase';

// Types
interface VacationEntry {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

// Slovak day names
const DAY_NAMES = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
const MONTH_NAMES = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];

// Convert HSL to RGB
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
};

// Calculate relative luminance for contrast calculation
const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Generate a consistent color from a string (name) using hash
const stringToColor = (str: string): { bg: string; text: string } => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate hue from hash (0-360)
  const hue = Math.abs(hash % 360);
  // Fixed saturation and lightness for good visibility
  const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
  const lightness = 45 + (Math.abs(hash >> 16) % 10); // 45-55%

  // Calculate actual luminance to determine text color
  const rgb = hslToRgb(hue, saturation, lightness);
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

  // Use white text for dark backgrounds, black for light backgrounds
  // Threshold of 0.179 is based on WCAG contrast ratio guidelines
  const textColor = luminance > 0.179 ? '#000000' : '#ffffff';

  return {
    bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: textColor
  };
};

// Check if a date is within a vacation period
const isDateInVacation = (date: Date, vacation: VacationEntry): boolean => {
  const start = new Date(vacation.startDate);
  const end = new Date(vacation.endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const checkDate = new Date(date);
  checkDate.setHours(12, 0, 0, 0);
  return checkDate >= start && checkDate <= end;
};

// Get all days in a month with proper padding for week alignment
const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  // We want Monday = 0, so adjust
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  // Add empty slots for days before the first of the month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Add empty slots to complete the last week
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

// Day detail popup component
interface DayDetailPopupProps {
  date: Date;
  vacations: VacationEntry[];
  onClose: () => void;
  isDark: boolean;
}

const DayDetailPopup: React.FC<DayDetailPopupProps> = ({ date, vacations, onClose, isDark }) => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const dayName = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'][date.getDay()];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-lg shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {date.getDate()}. {MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
            </h3>
            <p className={`text-sm ${isWeekend ? 'text-red-200' : 'text-white/80'}`}>
              {dayName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {vacations.length === 0 ? (
            <p className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Žiadne dovolenky v tento deň
            </p>
          ) : (
            <div className="space-y-3">
              {vacations.map((vac) => {
                const color = stringToColor(vac.name);
                return (
                  <div
                    key={vac.id}
                    className={`rounded-lg p-3 border ${isDark ? 'border-dark-600' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Color indicator */}
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: color.bg }}
                      />
                      <div className="flex-1 min-w-0">
                        {/* Name */}
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {vac.name}
                        </h4>
                        {/* Date range */}
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(vac.startDate).toLocaleDateString('sk-SK')} – {new Date(vac.endDate).toLocaleDateString('sk-SK')}
                        </p>
                        {/* Note if exists */}
                        {vac.note && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {vac.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#e11b28] text-white rounded-md hover:bg-[#c71325] transition-colors font-medium text-sm"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
};

const Dovolenky: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [vacations, setVacations] = useState<VacationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Day detail popup state
  const [selectedDay, setSelectedDay] = useState<{ date: Date; vacations: VacationEntry[] } | null>(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // New Vacation Form State
  const [newVacation, setNewVacation] = useState({
    name: '',
    startDate: '',
    endDate: '',
    note: ''
  });

  // Get days for current month
  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Load vacations from Supabase
  const loadVacations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('dovolenky')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error loading vacations:', error);
        return;
      }

      if (data) {
        setVacations(data.map((d: DbDovolenka) => ({
          id: d.id,
          name: d.name,
          startDate: d.start_date,
          endDate: d.end_date,
          note: d.note || undefined,
          createdBy: d.created_by,
          createdAt: d.created_at
        })));
      }
    } catch (error) {
      console.error('Failed to load vacations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadVacations();
  }, [loadVacations]);

  const handleAddVacation = async () => {
    if (!newVacation.name || !newVacation.startDate || !newVacation.endDate) {
      alert('Prosím vyplňte meno a dátumy.');
      return;
    }

    if (!user) {
      alert('Musíte byť prihlásený.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dovolenky')
        .insert({
          name: newVacation.name,
          start_date: newVacation.startDate,
          end_date: newVacation.endDate,
          note: newVacation.note || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding vacation:', error);
        alert('Nepodarilo sa pridať dovolenku.');
        return;
      }

      if (data) {
        const newEntry: VacationEntry = {
          id: data.id,
          name: data.name,
          startDate: data.start_date,
          endDate: data.end_date,
          note: data.note || undefined,
          createdBy: data.created_by,
          createdAt: data.created_at
        };
        setVacations(prev => [newEntry, ...prev]);
        setNewVacation({ name: '', startDate: '', endDate: '', note: '' });
      }
    } catch (error) {
      console.error('Failed to add vacation:', error);
      alert('Nepodarilo sa pridať dovolenku.');
    }
  };

  const handleDeleteVacation = async (id: string) => {
    if (!window.confirm('Naozaj chcete vymazať tento záznam?')) return;

    try {
      // First verify the vacation exists and belongs to current user
      const vacation = vacations.find(v => v.id === id);
      if (!vacation) {
        alert('Záznam nebol nájdený.');
        return;
      }

      // Check if current user is the creator
      if (user && vacation.createdBy !== user.id) {
        alert('Len tvorca záznamu môže vymazať dovolenku.');
        return;
      }

      const { error } = await supabase
        .from('dovolenky')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vacation:', error);
        alert('Nepodarilo sa vymazať dovolenku: ' + error.message);
        return;
      }

      setVacations(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      console.error('Failed to delete vacation:', error);
      alert('Nepodarilo sa vymazať dovolenku.');
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-full p-4 flex items-center justify-center ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28]"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Dovolenky</h1>
      </div>

      <div className="space-y-6">

            {/* Add New Vacation Form */}
            <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pridať dovolenku</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Meno</label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 text-sm border rounded-md ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'border-gray-300'}`}
                            value={newVacation.name}
                            onChange={(e) => setNewVacation({...newVacation, name: e.target.value})}
                            placeholder="Meno zamestnanca"
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Od</label>
                        <CustomDatePicker
                            value={newVacation.startDate}
                            onChange={(val) => setNewVacation({...newVacation, startDate: val})}
                            className={`w-full px-3 py-2 text-sm border rounded-md ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Do</label>
                        <CustomDatePicker
                            value={newVacation.endDate}
                            onChange={(val) => setNewVacation({...newVacation, endDate: val})}
                            className={`w-full px-3 py-2 text-sm border rounded-md ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'border-gray-300'}`}
                        />
                    </div>
                     <div>
                        <button
                            onClick={handleAddVacation}
                            className="w-full px-4 py-2 bg-[#e11b28] text-white rounded-md hover:bg-[#c71325] transition-colors font-medium text-sm"
                        >
                            Pridať
                        </button>
                    </div>
                </div>
                 <div className="mt-3">
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Poznámka</label>
                    <input
                        type="text"
                        className={`w-full px-3 py-2 text-sm border rounded-md ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'border-gray-300'}`}
                        value={newVacation.note}
                        onChange={(e) => setNewVacation({...newVacation, note: e.target.value})}
                        placeholder="Voliteľná poznámka..."
                    />
                </div>
            </div>

            {/* Calendar View */}
            <div className={`rounded-lg shadow-sm overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
              {/* Calendar Header - Red with white text */}
              <div className="bg-gradient-to-br from-[#e11b28] to-[#b8141f] px-6 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-xl font-semibold text-white">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day Headers - Black and bold */}
              <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-2">
                {DAY_NAMES.map((day, index) => (
                  <div
                    key={day}
                    className={`text-center py-2 text-sm font-bold ${
                      index >= 5
                        ? isDark ? 'text-red-400' : 'text-red-600'
                        : isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 p-4">
                {monthDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="min-h-[80px]" />;
                  }

                  const isToday = day.toDateString() === new Date().toDateString();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  // Find vacations for this day
                  const dayVacations = vacations.filter(v => isDateInVacation(day, v));

                  // Handle day click
                  const handleDayClick = () => {
                    setSelectedDay({ date: day, vacations: dayVacations });
                  };

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={handleDayClick}
                      className={`min-h-[80px] p-1 rounded-lg border transition-colors cursor-pointer ${
                        isToday
                          ? 'border-[#e11b28] border-2'
                          : isDark
                            ? 'border-dark-600 hover:border-dark-500'
                            : 'border-gray-200 hover:border-gray-300'
                      } ${isDark ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      {/* Day Number */}
                      <div className={`text-xs font-medium mb-1 ${
                        isToday
                          ? 'text-[#e11b28]'
                          : isWeekend
                            ? isDark ? 'text-red-400' : 'text-red-500'
                            : isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {day.getDate()}
                      </div>

                      {/* Vacation Bars */}
                      <div className="space-y-0.5">
                        {dayVacations.slice(0, 3).map((vac) => {
                          const color = stringToColor(vac.name);
                          return (
                            <div
                              key={vac.id}
                              style={{ backgroundColor: color.bg, color: color.text }}
                              className="text-[9px] px-1 py-0.5 rounded truncate"
                              title={`${vac.name}${vac.note ? `: ${vac.note}` : ''}`}
                            >
                              {vac.name}
                            </div>
                          );
                        })}
                        {dayVacations.length > 3 && (
                          <div className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            +{dayVacations.length - 3} ďalší
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vacations Table */}
            <div className={`rounded-lg overflow-hidden shadow-sm ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-white">Meno</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Od</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Do</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Poznámka</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Dátum pridania</th>
                            <th className="px-4 py-3 text-right font-semibold text-white">Akcie</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacations.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    Žiadne naplánované dovolenky.
                                </td>
                            </tr>
                        ) : (
                            vacations.map((vac) => (
                                <tr key={vac.id} className={`border-b ${isDark ? 'border-dark-500 hover:bg-dark-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{vac.name}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{new Date(vac.startDate).toLocaleDateString('sk-SK')}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{new Date(vac.endDate).toLocaleDateString('sk-SK')}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{vac.note || '-'}</td>
                                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{new Date(vac.createdAt).toLocaleDateString('sk-SK')}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteVacation(vac.id)}
                                            className="text-red-600 hover:text-red-900 font-medium text-xs hover:underline"
                                        >
                                            Zmazať
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>

      {/* Day Detail Popup */}
      {selectedDay && (
        <DayDetailPopup
          date={selectedDay.date}
          vacations={selectedDay.vacations}
          onClose={() => setSelectedDay(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
};

export default Dovolenky;
