import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions, SUPERADMIN_EMAILS } from '../contexts/PermissionsContext';
import { supabase } from '../lib/supabase';

interface UserWithPermission {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  can_view_zamestnanci: boolean;
}

interface DirectoryEmployee {
  id: string;
  name: string;
}

const EmployeeDirectoryManager: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employees_directory')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('employees_directory')
        .insert({ name: newEmployeeName.trim() })
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewEmployeeName('');
    } catch (error) {
      console.error('Failed to add employee:', error);
      alert('Nepodarilo sa pridať zamestnanca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Naozaj chcete vymazať tohto zamestnanca?')) return;

    try {
      const { error } = await supabase
        .from('employees_directory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Nepodarilo sa vymazať zamestnanca.');
    }
  };

  return (
    <div
      className={`mt-6 rounded-lg overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-white'}`}
      style={{
        boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
      }}
    >
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
        <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-white font-medium">Správa zoznamu zamestnancov</span>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Tento zoznam sa zobrazuje vo výbere v sekcii Dovolenky.
        </p>

        {/* Add New */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder="Meno nového zamestnanca"
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            onKeyDown={(e) => e.key === 'Enter' && handleAddEmployee()}
          />
          <button
            onClick={handleAddEmployee}
            disabled={isSubmitting || !newEmployeeName.trim()}
            className="px-4 py-2 bg-[#e11b28] text-white rounded-md hover:bg-[#c71325] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Pridať
          </button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e11b28]"></div>
          </div>
        ) : employees.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Zoznam je prázdny.</p>
        ) : (
          <div className={`border rounded-lg divide-y ${isDark ? 'border-dark-600 divide-dark-600' : 'border-gray-200 divide-gray-100'}`}>
            {employees.map((emp) => (
              <div
                key={emp.id}
                className={`flex items-center justify-between p-3 ${isDark ? 'bg-dark-700' : 'bg-white'
                  }`}
              >
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {emp.name}
                </span>
                <button
                  onClick={() => handleDeleteEmployee(emp.id)}
                  className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                  title="Vymazať"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Nastavenia = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { isSuperAdmin } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'sk',
  });
  const [saveSuccess, setSaveSuccess] = useState('');

  // Superadmin state for employee permissions
  const [allUsers, setAllUsers] = useState<UserWithPermission[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Load saved preferences from Supabase
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error loading preferences:', error);
          }

          setFormData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: data?.phone || '',
            language: data?.language || 'sk',
          }));
        } catch (error) {
          console.error('Failed to load preferences:', error);
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          }));
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();
  }, [user]);

  // Load all users with their permissions (superadmin only)
  useEffect(() => {
    const loadUsersWithPermissions = async () => {
      if (!isSuperAdmin) return;

      setIsLoadingUsers(true);
      try {
        // Fetch all users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name')
          .order('email');

        if (usersError) {
          console.error('Error fetching users:', usersError);
          return;
        }

        // Fetch all permissions
        const { data: permissions, error: permissionsError } = await supabase
          .from('employee_permissions')
          .select('user_id, can_view_zamestnanci');

        if (permissionsError && permissionsError.code !== 'PGRST116') {
          console.error('Error fetching permissions:', permissionsError);
        }

        // Combine users with their permissions
        const usersWithPermissions: UserWithPermission[] = (users || []).map(u => {
          const permission = permissions?.find(p => p.user_id === u.id);
          return {
            ...u,
            can_view_zamestnanci: permission?.can_view_zamestnanci ?? false,
          };
        });

        // Sort so superadmins appear first, then current user (if distinct), then alphabetical
        usersWithPermissions.sort((a, b) => {
          const aIsSuper = SUPERADMIN_EMAILS.includes(a.email);
          const bIsSuper = SUPERADMIN_EMAILS.includes(b.email);

          if (aIsSuper && !bIsSuper) return -1;
          if (!aIsSuper && bIsSuper) return 1;

          // If both are super or both are not, sort by self
          if (a.id === user?.id) return -1;
          if (b.id === user?.id) return 1;

          return a.email.localeCompare(b.email);
        });

        setAllUsers(usersWithPermissions);
      } catch (error) {
        console.error('Failed to load users with permissions:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsersWithPermissions();
  }, [isSuperAdmin, user?.id]);

  const toggleZamestnanciPermission = async (userId: string, currentValue: boolean) => {
    setIsSavingPermissions(userId);
    try {
      // Check if permission record exists
      const { data: existing } = await supabase
        .from('employee_permissions')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('employee_permissions')
          .update({
            can_view_zamestnanci: !currentValue,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('employee_permissions')
          .insert({
            user_id: userId,
            can_view_zamestnanci: !currentValue,
          });

        if (error) throw error;
      }

      // Update local state
      setAllUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, can_view_zamestnanci: !currentValue } : u
      ));
    } catch (error) {
      console.error('Failed to update permission:', error);
      alert('Chyba pri ukladaní oprávnenia. Skúste to znova.');
    } finally {
      setIsSavingPermissions(null);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess('');
    try {
      // Update user's first_name and last_name in users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const preferences = {
        user_id: user.id,

        phone: (() => {
          let p = formData.phone.replace(/[\s-]/g, ''); // Remove spaces and dashes
          if (!p) return '';
          if (p.startsWith('09')) {
            return '+421' + p.substring(1);
          } else if (p.startsWith('9')) {
            return '+421' + p;
          }
          return p;
        })(),
        language: formData.language,
      };

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_preferences')
          .update(preferences)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_preferences')
          .insert(preferences);

        if (error) throw error;
      }

      setSaveSuccess('Nastavenia boli úspešne uložené');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Chyba pri ukladaní nastavení. Skúste to znova.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`h-full p-4 flex items-center justify-center ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e11b28]"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full p-4 overflow-auto ${isDark ? 'bg-dark-900' : 'bg-[#f8faff]'}`}>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Nastavenia</h1>
      </div>

      <div
        className={`rounded-lg overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-white'}`}
        style={{
          boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
        }}
      >
        {/* Header */}
        <div className="flex items-center px-6 py-4 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
          <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-white font-medium">Informácie o účte</span>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-2xl">
            {saveSuccess && (
              <div className={`mb-4 p-3 rounded-md ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{saveSuccess}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Meno</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priezvisko</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-dark-600 border-dark-500 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'
                      } cursor-not-allowed`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Email nie je možné zmeniť</p>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Telefón</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'bg-dark-700 border-dark-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${isDark ? 'bg-dark-700 border-dark-500' : 'bg-gray-50 border-gray-200'}`}>
          <button
            type="button"
            className={`px-4 py-2 border rounded-md transition-colors ${isDark ? 'text-gray-300 bg-dark-600 border-gray-500 hover:bg-gray-500' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
              }`}
          >
            Zrušiť
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-md hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isSaving ? 'Ukladám...' : 'Uložiť zmeny'}
          </button>
        </div>
      </div>

      {/* Employee Access Management - Only visible for superadmin */}
      {isSuperAdmin && (
        <div
          className={`mt-6 rounded-lg overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-white'}`}
          style={{
            boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
          }}
        >
          {/* Header */}
          <div className="flex items-center px-6 py-4 bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
            <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-white font-medium">Prístupy zamestnancov</span>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Spravujte, ktorí používatelia majú prístup k štatistikám (tlačidlo grafu v sekcii Spis).
            </p>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e11b28]"></div>
              </div>
            ) : allUsers.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Žiadni používatelia neboli nájdení.</p>
            ) : (
              <div className="space-y-2">
                {allUsers.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isSuperAdminUser = SUPERADMIN_EMAILS.includes(u.email);

                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {u.first_name?.charAt(0) || ''}{u.last_name?.charAt(0) || ''}
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {u.first_name} {u.last_name}
                            {isSuperAdminUser && <span className="ml-2 text-xs text-[#e11b28] font-normal">(Superadmin)</span>}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSuperAdminUser ? (
                          <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                            Vždy povolené
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleZamestnanciPermission(u.id, u.can_view_zamestnanci)}
                            disabled={isSavingPermissions === u.id}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#e11b28] focus:ring-offset-2 ${u.can_view_zamestnanci ? 'bg-[#e11b28]' : isDark ? 'bg-dark-500' : 'bg-gray-200'
                              } ${isSavingPermissions === u.id ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${u.can_view_zamestnanci ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee Directory Management - Only visible for superadmin */}
      {isSuperAdmin && (
        <EmployeeDirectoryManager isDark={isDark} />
      )}
    </div>
  );
};

export default Nastavenia;
