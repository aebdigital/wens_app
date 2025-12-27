import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, DbTask } from '../lib/supabase';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high';
  createdBy: string;
  createdByName?: string;
  assignedTo: string;
  assignedToName?: string;
  dueDate: string | null;
  createdAt: string;
}

export interface UserBasic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TasksContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getAllUsers: () => UserBasic[];
  getUnreadCount: () => number;
  refreshTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

interface TasksProviderProps {
  children: React.ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<UserBasic[]>([]);

  // Fetch all users from Supabase on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, first_name, last_name');

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        if (data) {
          const users: UserBasic[] = data.map((u: any) => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email
          }));
          setAllUsers(users);
        }
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    };

    fetchUsers();
  }, []);

  // Helper to get user name by ID
  const getUserName = useCallback((userId: string): string => {
    const foundUser = allUsers.find(u => u.id === userId);
    return foundUser ? `${foundUser.firstName} ${foundUser.lastName}` : 'Unknown';
  }, [allUsers]);

  // Helper to convert DB task to app task
  const dbToTask = useCallback((db: DbTask): Task => ({
    id: db.id,
    title: db.title,
    description: db.description || '',
    status: db.status,
    priority: db.priority || 'normal',
    createdBy: db.created_by,
    createdByName: getUserName(db.created_by),
    assignedTo: db.assigned_to,
    assignedToName: getUserName(db.assigned_to),
    dueDate: db.due_date,
    createdAt: db.created_at
  }), [getUserName]);

  // Load tasks from Supabase
  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      return;
    }

    try {
      // Load tasks where user is creator or assignee
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
        return;
      }

      if (data) {
        setTasks(data.map(dbToTask));
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    }
  }, [user, dbToTask]);

  // Load tasks when user changes or allUsers are loaded
  useEffect(() => {
    if (allUsers.length > 0) {
      loadTasks();
    }
  }, [loadTasks, allUsers]);

  const addTask = async (newTaskData: Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTaskData.title,
          description: newTaskData.description || '',
          status: newTaskData.status || 'pending',
          priority: newTaskData.priority || 'normal',
          created_by: user.id,
          assigned_to: newTaskData.assignedTo,
          due_date: newTaskData.dueDate || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        return;
      }

      if (data) {
        const newTask = dbToTask(data);
        setTasks(prev => [newTask, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getAllUsers = useCallback((): UserBasic[] => {
    return allUsers;
  }, [allUsers]);

  const getUnreadCount = useCallback((): number => {
    if (!user) return 0;
    // Count pending tasks assigned to current user
    return tasks.filter(t => t.assignedTo === user.id && t.status === 'pending').length;
  }, [tasks, user]);

  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, getAllUsers, getUnreadCount, refreshTasks }}>
      {children}
    </TasksContext.Provider>
  );
};
