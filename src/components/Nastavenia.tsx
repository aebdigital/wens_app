import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Nastavenia = () => {
  const { user, changePassword } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: 'sk',
    theme: 'light',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      // Load saved preferences from localStorage
      try {
        const savedPreferences = localStorage.getItem(`preferences_${user.id}`);
        if (savedPreferences) {
          const prefs = JSON.parse(savedPreferences);
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: prefs.phone || '',
            language: prefs.language || 'sk',
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          }));
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setFormData(prev => ({
          ...prev,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }));
      }
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!user) return;

    try {
      // Save user preferences to localStorage
      const preferences = {
        phone: formData.phone,
        language: formData.language,
      };

      localStorage.setItem(`preferences_${user.id}`, JSON.stringify(preferences));
      alert('Nastavenia boli úspešne uložené');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      if (error instanceof DOMException && error.code === 22) {
        alert('Nedostatok miesta v úložisku. Vymažte prosím niektoré dáta.');
      } else {
        alert('Chyba pri ukladaní nastavení. Skúste to znova.');
      }
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setPasswordError('Všetky polia sú povinné');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('Nové heslá sa nezhodujú');
      return;
    }

    if (formData.newPassword.length < 6) {
      setPasswordError('Nové heslo musí mať aspoň 6 znakov');
      return;
    }

    const success = await changePassword(formData.currentPassword, formData.newPassword);
    
    if (success) {
      setPasswordSuccess('Heslo bolo úspešne zmenené');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } else {
      setPasswordError('Súčasné heslo nie je správne');
    }
  };

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
        {/* Tabs */}
        <div className="flex border-b bg-gradient-to-br from-[#e11b28] to-[#b8141f]">
          {[
            { id: 'account', label: 'Účet', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'security', label: 'Bezpečnosť', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors text-white ${
                activeTab === tab.id
                  ? 'border-white bg-white/30 backdrop-blur-md'
                  : 'border-transparent hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'account' && (
            <div className="max-w-2xl">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Informácie o účte</h3>

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
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
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
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Zmena hesla</h3>

              {passwordError && (
                <div className={`mb-4 p-3 rounded-md ${isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className={`mb-4 p-3 rounded-md ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>{passwordSuccess}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Súčasné heslo</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nové heslo</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Potvrdiť nové heslo</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-md hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Zmeniť heslo
                </button>
              </div>

              <div className={`mt-6 p-4 rounded-md ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>Požiadavky na heslo:</h4>
                <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  <li>• Minimálne 6 znakov</li>
                  <li>• Heslo musí byť odlišné od súčasného</li>
                </ul>
              </div>
            </div>
          )}
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
            className="px-4 py-2 bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white rounded-md hover:from-[#c71325] hover:to-[#9e1019] transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            Uložiť zmeny
          </button>
        </div>
      </div>
    </div>
  );
};

export default Nastavenia;