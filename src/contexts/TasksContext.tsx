import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, DbTask } from '../lib/supabase';

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
  spisId?: string;
  spisCislo?: string;
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
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'read' | 'from'>) => Promise<void>;
  markAsRead: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getAllUsers: () => UserBasic[];
  unreadCount: number;
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

// Helper to convert DB task to app task
const dbToTask = (db: DbTask): Task => ({
  id: db.id,
  from: {
    id: db.from_user_id,
    name: db.from_user_name
  },
  to: {
    id: db.to_user_id,
    name: db.to_user_name
  },
  type: db.type,
  text: db.text,
  spisId: db.spis_id || undefined,
  spisCislo: db.spis_cislo || undefined,
  createdAt: db.created_at,
  read: db.read
});

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

  // Load tasks from Supabase
  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      return;
    }

    try {
      // Load tasks where user is sender or recipient
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
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
  }, [user]);

  // Load tasks when user changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Update unread count for current user
  useEffect(() => {
    if (user) {
      const myUnread = tasks.filter(t => t.to.id === user.id && !t.read).length;
      setUnreadCount(myUnread);
    } else {
      setUnreadCount(0);
    }
  }, [tasks, user]);

  const addTask = async (newTaskData: Omit<Task, 'id' | 'createdAt' | 'read' | 'from'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          from_user_id: user.id,
          from_user_name: `${user.firstName} ${user.lastName}`,
          to_user_id: newTaskData.to.id,
          to_user_name: newTaskData.to.name,
          type: newTaskData.type,
          text: newTaskData.text,
          spis_id: newTaskData.spisId || null,
          spis_cislo: newTaskData.spisCislo || null,
          read: false
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

  const markAsRead = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ read: true })
        .eq('id', taskId);

      if (error) {
        console.error('Error marking task as read:', error);
        return;
      }

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, read: true } : t));
    } catch (error) {
      console.error('Failed to mark task as read:', error);
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

  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  return (
    <TasksContext.Provider value={{ tasks, addTask, markAsRead, deleteTask, getAllUsers, unreadCount, refreshTasks }}>
      {children}
    </TasksContext.Provider>
  );
};
