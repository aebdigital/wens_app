import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, DbUser } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high';
  createdBy: string;
  assignedTo: string;
  dueDate: string | null;
  createdAt: string;
}

const Zamestnanci: React.FC = () => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'tasks'>('users');

  // Task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('Zamestnanci useEffect - currentUser:', currentUser?.id);
    // Load data when we have an authenticated user
    if (currentUser) {
      loadData();
    } else {
      // Still try to load after a short delay in case auth is still initializing
      const timer = setTimeout(() => {
        console.log('Attempting delayed load...');
        loadData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Debug: Check current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.id);

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('email');

      console.log('Users loaded:', usersData, 'Error:', usersError);

      if (usersError) {
        console.error('Error loading users:', usersError);
      } else {
        setUsers((usersData || []).map((u: DbUser) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          createdAt: u.created_at,
        })));
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
      } else {
        setTasks((tasksData || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          createdBy: t.created_by,
          assignedTo: t.assigned_to,
          dueDate: t.due_date,
          createdAt: t.created_at,
        })));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !taskForm.title || !taskForm.assignedTo) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: taskForm.title,
          description: taskForm.description,
          assigned_to: taskForm.assignedTo,
          created_by: currentUser.id,
          priority: taskForm.priority,
          due_date: taskForm.dueDate || null,
        });

      if (error) {
        console.error('Error creating task:', error);
        alert('Chyba pri vytváraní úlohy');
      } else {
        setShowTaskModal(false);
        setTaskForm({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'normal',
          dueDate: '',
        });
        loadData();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
      } else {
        loadData();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Naozaj chcete vymazať túto úlohu?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        alert('Chyba pri mazaní úlohy');
      } else {
        loadData();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
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

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Čaká';
      case 'in_progress': return 'Prebieha';
      case 'completed': return 'Dokončené';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'low': return 'Nízka';
      case 'normal': return 'Normálna';
      case 'high': return 'Vysoká';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low': return 'text-gray-500';
      case 'normal': return 'text-blue-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Statistics
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  if (isLoading) {
    return (
      <div className={`h-full p-4 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28]"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full p-4 ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Zamestnanci</h1>
        {activeTab === 'tasks' && (
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-lg hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nová úloha
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-[#e11b28] text-white'
              : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Používatelia ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'bg-[#e11b28] text-white'
              : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Úlohy ({tasks.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
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
              className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Aktívne úlohy</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pendingTasks + inProgressTasks}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dokončené úlohy</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{completedTasks}</p>
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
            className={`rounded-lg overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
          >
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-white">Meno</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Registrovaný</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
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
                        {user.id === currentUser?.id && (
                          <span className="px-2 py-0.5 bg-[#e11b28] text-white text-xs rounded-full">Vy</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(user.createdAt).toLocaleDateString('sk-SK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'tasks' && (
        <>
          {/* Tasks Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Čakajúce</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pendingTasks}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Prebiehajúce</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{inProgressTasks}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dokončené</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{completedTasks}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div
            className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{ boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015' }}
          >
            {tasks.length === 0 ? (
              <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Zatiaľ žiadne úlohy</p>
                <p className="text-sm mt-1">Kliknite na "Nová úloha" pre vytvorenie prvej úlohy</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-white">Úloha</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Priradené</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Od</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Priorita</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Stav</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Termín</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {task.description.substring(0, 50)}{task.description.length > 50 ? '...' : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getUserName(task.assignedTo)}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getUserName(task.createdBy)}
                      </td>
                      <td className={`px-4 py-3 ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)} border-0 cursor-pointer`}
                        >
                          <option value="pending">Čaká</option>
                          <option value="in_progress">Prebieha</option>
                          <option value="completed">Dokončené</option>
                        </select>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('sk-SK') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {task.createdBy === currentUser?.id && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Vymazať"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nová úloha</h2>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className={`p-1 rounded hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Názov úlohy *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Zadajte názov úlohy"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Popis
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Voliteľný popis úlohy"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Priradiť komu *
                  </label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Vyberte používateľa</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email} {user.id === currentUser?.id ? '(Vy)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Priorita
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="low">Nízka</option>
                      <option value="normal">Normálna</option>
                      <option value="high">Vysoká</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Termín
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className={`px-4 py-2 border rounded-md transition-colors ${
                      isDark ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-md hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? 'Vytvára sa...' : 'Vytvoriť úlohu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zamestnanci;
