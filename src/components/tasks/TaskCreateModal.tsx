import React, { useState, useEffect } from 'react';
import { useTasks } from '../../contexts/TasksContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'vseobecna' | 'specificka';
  initialSpisId?: string;
  initialSpisCislo?: string; // e.g. CP2025/0001
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  initialType = 'vseobecna',
  initialSpisId,
  initialSpisCislo
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { addTask, getAllUsers } = useTasks();

  const [type, setType] = useState<'vseobecna' | 'specificka'>(initialType);
  const [recipientId, setRecipientId] = useState<string>('');
  const [text, setText] = useState('');
  const [selectedSpisId, setSelectedSpisId] = useState<string>(initialSpisId || '');
  
  const [users, setUsers] = useState<any[]>([]);
  const [spisList, setSpisList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setUsers(getAllUsers());
      // Load spis list for dropdown
      const storageKey = user ? `spisEntries_${user.id}` : 'spisEntries';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSpisList(JSON.parse(saved));
      }
      
      // Reset form if opening fresh (optional, or rely on props)
      if (initialSpisId) {
          setSelectedSpisId(initialSpisId);
          setType('specificka'); // Force specific if ID provided
      } else {
          setType(initialType);
      }
    }
  }, [isOpen, user, getAllUsers, initialSpisId, initialType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !text) return;
    if (type === 'specificka' && !selectedSpisId) return;

    const recipient = users.find(u => u.id === recipientId);
    if (!recipient) return;
    
    // Find spis cislo for display if specific
    let spisCislo = '';
    if (type === 'specificka') {
        const s = spisList.find(item => item.id === selectedSpisId);
        if (s) spisCislo = s.cisloCP;
    }

    addTask({
      type,
      to: {
        id: recipient.id,
        name: `${recipient.firstName} ${recipient.lastName}`
      },
      text,
      spisId: type === 'specificka' ? selectedSpisId : undefined,
      spisCislo: type === 'specificka' ? spisCislo : undefined
    });
    
    // Reset and close
    setText('');
    setRecipientId('');
    setSelectedSpisId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'bg-dark-800' : 'bg-white'} shadow-2xl`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Nová úloha</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                checked={type === 'vseobecna'}
                onChange={() => setType('vseobecna')}
                className="mr-2"
                disabled={!!initialSpisId} // Lock if opened from Spis
              />
              <span className={isDark ? 'text-white' : 'text-gray-700'}>Všeobecná</span>
            </label>
            {/* Only show "Špecifická" option if initialSpisId is provided (from Spis) */}
            {!!initialSpisId && (
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'specificka'}
                  onChange={() => setType('specificka')}
                  className="mr-2"
                  disabled={!!initialSpisId} // Lock if opened from Spis
                />
                <span className={isDark ? 'text-white' : 'text-gray-700'}>Špecifická</span>
              </label>
            )}
          </div>

          {/* Recipient */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pre koho:</label>
            <select 
              value={recipientId} 
              onChange={(e) => setRecipientId(e.target.value)}
              className={`w-full p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              required
            >
              <option value="">Vyberte používateľa</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.email} {u.id === user?.id ? '(Ja)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Project Selection (if specific) */}
          {type === 'specificka' && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Projekt:</label>
              {initialSpisId ? (
                  <div className={`p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`}>
                      {initialSpisCislo || 'Vybraný projekt'}
                  </div>
              ) : (
                <select 
                  value={selectedSpisId} 
                  onChange={(e) => setSelectedSpisId(e.target.value)}
                  className={`w-full p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                >
                  <option value="">Vyberte projekt</option>
                  {[...spisList].reverse().map(s => (
                    <option key={s.id} value={s.id}>
                      {s.cisloCP} - {s.kontaktnaOsoba}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Text */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Text úlohy:</label>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              className={`w-full p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded font-medium ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Zrušiť
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#e11b28] text-white rounded font-medium hover:bg-[#c71325]"
            >
              Vytvoriť úlohu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
