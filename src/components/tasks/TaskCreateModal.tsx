import React, { useState, useEffect } from 'react';
import { useTasks } from '../../contexts/TasksContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  spisId?: string | null;
  spisCislo?: string | null;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  spisId,
  spisCislo
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { addTask, getAllUsers } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setUsers(getAllUsers());
      // Reset form
      setTitle('');
      setDescription('');
      setAssignedTo('');
    }
  }, [isOpen, getAllUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo) return;

    await addTask({
      title,
      description,
      status: 'pending',
      priority: 'normal',
      assignedTo,
      assignedToName: users.find(u => u.id === assignedTo)?.firstName + ' ' + users.find(u => u.id === assignedTo)?.lastName,
      dueDate: null,
      spisId: spisId || null,
      spisCislo: spisCislo || null,
      startedAt: null,
      completedAt: null
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setAssignedTo('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'bg-dark-800' : 'bg-white'} shadow-2xl`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Nová úloha</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Názov úlohy:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Zadajte názov úlohy"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Popis:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              rows={3}
              placeholder="Voliteľný popis úlohy"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Prideliť komu:</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={`w-full p-2 rounded border ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              required
            >
              <option value="">Vyberte používateľa</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} {u.id === user?.id ? '(Ja)' : ''}
                </option>
              ))}
            </select>
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
