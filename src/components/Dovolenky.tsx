import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
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

  // Hardcoded employee list
  const users = [
    { id: '1', name: 'Andelová Kristína' },
    { id: '2', name: 'Andrejkovičová Andrea, Bc.' },
    { id: '3', name: 'Bartoš Daniel' },
    { id: '4', name: 'Belák Peter' },
    { id: '5', name: 'Belaňová Dália' },
    { id: '6', name: 'Bugár Ľuboš' },
    { id: '7', name: 'Butko Štefan' },
    { id: '8', name: 'Butková Patrícia' },
    { id: '9', name: 'Čertík Jaroslav' },
    { id: '10', name: 'Dražo Tibor' },
    { id: '11', name: 'Gatialová Marcela' },
    { id: '12', name: 'Glavo Zdenko' },
    { id: '13', name: 'Kyselicová Lucia' },
    { id: '14', name: 'Palatínus Boris' },
    { id: '15', name: 'Palkovič Marek, Ing.' },
    { id: '16', name: 'Púčik Jozef' },
    { id: '17', name: 'Repková Martina' },
    { id: '18', name: 'Richter Karol' },
    { id: '19', name: 'Richter Roman' },
    { id: '20', name: 'Rybárik Juraj' },
    { id: '21', name: 'Vasko Ľubomír' },
    { id: '22', name: 'Vida Ján' },
    { id: '23', name: 'Vrchovský Peter' },
  ];

  // Independent filters
  const [calendarSelectedUserId, setCalendarSelectedUserId] = useState<string | null>(null);
  const [tableSelectedUserId, setTableSelectedUserId] = useState<string | null>(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // New Vacation Form State
  const [newVacation, setNewVacation] = useState({
    userId: '', // ID of selected user
    name: '', // Display name (kept for compatibility or easier access)
    startDate: '',
    endDate: '',
    note: ''
  });


  // Update form name when user selected
  // When a user is selected in the "Add" form, update the name too
  useEffect(() => {
    if (newVacation.userId) {
      const u = users.find(user => user.id === newVacation.userId);
      if (u) {
        setNewVacation(prev => ({ ...prev, name: u.name }));
      }
    }
  }, [newVacation.userId, users]);

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
      toast.error('Prosím vyplňte meno a dátumy.');
      return;
    }

    if (!user) {
      toast.error('Musíte byť prihlásený.');
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
        toast.error('Nepodarilo sa pridať dovolenku.');
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
        setNewVacation({ userId: '', name: '', startDate: '', endDate: '', note: '' });
        toast.success('Dovolenka bola úspešne pridaná.');
      }
    } catch (error) {
      console.error('Failed to add vacation:', error);
      toast.error('Nepodarilo sa pridať dovolenku.');
    }
  };

  const handleDeleteVacation = async (id: string) => {
    if (!window.confirm('Naozaj chcete vymazať tento záznam?')) return;

    try {
      // First verify the vacation exists and belongs to current user
      const vacation = vacations.find(v => v.id === id);
      if (!vacation) {
        toast.error('Záznam nebol nájdený.');
        return;
      }

      // Check if current user is the creator
      if (user && vacation.createdBy !== user.id) {
        toast.error('Len tvorca záznamu môže vymazať dovolenku.');
        return;
      }

      const { error } = await supabase
        .from('dovolenky')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vacation:', error);
        toast.error('Nepodarilo sa vymazať dovolenku: ' + error.message);
        return;
      }

      setVacations(prev => prev.filter(v => v.id !== id));
      toast.success('Dovolenka bola vymazaná.');
    } catch (error) {
      console.error('Failed to delete vacation:', error);
      toast.error('Nepodarilo sa vymazať dovolenku.');
    }
  };

  const filteredVacations = useMemo(() => {
    if (!tableSelectedUserId) return vacations;
    const selectedUser = users.find(u => u.id === tableSelectedUserId);
    if (!selectedUser) return vacations;
    return vacations.filter(v => v.name === selectedUser.name);
  }, [tableSelectedUserId, users, vacations]);

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
    <div className={`h-full flex ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
      {/* Sidebar - Employee List */}


      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-8 mx-auto w-full">

            {/* 1. Add New Vacation Form (Top) */}
            <div className={`p-6 rounded-lg shadow-sm ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pridať dovolenku</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Zamestnanec</label>
                  <select
                    className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-[#e11b28]/20 focus:border-[#e11b28] transition-all appearance-none ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                    value={newVacation.userId}
                    onChange={(e) => setNewVacation({ ...newVacation, userId: e.target.value })}
                  >
                    <option value="">Vyberte zamestnanca...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Od</label>
                  <CustomDatePicker
                    value={newVacation.startDate}
                    onChange={(val) => setNewVacation({ ...newVacation, startDate: val })}
                    className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-[#e11b28]/20 focus:border-[#e11b28] transition-all ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Do</label>
                  <CustomDatePicker
                    value={newVacation.endDate}
                    onChange={(val) => setNewVacation({ ...newVacation, endDate: val })}
                    className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-[#e11b28]/20 focus:border-[#e11b28] transition-all ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'border-gray-200'}`}
                  />
                </div>
                <div>
                  <button
                    onClick={handleAddVacation}
                    className="w-full px-6 py-2.5 bg-[#e11b28] text-white rounded-lg hover:bg-[#c71325] transition-colors font-semibold shadow-sm hover:shadow text-sm"
                  >
                    Pridať záznam
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Poznámka</label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-[#e11b28]/20 focus:border-[#e11b28] transition-all ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'border-gray-200'}`}
                  value={newVacation.note}
                  onChange={(e) => setNewVacation({ ...newVacation, note: e.target.value })}
                  placeholder="Voliteľná poznámka..."
                />
              </div>
            </div>

            {/* 2. Calendar Section */}
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-4">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Kalendár {calendarSelectedUserId ? ` — ${users.find(u => u.id === calendarSelectedUserId)?.name}` : ''}
                </h2>
                <select
                  className={`w-full md:w-auto px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-[#e11b28]/20 focus:border-[#e11b28] transition-all appearance-none ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  value={calendarSelectedUserId || ''}
                  onChange={(e) => setCalendarSelectedUserId(e.target.value || null)}
                >
                  <option value="">Všetci zamestnanci</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className={`rounded-xl shadow-sm overflow-hidden border ${isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'}`}>
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
                    <h2 className="text-xl font-bold text-white tracking-wide">
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

                {/* Day Headers */}
                <div className={`grid grid-cols-7 gap-px border-b ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
                  {DAY_NAMES.map((day, index) => (
                    <div
                      key={day}
                      className={`text-center py-3 text-sm font-bold ${index >= 5
                        ? 'text-[#e11b28]'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className={`grid grid-cols-7 gap-px ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
                  {monthDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className={isDark ? 'bg-dark-800' : 'bg-white'} />;
                    }

                    const isToday = day.toDateString() === new Date().toDateString();
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    // Filter vacations for this day based on selection context
                    const relevantVacations = calendarSelectedUserId
                      ? vacations.filter(v => v.name === users.find(u => u.id === calendarSelectedUserId)?.name)
                      : vacations;

                    const dayVacations = relevantVacations.filter(v => isDateInVacation(day, v));

                    const handleDayClick = () => {
                      setSelectedDay({ date: day, vacations: dayVacations });
                    };

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={handleDayClick}
                        className={`min-h-[100px] p-2 transition-colors cursor-pointer relative group ${isDark ? 'bg-dark-800 hover:bg-dark-700' : 'bg-white hover:bg-gray-50'
                          } ${isToday ? 'ring-2 ring-inset ring-[#e11b28]' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday
                          ? 'text-[#e11b28]'
                          : isWeekend
                            ? isDark ? 'text-red-400' : 'text-red-500'
                            : isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                          {day.getDate()}
                        </div>

                        <div className="space-y-1">
                          {dayVacations.slice(0, 3).map((vac) => {
                            const color = stringToColor(vac.name);
                            return (
                              <div
                                key={vac.id}
                                style={{ backgroundColor: color.bg, color: color.text }}
                                className="text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium shadow-sm"
                                title={`${vac.name}${vac.note ? `: ${vac.note}` : ''}`}
                              >
                                {vac.name}
                              </div>
                            );
                          })}
                          {dayVacations.length > 3 && (
                            <div className={`text-[10px] font-medium pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              +{dayVacations.length - 3} ďalší
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Table Section */}
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-4">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Zoznam dovoleniek {tableSelectedUserId ? ` — ${users.find(u => u.id === tableSelectedUserId)?.name}` : ''}
                </h2>
                <select
                  className={`w-full md:w-auto px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-[#e11b28]/20 focus:border-[#e11b28] transition-all appearance-none ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  value={tableSelectedUserId || ''}
                  onChange={(e) => setTableSelectedUserId(e.target.value || null)}
                >
                  <option value="">Všetci zamestnanci</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className={`rounded-lg overflow-hidden shadow-sm border ${isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#e11b28] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Meno</th>
                        <th className="px-6 py-4 text-left font-semibold">Termín</th>
                        <th className="px-6 py-4 text-left font-semibold">Dĺžka</th>
                        <th className="px-6 py-4 text-left font-semibold">Poznámka</th>
                        <th className="px-6 py-4 text-right font-semibold">Akcie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-600">
                      {filteredVacations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={`px-6 py-12 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Žiadne naplánované dovolenky.
                          </td>
                        </tr>
                      ) : (
                        filteredVacations.map((vac) => {
                          const color = stringToColor(vac.name);
                          const daysCount = Math.ceil((new Date(vac.endDate).getTime() - new Date(vac.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

                          return (
                            <tr key={vac.id} className={`transition-colors ${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'}`}>
                              <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm" style={{ backgroundColor: color.bg, color: color.text }}>
                                    {vac.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  {vac.name}
                                </div>
                              </td>
                              <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{new Date(vac.startDate).toLocaleDateString('sk-SK')}</span>
                                  <span className="text-xs opacity-70">až {new Date(vac.endDate).toLocaleDateString('sk-SK')}</span>
                                </div>
                              </td>
                              <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-dark-600' : 'bg-gray-100'}`}>
                                  {daysCount} {daysCount === 1 ? 'deň' : (daysCount >= 2 && daysCount <= 4 ? 'dni' : 'dní')}
                                </span>
                              </td>
                              <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{vac.note || '-'}</td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteVacation(vac.id)}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Zmazať"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
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
