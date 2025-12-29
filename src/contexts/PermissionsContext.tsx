import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PermissionsContextType {
  canViewZamestnanci: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

const SUPERADMIN_EMAIL = 'richter@wens.sk';

interface PermissionsProviderProps {
  children: React.ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [canViewZamestnanci, setCanViewZamestnanci] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = user?.email === SUPERADMIN_EMAIL;

  const refreshPermissions = async () => {
    if (!user) {
      setCanViewZamestnanci(false);
      setIsLoading(false);
      return;
    }

    // Superadmin always has access
    if (isSuperAdmin) {
      setCanViewZamestnanci(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employee_permissions')
        .select('can_view_zamestnanci')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching permissions:', error);
      }

      setCanViewZamestnanci(data?.can_view_zamestnanci ?? false);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setCanViewZamestnanci(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    refreshPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = {
    canViewZamestnanci,
    isSuperAdmin,
    isLoading,
    refreshPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
