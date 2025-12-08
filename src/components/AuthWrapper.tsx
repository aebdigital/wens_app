import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthWrapper: React.FC = () => {
  const { isLoading, login, register } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register State
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirmPassword, setRegShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  const checkPasswordStrength = (password: string) => {
    const criteria = {
      length: password.length >= 12,
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordCriteria(criteria);
    return criteria;
  };

  // Update criteria on change
  const handleRegisterPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    handleRegisterChange('password', val);
    checkPasswordStrength(val);
  };

  // Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    const success = await login(loginEmail, loginPassword);
    if (!success) {
      setLoginError('Nesprávny e-mail alebo heslo');
    }
    setIsLoginLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Heslá sa nezhodujú');
      return;
    }

    const criteria = checkPasswordStrength(registerData.password);
    if (!Object.values(criteria).every(Boolean)) {
      setRegisterError('Heslo nespĺňa bezpečnostné požiadavky');
      return;
    }

    setIsRegisterLoading(true);

    const registrationSuccess = await register(
      registerData.email,
      registerData.password,
      registerData.firstName,
      registerData.lastName
    );

    if (registrationSuccess) {
      setRegisterSuccess('Účet bol úspešne vytvorený! Prihlasujete sa...');
    } else {
      setRegisterError('Účet s týmto e-mailom už existuje');
    }
    setIsRegisterLoading(false);
  };

  const handleRegisterChange = (field: string, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

  const getStrengthColor = () => {
    const metCount = Object.values(passwordCriteria).filter(Boolean).length;
    if (metCount <= 1) return 'bg-red-500';
    if (metCount <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthWidth = () => {
    const metCount = Object.values(passwordCriteria).filter(Boolean).length;
    return `${(metCount / 4) * 100}%`;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center p-4 overflow-hidden">
      {/* Main Container */}
      <div className="w-full max-w-md overflow-hidden relative rounded-3xl shadow-2xl bg-white">
        {/* Sliding Container (200% width) */}
        <div 
          className="flex transition-transform duration-500 ease-in-out w-[200%]"
          style={{ transform: showRegister ? 'translateX(-50%)' : 'translateX(0)' }}
        >
          
          {/* Login Panel (50% width) */}
          <div className="w-1/2 p-8">
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

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{loginError}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors bg-white text-gray-900"
                    placeholder="Zadajte váš e-mail"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Heslo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={loginShowPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors bg-white text-gray-900"
                    placeholder="Zadajte heslo"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPassword(!loginShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {loginShowPassword ? (
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

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#c71325] hover:to-[#9e1019] focus:outline-none focus:ring-2 focus:ring-[#e11b28] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoginLoading ? 'Prihlasuje sa...' : 'Prihlásiť sa'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm mb-2">Nemáte účet?</p>
              <button 
                onClick={() => setShowRegister(true)}
                className="text-[#e11b28] font-bold hover:text-[#c71325] transition-colors"
              >
                Zaregistrujte sa tu
              </button>
            </div>
          </div>

          {/* Register Panel (50% width) */}
          <div className="w-1/2 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-48 h-16 bg-white rounded-lg mb-4 shadow-sm" style={{padding: '5px'}}>
                <img 
                  src="/logo.png" 
                  alt="WENS door" 
                  className="h-full w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Vytvorte si účet</h2>
              <p className="text-gray-600 text-sm mt-2">Zaregistrujte sa pre prístup do aplikácie</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {registerError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{registerError}</p>
                </div>
              )}

              {registerSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{registerSuccess}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Meno *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={registerData.firstName}
                    onChange={(e) => handleRegisterChange('firstName', e.target.value)}
                    className="block w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Meno"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Priezvisko *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={registerData.lastName}
                    onChange={(e) => handleRegisterChange('lastName', e.target.value)}
                    className="block w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Priezvisko"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => handleRegisterChange('email', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="vas@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Heslo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="reg-password"
                    type={regShowPassword ? "text" : "password"}
                    required
                    value={registerData.password}
                    onChange={handleRegisterPasswordChange}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="block w-full pl-10 pr-12 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Minimálne 12 znakov"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {regShowPassword ? (
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

                {/* Requirements List (Inline Accordion) */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isPasswordFocused ? 'max-h-48 opacity-100 mt-2' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="bg-gray-50 rounded-lg p-3 text-xs border border-gray-200">
                    <p className="font-semibold mb-2 text-gray-700">Požiadavky na heslo:</p>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${passwordCriteria.length ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="mr-2 text-lg leading-none">{passwordCriteria.length ? '✓' : '•'}</span>
                        Minimálne 12 znakov
                      </li>
                      <li className={`flex items-center ${passwordCriteria.upper ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="mr-2 text-lg leading-none">{passwordCriteria.upper ? '✓' : '•'}</span>
                        Veľké písmeno
                      </li>
                      <li className={`flex items-center ${passwordCriteria.number ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="mr-2 text-lg leading-none">{passwordCriteria.number ? '✓' : '•'}</span>
                        Číslo
                      </li>
                      <li className={`flex items-center ${passwordCriteria.special ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className="mr-2 text-lg leading-none">{passwordCriteria.special ? '✓' : '•'}</span>
                        Špeciálny znak (!@#...)
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Strength Meter */}
                <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ease-out ${getStrengthColor()}`} 
                    style={{ width: getStrengthWidth() }}
                  ></div>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Potvrďte heslo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={regShowConfirmPassword ? "text" : "password"}
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    className="block w-full pl-10 pr-12 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Zopakujte heslo"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowConfirmPassword(!regShowConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {regShowConfirmPassword ? (
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

              <button
                type="submit"
                disabled={isRegisterLoading}
                className="w-full bg-gradient-to-br from-[#e11b28] to-[#b8141f] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#c71325] hover:to-[#9e1019] focus:outline-none focus:ring-2 focus:ring-[#e11b28] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg hover:shadow-xl"
              >
                {isRegisterLoading ? 'Registruje sa...' : 'Vytvoriť účet'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm mb-2">Už máte účet?</p>
              <button 
                onClick={() => setShowRegister(false)}
                className="text-[#e11b28] font-bold hover:text-[#c71325] transition-colors"
              >
                Prihláste sa tu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;