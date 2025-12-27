import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTasks } from '../../contexts/TasksContext';
import StyledNavLink from './StyledNavLink';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const { getUnreadCount } = useTasks();
  const unreadCount = getUnreadCount();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  if (!user) return null;

  return (
    <>
      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <div
        className={`
            w-64 flex-shrink-0 
            fixed md:relative z-50 h-screen 
            flex flex-col bg-gradient-to-br from-[#e11b28] to-[#b8141f]
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015',
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
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md text-white hover:bg-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          <StyledNavLink to="/spis">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Spis</span>
          </StyledNavLink>

          <StyledNavLink to="/objednavky">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Objednávky</span>
          </StyledNavLink>

          <StyledNavLink to="/kontakty">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Kontakty</span>
          </StyledNavLink>

          <StyledNavLink to="/zamestnanci">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Zamestnanci</span>
          </StyledNavLink>

          <StyledNavLink to="/dovolenky">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Dovolenky</span>
          </StyledNavLink>

          <StyledNavLink to="/ulohy">
              <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <span>Úlohy</span>
                  </div>
                  {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount}
                      </span>
                  )}
              </div>
          </StyledNavLink>

          <StyledNavLink to="/nastavenia">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Nastavenia</span>
          </StyledNavLink>
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isDark ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium">Svetlý režim</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-sm font-medium">Tmavý režim</span>
              </>
            )}
          </button>
        </div>

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
    </>
  );
};

export default Sidebar;
