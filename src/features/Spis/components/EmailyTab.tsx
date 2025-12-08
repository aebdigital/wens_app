import React from 'react';

interface EmailyTabProps {
  isDark: boolean;
  items: any[];
  onUpdate: (items: any[]) => void;
}

export const EmailyTab: React.FC<EmailyTabProps> = ({ isDark, items, onUpdate }) => {
  return (
    <div className="h-full flex items-center justify-center relative">
      {/* Blurred background content */}
      <div className="absolute inset-0 p-2 blur-sm pointer-events-none">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-400 rounded border border-gray-400"></div>
            <span className="text-xs">Odoslať</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Komu</label>
            <div className="flex gap-1">
              <select className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded">
                <option></option>
              </select>
              <input type="text" className="flex-1 text-xs border border-gray-300 px-2 py-1 rounded" />
            </div>
          </div>
          <div></div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Predmet</label>
            <input type="text" defaultValue="CP2025/0365" className="w-full text-xs border border-gray-300 px-2 py-1 rounded" />
          </div>
        </div>
      </div>

      {/* Centered popup */}
      <div
        className={`text-center z-10 px-8 py-6 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}
        style={{
          boxShadow: 'inset 0 1px 2px #ffffff30, 0 1px 2px #00000030, 0 2px 4px #00000015'
        }}
      >
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Bude doplnené neskôr</p>
      </div>
    </div>
  );
};
