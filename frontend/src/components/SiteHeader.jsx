import { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bot, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SiteHeader = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();


  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (isAuthenticated()) {
      navigate('/dashboard');
    } else {
      navigate('/register', { state: { backgroundLocation: location } });
    }
  };

  const NavLinks = () => (
    <>
      <a href="#demo" className="text-sm font-medium text-brand-dark dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-sky transition-colors">Demo</a>
      <a href="#features" className="text-sm font-medium text-brand-dark dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-sky transition-colors">Features</a>
      {!isAuthenticated() ? (
        <>
          <Link to="/login" state={{ backgroundLocation: location }} className="text-sm font-medium text-brand-dark dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-sky transition-colors">Login</Link>
        </>
      ) : (
        <>
        <button onClick={logout} className="btn-secondary ml-2">Logout</button>
        <Link onClick={handleRegisterClick} className="btn-primary">Get Started</Link>
        </>
      )}
    </>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={location.pathname.startsWith('/dashboard') ? '/dashboard' : '/'} className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-brand-primary to-brand-sky p-2 rounded-xl">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg md:text-xl font-bold text-brand-dark dark:text-brand-white">
              AI Agent Platform
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavLinks />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-3">
              <NavLinks />
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="mt-2 w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span>Toggle Theme</span>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;