'use client';

import Link from 'next/link';
import { useCart } from '../lib/cartContext';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import AuthModal from './AuthModal';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../lib/languageContext';
import { useLogo } from '../app/contexts/LogoContext';
import { useInvoiceSettings } from '../app/contexts/InvoiceSettingsContext';



type User = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  address?: {
    street: string;
    city: string;
    zipCode?: string;
    country?: string;
  };
};

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

const Header: React.FC = () => {
  const { itemCount, clearCart } = useCart();
  const { t } = useLanguage();
  const { currentLogo } = useLogo(); // Use global logo context
  const { settings: invoiceSettings } = useInvoiceSettings(); // Use invoice settings context
  const [showAuth, setShowAuth] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const [regForm, setRegForm] = useState<RegForm>({
    name: '',
    email: '',
    password: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    subscribe: false,
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await fetch('http://localhost:3001/api/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            handleLogout();
            toast.error('Session expired, please log in again.');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
            return;
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        handleLogout();
        toast.error('Session expired, please log in again.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        
        toast.success(`${t('welcome')} ${data.user?.name || email.split('@')[0]}!`);
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowAuth(false);
        setEmail('');
        setPassword('');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login error');
      }
    } catch (error) {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regForm.name,
          email: regForm.email,
          password: regForm.password,
          address: {
            street: regForm.address,
            city: regForm.city,
            zipCode: regForm.zipCode,
            country: regForm.country,
          },
          subscribe: regForm.subscribe,
        }),
      });

      if (response.ok) {
        toast.success(`Welcome ${regForm.name}, account created!`);
        setSuccess('Registration successful! You can now log in.');
        setRegForm({
          name: '',
          email: '',
          password: '',
          address: '',
          city: '',
          zipCode: '',
          country: '',
          subscribe: false,
        });

        setTimeout(() => {
          setIsLoginMode(true);
          setSuccess(null);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed');
      }
    } catch (error) {
      setError('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    clearCart(); // Clear the cart when logging out
    toast.success(t('logout_success'));
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    // No page reload
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { level: 'Very weak', color: 'bg-red-400' };
    if (!/\d/.test(password) || !/[A-Z]/.test(password)) return { level: 'Weak', color: 'bg-yellow-400' };
    if (password.length < 8) return { level: 'Medium', color: 'bg-blue-400' };
    return { level: 'Strong', color: 'bg-green-400' };
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getRegInputClass = (field: string) => {
    const base = 'w-full px-4 py-3 bg-white text-gray-800 rounded-xl border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400';
    let isValid = false;
    switch (field) {
      case 'name':
        isValid = regForm.name.trim().length > 0;
        break;
      case 'email':
        isValid = isValidEmail(regForm.email);
        break;
      case 'password':
        isValid = regForm.password.length >= 6;
        break;
      case 'address':
        isValid = regForm.address.trim().length > 0;
        break;
      case 'city':
        isValid = regForm.city.trim().length > 0;
        break;
      case 'zipCode':
        isValid = regForm.zipCode.trim().length > 0;
        break;
      case 'country':
        isValid = regForm.country.trim().length > 0;
        break;
      default:
        isValid = false;
    }
    return isValid ? `${base} border-green-500` : `${base} border-gray-300`;
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setRegForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setRegForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
  };

  const regPasswordStrength = getPasswordStrength(regForm.password);

  if (isAuthLoading) {
    return (
      <header className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-2xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {currentLogo ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
                  <img src={currentLogo} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 bg-white/10"
                  style={{ backgroundColor: '#8B5CF6' }}
                >
                  E
                </div>
              )}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
                {invoiceSettings.companyName}
              </h1>
            </div>
            <div className="flex items-center space-x-8">
              <div className="animate-pulse">{t('loading')}</div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-2xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-3 hover:scale-105 transition-transform">
            {currentLogo ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20 bg-white/10">
                <img src={currentLogo} alt="Company Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 bg-white/10"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                E
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
                {invoiceSettings.companyName}
              </h1>
              {invoiceSettings.companyTagline && (
                <p className="text-xs text-white/80 -mt-1">
                  {invoiceSettings.companyTagline}
                </p>
              )}
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Cart */}
            <Link 
              href="/cart" 
              className="relative group flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl hover:bg-white/25 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <span className="text-xl">🛒</span>
              <span className="text-white font-medium">{t('cart')}</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Section */}
            {!user ? (
              <button 
                onClick={() => setShowAuth(true)} 
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg font-medium"
              >
                <span className="text-lg">🔐</span>
                {t('login')}
              </button>
            ) : (
              <div className="relative">
                {/* User Menu Button */}
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl hover:bg-white/25 transition-all duration-300 shadow-lg"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{user.name}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    
                    <div className="py-2">
                      {user.role === 'ADMIN' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-yellow-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="text-lg">🛠️</span>
                          <span className="font-medium">{t('admin_dashboard')}</span>
                        </Link>
                      )}
                      
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="text-lg">👤</span>
                        <span>{t('my_profile')}</span>
                      </Link>
                      
                      <hr className="my-2" />
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span className="text-lg">🚪</span>
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      <AuthModal
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        isLoginMode={isLoginMode}
        setIsLoginMode={setIsLoginMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        regForm={regForm}
        setRegForm={setRegForm}
        loading={loading}
        error={error}
        success={success}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleRegChange={handleRegChange}
        switchMode={switchMode}
        regPasswordStrength={regPasswordStrength}
      />
          </header>
  );
};

export default Header;