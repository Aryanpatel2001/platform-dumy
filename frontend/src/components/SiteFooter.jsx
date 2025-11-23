import { Link } from 'react-router-dom';
import { Bot, Mail } from 'lucide-react';

const SiteFooter = ({ className = '' }) => {
  return (
    <footer className={`border-t border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-brand-primary to-brand-sky p-2 rounded-xl">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-brand-primary to-brand-sky bg-clip-text text-transparent">
              AI Agent Platform
            </span>
          </div>

          <nav className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-primary">Documentation</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-primary">API Reference</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-primary">Support</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-primary">Privacy</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-brand-primary">Terms</a>
            <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-brand-primary">Sign In</Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} AI Agent Platform. Built with ❤️</p>
          <a href="mailto:support@example.com" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-brand-primary">
            <Mail className="w-4 h-4 mr-2" /> support@example.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;