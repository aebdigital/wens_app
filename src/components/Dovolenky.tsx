import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { CustomDatePicker } from './common/CustomDatePicker';

// Types
interface VacationEntry {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  note?: string;
  createdBy: string; // user.id
}

const Dovolenky: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  // --- Dovolenky State ---
  const [vacations, setVacations] = useState<VacationEntry[]>(() => {
    try {
      const saved = localStorage.getItem('dovolenkyData');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load vacations', e);
      return [];
    }
  });

  // Load/Save Vacations
  useEffect(() => {
    localStorage.setItem('dovolenkyData', JSON.stringify(vacations));
  }, [vacations]);

  // New Vacation Form State
  const [newVacation, setNewVacation] = useState({
    name: '',
    startDate: '',
    endDate: '',
    note: ''
  });

  const handleAddVacation = () => {
    if (!newVacation.name || !newVacation.startDate || !newVacation.endDate) {
      alert('Prosím vyplňte meno a dátumy.');
      return;
    }

    const entry: VacationEntry = {
      id: Date.now().toString(),
      name: newVacation.name,
      startDate: newVacation.startDate,
      endDate: newVacation.endDate,
      note: newVacation.note,
      createdBy: user?.id || 'unknown'
    };

    setVacations(prev => [...prev, entry]);
    setNewVacation({ name: '', startDate: '', endDate: '', note: '' });
  };

  const handleDeleteVacation = (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento záznam?')) {
      setVacations(prev => prev.filter(v => v.id !== id));
    }
  };

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
                    <thead className={`text-xs uppercase ${isDark ? 'bg-dark-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        <tr>
                            <th className="px-6 py-3">Meno</th>
                            <th className="px-6 py-3">Od</th>
                            <th className="px-6 py-3">Do</th>
                            <th className="px-6 py-3">Poznámka</th>
                            <th className="px-6 py-3 text-right">Akcie</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacations.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
