import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSpis } from '../contexts/SpisContext';
import { supabase, DbUser } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastSeen: string | null;
  createdAt: string;
}

interface Dovolenka {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'dovolenka' | 'sick' | 'other';
  note: string;
  approved: boolean;
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

// Check if user is online (seen within last 2 minutes)
const isUserOnline = (lastSeen: string | null): boolean => {
  if (!lastSeen) return false;
  const lastSeenTime = new Date(lastSeen).getTime();
  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000;
  return (now - lastSeenTime) < twoMinutes;
};

// Format last seen time
const formatLastSeen = (lastSeen: string | null): string => {
  if (!lastSeen) return 'Nikdy';

  const lastSeenTime = new Date(lastSeen).getTime();
  const now = Date.now();
  const diffMs = now - lastSeenTime;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Práve teraz';
  if (minutes < 60) return `pred ${minutes} min`;
  if (hours < 24) return `pred ${hours} hod`;
  if (days === 1) return 'Včera';
  return `pred ${days} dňami`;
};

const Zamestnanci: React.FC = () => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const { entries: spisEntries } = useSpis();
  const [users, setUsers] = useState<User[]>([]);
  const [dovolenky, setDovolenky] = useState<Dovolenka[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate revenue data from closed Spis entries
  const revenueData = useMemo(() => {
    const closedEntries = spisEntries.filter(entry => entry.stav === 'Uzavreté');

    // Monthly revenue for selected year
    const monthlyRevenue = Array(12).fill(0);
    let totalRevenue = 0;
    let totalClosedProjects = 0;

    closedEntries.forEach(entry => {
      const price = parsePrice(entry.fullFormData?.cena);
      if (price > 0) {
        totalRevenue += price;
        totalClosedProjects++;

        // Determine which month this belongs to
        // Use terminDokoncenia (completion date) if available, otherwise use datum
        const dateStr = entry.fullFormData?.terminDokoncenia || entry.datum;
        if (dateStr) {
          const date = new Date(dateStr);
          if (date.getFullYear() === selectedYear && !isNaN(date.getTime())) {
            const month = date.getMonth();
            monthlyRevenue[month] += price;
          }
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
  }, [spisEntries, selectedYear]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      const timer = setTimeout(() => {
        loadData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Update current user's last_seen periodically
  useEffect(() => {
    if (!currentUser) return;

    const updateLastSeen = async () => {
      try {
        await supabase
          .from('users')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', currentUser.id);
      } catch (error) {
        console.error('Failed to update last_seen:', error);
      }
    };

    // Update immediately on mount
    updateLastSeen();

    // Update every minute
    const interval = setInterval(updateLastSeen, 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('email');

      if (usersError) {
        console.error('Error loading users:', usersError);
      } else {
        setUsers((usersData || []).map((u: DbUser) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          lastSeen: u.last_seen,
          createdAt: u.created_at,
        })));
      }

      // Load dovolenky (if table exists)
      try {
        const { data: dovolenkyData, error: dovolenkyError } = await supabase
          .from('dovolenky')
          .select('*')
          .order('start_date', { ascending: false });

        if (!dovolenkyError && dovolenkyData) {
          setDovolenky(dovolenkyData.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            startDate: d.start_date,
            endDate: d.end_date,
            type: d.type || 'dovolenka',
            note: d.note || '',
            approved: d.approved || false,
          })));
        }
      } catch {
        // Table might not exist yet
        setDovolenky([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    if (user) {
      if (user.firstName || user.lastName) {
        return `${user.firstName} ${user.lastName}`.trim();
      }
      return user.email;
    }
    return 'Neznámy';
  };

  if (isLoading) {
    return (
      <div className={`h-full p-4 flex items-center justify-center ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28]"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full p-4 ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Zamestnanci</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
          style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Celkom používateľov</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
          style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Na dovolenke</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {dovolenky.filter(d => {
                  const now = new Date();
                  const start = new Date(d.startDate);
                  const end = new Date(d.endDate);
                  return now >= start && now <= end && d.approved;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
          style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plánovaná dovolenka</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {dovolenky.filter(d => {
                  const now = new Date();
                  const start = new Date(d.startDate);
                  return start > now;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div
        className={`rounded-lg overflow-x-auto mb-6 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
        style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-white">Meno</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Online</th>
              <th className="px-4 py-3 text-left font-semibold text-white">Registrovaný</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={`border-t ${isDark ? 'border-dark-500 hover:bg-dark-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#e11b28] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        {(user.lastName?.[0] || '').toUpperCase()}
                      </span>
                    </div>
                    {user.firstName || user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.email.split('@')[0]
                    }
                  </div>
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</td>
                <td className={`px-4 py-3`}>
                  {isUserOnline(user.lastSeen) ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-green-500 font-medium">Online</span>
                    </div>
                  ) : (
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      {formatLastSeen(user.lastSeen)}
                    </span>
                  )}
                </td>
                <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {new Date(user.createdAt).toLocaleDateString('sk-SK')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue Section */}
      <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Tržby z uzavretých projektov</h2>

      {/* Revenue Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
          style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Celkové tržby ({selectedYear})</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {revenueData.yearlyRevenue.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
          style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uzavretých projektov (celkovo)</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{revenueData.totalClosedProjects}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg p-4 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
          style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Celkové tržby (všetky roky)</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {revenueData.totalRevenue.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
            </div>
            <div className="w-12 h-12 bg-[#e11b28]/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#e11b28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div
        className={`rounded-lg p-6 mb-6 ${isDark ? 'bg-dark-800' : 'bg-white'}`}
        style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Mesačné tržby
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
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
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
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
                  <div className={`absolute bottom-full mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isDark ? 'bg-dark-600 text-white' : 'bg-gray-800 text-white'}`}>
                    {FULL_MONTH_NAMES[index]}: {revenue.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </div>
                  {/* Bar */}
                  <div
                    className={`w-full max-w-[40px] rounded-t transition-all duration-300 ${isCurrentMonth ? 'bg-[#e11b28]' : (isDark ? 'bg-emerald-500' : 'bg-emerald-400')} ${revenue > 0 ? 'min-h-[4px]' : ''}`}
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
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-dark-500">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}`}></div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tržby</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#e11b28]"></div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Aktuálny mesiac</span>
          </div>
        </div>
      </div>

      {/* Dovolenky Table */}
      {dovolenky.length > 0 && (
        <>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Dovolenky</h2>
          <div
            className={`rounded-lg overflow-x-auto ${isDark ? 'bg-dark-800' : 'bg-white'}`}
            style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
          >
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-white">Zamestnanec</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Od</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Do</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Typ</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Poznámka</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Stav</th>
                </tr>
              </thead>
              <tbody>
                {dovolenky.map((dovolenka) => (
                  <tr
                    key={dovolenka.id}
                    className={`border-t ${isDark ? 'border-dark-500 hover:bg-dark-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getUserName(dovolenka.userId)}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(dovolenka.startDate).toLocaleDateString('sk-SK')}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(dovolenka.endDate).toLocaleDateString('sk-SK')}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {dovolenka.type === 'dovolenka' ? 'Dovolenka' : dovolenka.type === 'sick' ? 'PN' : 'Iné'}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {dovolenka.note || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${dovolenka.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {dovolenka.approved ? 'Schválené' : 'Čaká'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Zamestnanci;
