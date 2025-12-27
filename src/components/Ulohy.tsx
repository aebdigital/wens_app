import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTasks, Task } from '../contexts/TasksContext';
import { TaskCreateModal } from './tasks/TaskCreateModal';
import { useNavigate } from 'react-router-dom';

const Ulohy = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { tasks, markAsRead, deleteTask } = useTasks();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'dorucene' | 'odoslane'>('dorucene'); // Changed initial filter

  const displayedTasks = tasks.filter(t => {
      if (!user) return false; // No user, no tasks

      if (filter === 'dorucene') {
          return t.to.id === user.id;
      } else { // filter === 'odoslane'
          return t.from.id === user.id;
      }
  });

  const handleTaskClick = (task: Task) => {
    // Mark as read only if it's a received task
    if (filter === 'dorucene' && !task.read) {
        markAsRead(task.id);
    }
  };

  const handleOpenProject = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      if (task.spisId) {
          navigate('/spis', { state: { openSpisId: task.spisId, highlightProjectIds: [task.spisCislo] } });
      }
  };

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Úlohy</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nová úloha
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('dorucene')}
          className={`px-4 py-2 rounded-lg font-medium ${filter === 'dorucene' ? 'bg-blue-100 text-blue-800' : (isDark ? 'text-gray-300 hover:bg-dark-800' : 'text-gray-600 hover:bg-gray-100')}`}
        >
          Doručené
        </button>
        <button
          onClick={() => setFilter('odoslane')}
          className={`px-4 py-2 rounded-lg font-medium ${filter === 'odoslane' ? 'bg-blue-100 text-blue-800' : (isDark ? 'text-gray-300 hover:bg-dark-800' : 'text-gray-600 hover:bg-gray-100')}`}
        >
          Odoslané
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {displayedTasks.length === 0 ? (
            <div className={`text-center py-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Žiadne úlohy
            </div>
        ) : (
            displayedTasks.map(task => (
                <div 
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        task.read && filter === 'dorucene' // Only dim if read AND in received folder
                            ? (isDark ? 'bg-dark-800 border-dark-500 text-gray-400' : 'bg-white border-gray-200 text-gray-600')
                            : (isDark ? 'bg-dark-700 border-blue-500 text-white shadow-md' : 'bg-blue-50 border-blue-200 text-gray-900 shadow-sm')
                    } hover:shadow-md`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {filter === 'dorucene' ? `Od: ${task.from.name}` : `Komu: ${task.to.name}`}
                            </span>
                            {filter === 'dorucene' && !task.read && ( // Only show unread indicator for received
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            )}
                            {task.type === 'specificka' && (
                                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                    Špecifická
                                </span>
                            )}
                        </div>
                        <span className="text-xs opacity-70">
                            {new Date(task.createdAt).toLocaleString('sk-SK')}
                        </span>
                    </div>
                    
                    <p className="mb-4 whitespace-pre-wrap break-words">{task.text}</p>
                    
                    <div className="flex justify-between items-center">
                         <div className="flex gap-2">
                            {task.type === 'specificka' && task.spisCislo && (
                                <button
                                    onClick={(e) => handleOpenProject(e, task)}
                                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                >
                                    Projekt: {task.spisCislo}
                                </button>
                            )}
                         </div>
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('Naozaj vymazať úlohu?')) deleteTask(task.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                         >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                         </button>
                    </div>
                </div>
            ))
        )}
      </div>

      <TaskCreateModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
};

export default Ulohy;