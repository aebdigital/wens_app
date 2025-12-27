import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { isDark } = useTheme();

  return (
    <div className={`md:hidden px-4 py-3 flex items-center justify-between ${isDark ? 'bg-dark-800 border-dark-500' : 'bg-white border-gray-200'} border-b`} style={{height: '65px'}}>
      <img
        src="/logo.png"
        alt="WENS door"
        className="h-8"
      />
      <button
        onClick={toggleSidebar}
        className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e11b28] ${isDark ? 'text-gray-300 hover:text-white hover:bg-dark-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
};

export default Header;
