import React from 'react';
import { getCountries } from '../lib/countries';
import { useLanguage } from '../lib/languageContext';

type RegForm = {
  name: string;
  email: string;
  password: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  subscribe: boolean;
};

type AuthModalProps = {
  showAuth: boolean;
  setShowAuth: (show: boolean) => void;
  isLoginMode: boolean;
  setIsLoginMode: (mode: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  regForm: RegForm;
  setRegForm: React.Dispatch<React.SetStateAction<RegForm>>;
  loading: boolean;
  error: string | null;
  success: string | null;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleRegister: (e: React.FormEvent) => Promise<void>;
  handleRegChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  switchMode: () => void;
  regPasswordStrength: { level: string; color: string };
};

const AuthModal: React.FC<AuthModalProps> = ({
  showAuth,
  setShowAuth,
  isLoginMode,
  email,
  setEmail,
  password,
  setPassword,
  regForm,
  loading,
  error,
  success,
  handleLogin,
  handleRegister,
  handleRegChange,
  switchMode,
  regPasswordStrength,
}) => {
  const { t, language } = useLanguage();
  const countries = getCountries(language);

  if (!showAuth) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAuth(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowAuth(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border-0 transition-all duration-300 transform scale-100 hover:scale-[1.01] max-h-[90vh] overflow-y-auto
          ${isLoginMode ? 'max-w-md w-full' : 'max-w-3xl w-full'}
        `}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowAuth(false)}
          className="absolute right-4 top-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
          aria-label={t('close_modal')}
        >
          <svg className="w-6 h-6 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header with Icon */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-t-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 inline-block mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isLoginMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                )}
              </svg>
            </div>
            <h2 id="auth-modal-title" className="text-3xl font-bold text-white mb-2">
              {isLoginMode ? t('sign_in') : t('sign_up')}
            </h2>
            <p className="text-white/90 text-lg">
              {isLoginMode 
                ? t('login_to_your_account') 
                : t('create_account_few_steps')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          {/* Show success message only for registration */}
          {!isLoginMode && success && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Forms */}
          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('email')}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('password')}
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAuth(false)} 
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('logging_in')}
                    </span>
                  ) : (
                    t('sign_in')
                  )}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <span className="text-gray-600">
                  {t('dont_have_account')}{' '}
                  <button 
                    type="button" 
                    onClick={switchMode} 
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors duration-200"
                  >
                    {t('create_account')}
                  </button>
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('full_name')} *
                  </label>
                  <input 
                    id="reg-name"
                    type="text" 
                    name="name" 
                    required 
                    value={regForm.name} 
                    onChange={handleRegChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                    placeholder={t('your_full_name')} 
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('email')} *
                  </label>
                  <input 
                    id="reg-email"
                    type="email" 
                    name="email" 
                    required 
                    value={regForm.email} 
                    onChange={handleRegChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                    placeholder="your@email.com" 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('password')} *
                </label>
                <input 
                  id="reg-password"
                  type="password" 
                  name="password" 
                  required 
                  value={regForm.password} 
                  onChange={handleRegChange} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                  placeholder={t('minimum_8_characters')} 
                />
                {regForm.password && (
                  <div className="mt-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">{t('strength')}:</span>
                      <span className={`font-semibold ${
                        regPasswordStrength.level === 'Weak' ? 'text-red-600' :
                        regPasswordStrength.level === 'Medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {regPasswordStrength.level}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className={`h-2 rounded-full transition-all duration-300 ${regPasswordStrength.color}`} 
                           style={{ width: regPasswordStrength.level === 'Weak' ? '33%' : regPasswordStrength.level === 'Medium' ? '66%' : '100%' }}></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reg-address" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('street_address')} *
                  </label>
                  <input 
                    id="reg-address"
                    type="text" 
                    name="address" 
                    required 
                    value={regForm.address} 
                    onChange={handleRegChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                    placeholder={t('street_address_placeholder')} 
                  />
                </div>
                <div>
                  <label htmlFor="reg-city" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('city')} *
                  </label>
                  <input
                    id="reg-city"
                    type="text"
                    name="city"
                    required
                    value={regForm.city}
                    onChange={handleRegChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                    placeholder={t('your_city')}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reg-zipcode" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('zip_code')} *
                  </label>
                  <input 
                    id="reg-zipcode"
                    type="text" 
                    name="zipCode" 
                    required 
                    value={regForm.zipCode} 
                    onChange={handleRegChange} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900" 
                    placeholder="1000" 
                  />
                </div>
                <div>
                  <label htmlFor="reg-country" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('country')} *
                  </label>
                  <select
                    id="reg-country"
                    name="country"
                    required
                    value={regForm.country}
                    onChange={handleRegChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900"
                  >
                    <option value="">{t('select_country')}</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  id="reg-subscribe"
                  type="checkbox"
                  name="subscribe"
                  checked={regForm.subscribe}
                  onChange={handleRegChange}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
                />
                <label htmlFor="reg-subscribe" className="text-sm text-gray-700 leading-5">
                  {t('subscribe_newsletter')}
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAuth(false)} 
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('signing_up')}
                    </span>
                  ) : (
                    t('sign_up')
                  )}
                </button>
              </div>
              
              <div className="text-center pt-4 border-t border-gray-200">
                <span className="text-gray-600">
                  {t('already_have_account')}{' '}
                  <button 
                    type="button" 
                    onClick={switchMode} 
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors duration-200"
                  >
                    {t('sign_in')}
                  </button>
                </span>
              </div>
            </form>
          )}
        </div>  
      </div>
    </div>
  );
};

export default AuthModal;