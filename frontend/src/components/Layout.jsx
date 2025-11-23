import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bot, Moon, Sun, Menu, X, User, LogOut, MessageSquare, Phone, Mail, Activity, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sidebar configuration: single array, sorted per section by label
  const sidebarItems = [
    { section: 'Build', label: 'All Agent', path: '/dashboard', icon: Bot, activeMatch: '/dashboard' },
    { section: 'Build', label: 'Phone Number', path: '/dashboard/phone-numbers', icon: Phone, activeMatch: '/dashboard/phone-numbers' },
    { section: 'Email Marketing', label: 'Email Dashboard', path: '/dashboard/email', icon: Mail, activeMatch: '/dashboard/email' },
    { section: 'Email Marketing', label: 'Campaigns', path: '/dashboard/email/campaigns', icon: Activity, activeMatch: '/dashboard/email/campaigns' },
    { section: 'Email Marketing', label: 'Contacts', path: '/dashboard/email/contacts', icon: User, activeMatch: '/dashboard/email/contacts' },
    { section: 'Email Marketing', label: 'Templates', path: '/dashboard/email/templates', icon: MessageSquare, activeMatch: '/dashboard/email/templates' },
    { section: 'Monitor', label: 'Call History', href: '#', icon: Phone },
    { section: 'Monitor', label: 'Chat History', href: '#', icon: MessageSquare },
    { section: 'Monitor', label: 'Analytics', href: '#', icon: Activity },
    { section: 'Billing', label: 'Billing', href: '#', icon: CreditCard },
  ];

  const sectionsOrder = ['Build', 'Email Marketing', 'Monitor', 'Billing'];
  const groupedSidebar = sectionsOrder.map((title) => ({
    title,
    items: sidebarItems
      .filter((i) => i.section === title)
      .sort((a, b) => a.label.localeCompare(b.label)),
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-gray-800/50" style={{ fontFamily: 'var(--brand-typo_font-family--secondary_regular)' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-brand-primary to-brand-sky p-2 rounded-xl"
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-sky bg-clip-text text-transparent">
                AI Agent Platform
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard'
                    ? 'text-brand-primary dark:text-brand-light'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/agent/new"
                className="btn-primary"
              >
                Create Agent
              </Link>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-brand-primary to-brand-sky rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || 'User'}
                  </span>
                </button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800"
            >
              <div className="container mx-auto px-4 py-4 space-y-3">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/agent/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block btn-primary text-center"
                >
                  Create Agent
                </Link>
                <button
                  onClick={() => {
                    setDarkMode(!darkMode);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>Toggle Theme</span>
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                {/* Mobile User Menu */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content with Sidebar */}
      <div className=" mx-auto mt-8 mb-8 min-h-[calc(100vh-8rem)]">
        <div className="flex gap-6 items-stretch">
          {/* Sidebar (desktop) */}
          <aside className="hidden md:block w-64  shrink-0 md:sticky md:top-24 md:h-[calc(100vh-8rem)] text-base font-semibold" style={{ fontFamily: 'var(--brand-typo_font-family--secondary_regular)' }}>
            <div className="bg-brand-white dark:bg-gray-800 h-full overflow-y-auto rounded-2xl p-4 border border-brand-surface dark:border-gray-700 shadow-lg">
              {groupedSidebar.map((section) => (
                <div key={section.title} className="mb-6 last:mb-0">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">{section.title}</h3>
                  <nav className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      // Fix: Only one item should be active at a time
                      // Find the most specific matching item first
                      const currentPath = location.pathname;
                      let isActive = false;

                      if (item.path) {
                        const matchPath = item.activeMatch || item.path;

                        // Find all items that match the current path
                        const matchingItems = sidebarItems
                          .filter(i => i.path && currentPath.startsWith(i.activeMatch || i.path))
                          .map(i => ({
                            item: i,
                            matchLength: (i.activeMatch || i.path || '').length
                          }))
                          .sort((a, b) => b.matchLength - a.matchLength); // Most specific first

                        // Only the most specific match should be active
                        if (matchingItems.length > 0) {
                          const mostSpecific = matchingItems[0].item;
                          const mostSpecificMatch = mostSpecific.activeMatch || mostSpecific.path;
                          isActive = matchPath === mostSpecificMatch;
                        }
                      }
                      const base = 'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors';
                      const active = isActive ? ' bg-brand-primary/20 text-brand-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-brand-primary/10 hover:text-brand-primary';
                      if (item.path) {
                        return (
                          <Link key={item.label} to={item.path} className={`${base} ${active}`} >
                            <Icon className="w-4 h-4" />
                            <span className=' text-gray-800 text-bold'>{item.label}</span>
                          </Link>
                        );
                      }
                      return (
                        <a key={item.label} href="#" className={`${base}   dark:text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10`}>
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </aside>

          {/* Main area */}
          <main className="flex-1 min-h-[calc(100vh-8rem)] overflow-y-auto mr-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* No footer on dashboard pages */}
    </div>
  );
};

export default Layout;

