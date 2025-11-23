import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import Register from './Register';

const AuthWrapper: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-600">Načítava sa...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center p-4">
      <div className="flex gap-8 w-full max-w-6xl justify-center">
        {/* Login Panel */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-48 h-16 bg-white rounded-lg mb-4 shadow-sm" style={{padding: '5px'}}>
                <img 
                  src="/logo.png" 
                  alt="WENS door" 
                  className="h-full w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Vitajte späť</h2>
              <p className="text-gray-600 text-sm mt-2">Prihláste sa do admin účtu</p>
            </div>
            <Login />
          </div>
        </div>

        {/* Register Panel */}
        <div className="w-full max-w-md">
          <Register />
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;