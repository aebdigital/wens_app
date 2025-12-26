import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

const Nastavenia = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
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
        phone: formData.phone,
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
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Nastavenia</h1>
      </div>

      <div
        className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priezvisko</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className={`w-full px-3 py-2 border rounded-md ${
                      isDark ? 'bg-gray-600 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <button
            type="button"
            className={`px-4 py-2 border rounded-md transition-colors ${
              isDark ? 'text-gray-300 bg-gray-600 border-gray-500 hover:bg-gray-500' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
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
    </div>
  );
};

export default Nastavenia;
