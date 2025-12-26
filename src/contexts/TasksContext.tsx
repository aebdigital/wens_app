import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export interface Task {
  id: string;
  from: {
    id: string;
    name: string;
  };
  to: {
    id: string;
    name: string;
  };
  type: 'vseobecna' | 'specificka';
  text: string;
  spisId?: string; // If specificka
  spisCislo?: string; // For display
  createdAt: string;
  read: boolean;
}

export interface UserBasic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TasksContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'read' | 'from'>) => void;
  markAsRead: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  getAllUsers: () => UserBasic[];
  unreadCount: number;
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
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Load tasks from localStorage on mount and when user changes
  useEffect(() => {
    const loadTasks = () => {
      const storedTasks = localStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks: Task[] = JSON.parse(storedTasks);
        // Filter tasks relevant to current user (either sent to them or sent by them)
        // Actually, mostly we care about tasks SENT TO the current user for the inbox/notifications
        // But for "Sent Items" we might want those sent BY them.
        // For now, let's just load ALL and let the UI filter, or filter here.
        // The requirement implies seeing tasks assigned TO the user.

        // Let's keep all tasks in state and filter in UI? Or just filter here?
        // Simulating backend: we should have all tasks.
        setTasks(parsedTasks);
      } else {
        setTasks([]);
      }
    };

    loadTasks();

    // Listen for storage events to update across tabs (simulating real-time)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tasks') {
        loadTasks();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update unread count for current user
  useEffect(() => {
    if (user) {
      const myUnread = tasks.filter(t => t.to.id === user.id && !t.read).length;
      setUnreadCount(myUnread);
    } else {
      setUnreadCount(0);
    }
  }, [tasks, user]);

  const addTask = (newTaskData: Omit<Task, 'id' | 'createdAt' | 'read' | 'from'>) => {
    if (!user) return;

    const newTask: Task = {
      ...newTaskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
      from: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`
      }
    };

    setTasks(prev => {
      const updated = [newTask, ...prev];
      localStorage.setItem('tasks', JSON.stringify(updated));
      return updated;
    });
    
    // Dispatch a storage event manually for the current window so other components update immediately if they listen to it, 
    // although React state update handles this context.
    // However, if we want to simulate "receiving" a task in the SAME window if I send it to myself:
    // The state update above triggers re-render, so unread count updates.
  };

  const markAsRead = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, read: true } : t);
      localStorage.setItem('tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      localStorage.setItem('tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const getAllUsers = useCallback((): UserBasic[] => {
    return allUsers;
  }, [allUsers]);

  return (
    <TasksContext.Provider value={{ tasks, addTask, markAsRead, deleteTask, getAllUsers, unreadCount }}>
      {children}
    </TasksContext.Provider>
  );
};
