import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTasks, Task } from '../contexts/TasksContext';
import { TaskCreateModal } from './tasks/TaskCreateModal';

const Ulohy = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { tasks, updateTask, deleteTask } = useTasks();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'assigned' | 'created'>('assigned');

  // Count tasks for each filter
  const assignedCount = user ? tasks.filter(t => t.assignedTo === user.id).length : 0;
  const createdCount = user ? tasks.filter(t => t.createdBy === user.id).length : 0;

  const displayedTasks = tasks.filter(t => {
    if (!user) return false;
    if (filter === 'assigned') {
      return t.assignedTo === user.id;
    } else {
      return t.createdBy === user.id;
    }
  });

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-700';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'Čaká';
      case 'in_progress': return 'Prebieha';
      case 'completed': return 'Dokončené';
      default: return status;
    }
  };

  // Format elapsed time since a given date
  const formatElapsedTime = (dateStr: string | null): string => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'práve teraz';
    if (minutes < 60) return `pred ${minutes} min`;
    if (hours < 24) return `pred ${hours} hod`;
    if (days === 1) return 'včera';
    return `pred ${days} dňami`;
  };

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    updateTask(task.id, { status: newStatus });
  };

  const handleNavigateToProject = (spisId: string) => {
    navigate('/spis', { state: { highlightProjectIds: [spisId] } });
  };

  return (
    <div className={`min-h-full p-4 ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Úlohy</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-[#e11b28] text-white rounded-lg hover:bg-[#c71325] transition-all font-semibold shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nová úloha
        </button>
      </div>

      {/* Filters */}
      <div className={`flex gap-2 p-1 rounded-lg self-start ${isDark ? 'bg-dark-800' : 'bg-gray-200'} mb-6`}>
        <button
          onClick={() => setFilter('assigned')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            filter === 'assigned'
              ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow'
              : isDark
              ? 'text-gray-300 hover:text-white hover:bg-dark-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
          }`}
        >
          Doručené
          <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'assigned' ? 'bg-[#e11b28] text-white' : (isDark ? 'bg-dark-600 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
            {assignedCount}
          </span>
        </button>
        <button
          onClick={() => setFilter('created')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            filter === 'created'
              ? 'bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white shadow'
              : isDark
              ? 'text-gray-300 hover:text-white hover:bg-dark-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
          }`}
        >
          Odoslané
          <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'created' ? 'bg-[#e11b28] text-white' : (isDark ? 'bg-dark-600 text-gray-300' : 'bg-gray-200 text-gray-600')}`}>
            {createdCount}
          </span>
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
              className={`p-4 rounded-lg border transition-all ${
                task.status === 'completed'
                  ? (isDark ? 'bg-dark-800 border-dark-500 opacity-60' : 'bg-gray-50 border-gray-200 opacity-70')
                  : (isDark ? 'bg-dark-700 border-[#e11b28]/30' : 'bg-white border-[#e11b28]/20 shadow-sm')
              } hover:shadow-md`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded text-white ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(task.createdAt).toLocaleString('sk-SK')}
                </span>
              </div>

              {task.description && (
                <p className={`mb-3 whitespace-pre-wrap break-words ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {task.description}
                </p>
              )}

              <div className={`text-sm mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {filter === 'assigned' ? (
                  <span>Od: {task.createdByName}</span>
                ) : (
                  <span>Pre: {task.assignedToName}</span>
                )}
                {task.spisId && task.spisCislo && (
                  <button
                    onClick={() => handleNavigateToProject(task.spisId!)}
                    className="flex items-center gap-1 text-[#e11b28] hover:text-[#c71325] hover:underline transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Projekt: {task.spisCislo}
                  </button>
                )}
                {/* Show started/completed timestamps */}
                {task.status === 'in_progress' && task.startedAt && (
                  <span className="flex items-center gap-1 text-blue-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Začaté {formatElapsedTime(task.startedAt)}
                  </span>
                )}
                {task.status === 'completed' && task.completedAt && (
                  <span className="flex items-center gap-1 text-green-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Dokončené {formatElapsedTime(task.completedAt)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {filter === 'assigned' && task.status !== 'completed' && (
                    <>
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(task, 'in_progress')}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          Začať
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(task, 'completed')}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Dokončiť
                        </button>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Naozaj vymazať úlohu?')) deleteTask(task.id);
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
