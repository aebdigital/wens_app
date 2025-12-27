import React, { useState, useEffect, useCallback } from 'react';
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

const Dovolenky: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [vacations, setVacations] = useState<VacationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Vacation Form State
  const [newVacation, setNewVacation] = useState({
    name: '',
    startDate: '',
    endDate: '',
    note: ''
  });

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
    </div>
  );
};

export default Dovolenky;
