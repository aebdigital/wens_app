import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Spis from './components/Spis';
import Objednavky from './components/Objednavky';
import Kontakty from './components/Kontakty';
import CennikMaterialov from './components/CennikMaterialov';
import Technicke from './components/Technicke';
import Nastavenia from './components/Nastavenia';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="h-screen bg-[#f8faff] flex flex-col md:flex-row">
        {/* Mobile Top Bar */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between" style={{height: '65px'}}>
          <img 
            src="/logo.png" 
            alt="WENS door" 
            className="h-8"
          />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#e11b28]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Left Sidebar Navigation */}
        <div className={`w-64 bg-white border-r border-gray-200 flex-shrink-0 ${
          sidebarOpen ? 'block' : 'hidden'
        } md:block absolute md:relative z-50 h-full md:h-auto`}>
          <div className="p-4 border-b border-gray-200 hidden md:block">
            <img 
              src="/logo.png" 
              alt="WENS door" 
              className="h-8"
            />
          </div>
          <div className="flex flex-col h-full">
            <nav className="p-4 space-y-2 flex-1">
              {/* Close button for mobile */}
              <div className="md:hidden flex justify-end mb-4">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            <NavLink 
              to="/spis" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#e11b28] text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Spis</span>
            </NavLink>

            <NavLink 
              to="/objednavky" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#e11b28] text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Objednávky</span>
            </NavLink>

            <NavLink 
              to="/kontakty" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#e11b28] text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Kontakty</span>
            </NavLink>

            <NavLink 
              to="/cennik-materialov" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#e11b28] text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Cenník materiálov</span>
            </NavLink>

            <NavLink 
              to="/technicke" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#e11b28] text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M9 7h6" />
              </svg>
              <span>Technické výkresy</span>
            </NavLink>

            <NavLink 
              to="/nastavenia" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#e11b28] text-white shadow-sm' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Nastavenia</span>
            </NavLink>
            </nav>

            {/* User Account Section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-[#e11b28] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">JN</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Ján Novák
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    jan.novak@wens.sk
                  </p>
                </div>
                <button 
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Odhlásiť sa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
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
          {/* Desktop Top Bar */}
          <div className="hidden md:flex bg-white border-b border-gray-200 px-6 py-4 items-center justify-between" style={{height: '65px'}}>
          </div>
          
          <Routes>
            <Route path="/" element={<Spis />} />
            <Route path="/spis" element={<Spis />} />
            <Route path="/objednavky" element={<Objednavky />} />
            <Route path="/kontakty" element={<Kontakty />} />
            <Route path="/cennik-materialov" element={<CennikMaterialov />} />
            <Route path="/technicke" element={<Technicke />} />
            <Route path="/nastavenia" element={<Nastavenia />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;