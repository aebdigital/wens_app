import React, { useEffect, useState, useRef } from 'react';
import { useTasks, Task } from '../../contexts/TasksContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export const TaskPopup: React.FC = () => {
  const { tasks } = useTasks();
  const { user } = useAuth(); // Import useAuth
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeNotification, setActiveNotification] = useState<Task | null>(null);
  const processedTaskIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!user) return;

    // Filter tasks for me
    const myTasks = tasks.filter(t => t.to.id === user.id);

    // On mount, mark all current tasks as "processed" so we don't popup for old tasks
    if (initialLoad.current && myTasks.length > 0) {
        myTasks.forEach(t => processedTaskIds.current.add(t.id));
        initialLoad.current = false;
        return;
    } else if (initialLoad.current) {
        initialLoad.current = false;
        return;
    }

    // Check for new tasks
    const newTasks = myTasks.filter(t => !processedTaskIds.current.has(t.id) && !t.read);
    
    if (newTasks.length > 0) {
        // Show notification for the newest one
        const latest = newTasks[0]; // Assuming tasks are sorted desc
        setActiveNotification(latest);
        
        // Mark as processed so we don't show again in this session
        newTasks.forEach(t => processedTaskIds.current.add(t.id));

        // Auto hide after 10 seconds
        const timer = setTimeout(() => {
            setActiveNotification(null);
        }, 10000);
        return () => clearTimeout(timer);
    }
  }, [tasks, user]);

  if (!activeNotification) return null;

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full z-[100] p-4 rounded-lg shadow-2xl border-l-4 border-blue-500 animate-slide-in ${isDark ? 'bg-dark-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">Máš novú úlohu!</h3>
            <button onClick={() => setActiveNotification(null)} className="text-gray-400 hover:text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <p className="text-sm font-medium mb-1">Od: {activeNotification.from.name}</p>
        <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'} break-words whitespace-pre-wrap`}>{activeNotification.text}</p>
        
        <div className="flex gap-2">
            <button
                onClick={() => {
                    navigate('/ulohy');
                    setActiveNotification(null);
                }}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
                Zobraziť v úlohách
            </button>
            {activeNotification.type === 'specificka' && activeNotification.spisId && (
                <button
                    onClick={() => {
                        navigate('/spis', { state: { openSpisId: activeNotification.spisId, highlightProjectIds: [activeNotification.spisCislo] } });
                        setActiveNotification(null);
                    }}
                    className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
                >
                    Zobraziť projekt
                </button>
            )}
        </div>
    </div>
  );
};
