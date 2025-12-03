import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ContactsProvider } from './contexts/ContactsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AuthWrapper from './components/AuthWrapper';
import Spis from './components/Spis';
import Objednavky from './components/Objednavky';
import Kontakty from './components/Kontakty';
import Nastavenia from './components/Nastavenia';
import Zamestnanci from './components/Zamestnanci';

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  if (!user) {
    return <AuthWrapper />;
  }

  return (
    <Router>
      <div className={`h-screen flex flex-col md:flex-row ${isDark ? 'bg-gray-900' : 'bg-[#f8faff]'}`}>
        {/* Mobile Top Bar */}
        <div className={`md:hidden px-4 py-3 flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`} style={{height: '65px'}}>
          <img
            src="/logo.png"
            alt="WENS door"
            className="h-8"
          />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Left Sidebar Navigation */}
        <div
          className="w-64 flex-shrink-0 block md:block absolute md:relative z-50 h-screen flex flex-col bg-gradient-to-br from-[#e11b28] to-[#b8141f]"
          style={{
            boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015',
            display: sidebarOpen || window.innerWidth >= 768 ? 'flex' : 'none'
          }}
        >
          <div className="p-4 hidden md:block flex-shrink-0 border-b border-white/20">
            <div className="bg-white rounded-lg p-2 inline-block">
              <img
                src="/logo.png"
                alt="WENS door"
                className="h-6"
              />
            </div>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
              {/* Close button for mobile */}
              <div className="md:hidden flex justify-end mb-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-white hover:bg-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            <NavLink
              to="/spis"
              className={({ isActive }) => {
                const currentPath = window.location.pathname;
                const isSpisActive = isActive || currentPath === '/';
                return `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white ${
                  isSpisActive
                    ? 'bg-white/30 backdrop-blur-md shadow-lg'
                    : 'hover:bg-white/10'
                }`;
              }}
            >
              {({ isActive }) => {
                const currentPath = window.location.pathname;
                const isSpisActive = isActive || currentPath === '/';
                return (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Spis</span>
                  </>
                );
              }}
            </NavLink>

            <NavLink
              to="/objednavky"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white ${
                  isActive
                    ? 'bg-white/30 backdrop-blur-md shadow-lg'
                    : 'hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Objednávky</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/kontakty"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white ${
                  isActive
                    ? 'bg-white/30 backdrop-blur-md shadow-lg'
                    : 'hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Kontakty</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/zamestnanci"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white ${
                  isActive
                    ? 'bg-white/30 backdrop-blur-md shadow-lg'
                    : 'hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Zamestnanci</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/nastavenia"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white ${
                  isActive
                    ? 'bg-white/30 backdrop-blur-md shadow-lg'
                    : 'hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Nastavenia</span>
                </>
              )}
            </NavLink>
          </nav>

          {/* User Account Section */}
          <div className="p-4 flex-shrink-0 border-t border-white/20">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#e11b28] font-medium text-sm">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs truncate text-white/70">
                  {user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1 transition-colors text-white/70 hover:text-white"
                title="Odhlásiť sa"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<Spis />} />
            <Route path="/spis" element={<Spis />} />
            <Route path="/objednavky" element={<Objednavky />} />
            <Route path="/kontakty" element={<Kontakty />} />
            <Route path="/zamestnanci" element={<Zamestnanci />} />
            <Route path="/nastavenia" element={<Nastavenia />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ContactsProvider>
          <AppContent />
        </ContactsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;