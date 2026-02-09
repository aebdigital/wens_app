import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // Supabase automatically picks up the token from the URL hash
    // and fires a PASSWORD_RECOVERY event. We just need to wait for the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsSessionReady(true);
      }
    });

    // Also check if we already have a session (in case the event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Heslá sa nezhodujú.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setError('Nepodarilo sa zmeniť heslo. Skúste to znova.');
      } else {
        setSuccess(true);
        // Sign out after password change so they log in fresh
        await supabase.auth.signOut();
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch {
      setError('Nastala chyba. Skúste to znova.');
    }
    setIsLoading(false);
  };

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <img src="/logo.png" alt="WENS door" className="h-12 w-auto object-contain" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nové heslo</h1>
          <p className="text-gray-500 mb-8">Zadajte svoje nové heslo</p>

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-green-700 text-sm">Heslo bolo úspešne zmenené. Presmerujeme vás na prihlásenie...</p>
              </div>
            </div>
          ) : !isSessionReady ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e11b28]"></div>
                <span className="ml-3 text-gray-500">Overujem odkaz...</span>
              </div>
              <p className="text-center text-sm text-gray-400">
                Ak sa nič nedeje, odkaz mohol vypršať.{' '}
                <button onClick={() => navigate('/login')} className="text-[#e11b28] hover:underline">
                  Späť na prihlásenie
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-[#e11b28] p-4">
                  <p className="text-[#e11b28] text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nové heslo
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-4 py-3 pr-12 border border-gray-300 focus:outline-none focus:border-[#e11b28] transition-colors bg-white text-gray-900"
                    placeholder="Minimálne 6 znakov"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Potvrdiť heslo
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#e11b28] transition-colors bg-white text-gray-900"
                  placeholder="Zopakujte heslo"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#e11b28] text-white py-3 px-4 font-semibold hover:bg-[#c71325] focus:outline-none focus:ring-2 focus:ring-[#e11b28] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Mením heslo...' : 'Zmeniť heslo'}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-400">
            WENS Door CRM System
          </p>
        </div>
      </div>

      {/* Right Side - Animated Red Gradient */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(-45deg, #e11b28, #b8141f, #ff3d47, #8b0f18, #e11b28)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
