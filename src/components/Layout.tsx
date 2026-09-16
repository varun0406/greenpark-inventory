import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  BarChart3, 
  AlertTriangle,
  Scan,
  Home,
  Moon,
  Sun,
  Menu,
  X,
  MapPin,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'STAFF'] },
    { path: '/products', icon: Package, label: 'Products', roles: ['ADMIN', 'STAFF'] },
    { path: '/godowns', icon: MapPin, label: 'Godowns', roles: ['ADMIN', 'STAFF'] },
    { path: '/scanner', icon: Scan, label: 'Scanner', roles: ['ADMIN', 'STAFF'] },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts', roles: ['ADMIN', 'STAFF'] },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(user?.role || 'STAFF'));

  const pageVariants = {
    initial: { opacity: 0, y: 15, scale: 0.99 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -15, scale: 1.01 }
  };

  return (
    <div className="min-h-screen bg-awwwards-light text-awwwards-text transition-colors duration-300 flex overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-awwwards-primary rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-awwwards-secondary rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
      
      {/* Desktop Sidebar (Glassmorphism) */}
      <nav className="hidden lg:flex flex-col w-72 glass-panel border-y-0 border-l-0 border-r border-awwwards-border min-h-screen z-10 relative">
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-awwwards-primary to-awwwards-secondary rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.3)]">
              <Package size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-awwwards-text">
              Greenpart <span className="text-transparent bg-clip-text bg-gradient-to-r from-awwwards-primary to-awwwards-secondary">Auto</span>
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1 scrollbar-hide">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path}>
                <div className={`relative flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? 'text-awwwards-primary font-semibold' : 'text-awwwards-textMuted hover:text-awwwards-primary'}`}>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBackground"
                      className="absolute inset-0 bg-gradient-to-r from-awwwards-primary/10 to-transparent rounded-2xl -z-10 border-l-[3px] border-awwwards-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={22} className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_4px_8px_rgba(99,102,241,0.3)]' : 'group-hover:scale-110'}`} />
                  <span className="tracking-wide">{label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 mt-auto border-t border-awwwards-border">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-awwwards-primary to-awwwards-secondary flex items-center justify-center text-white font-bold shadow-[0_4px_10px_rgba(99,102,241,0.3)] shrink-0">
                {user?.name?.charAt(0) || <UserIcon size={20} />}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-awwwards-text truncate">{user?.name || 'Staff Member'}</p>
                <p className="text-xs text-awwwards-textMuted font-medium tracking-wider uppercase truncate">{user?.role || 'STAFF'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-gray-100/80 hover:bg-gray-200 transition-colors text-awwwards-textMuted"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-awwwards-light/80 backdrop-blur-2xl border-b border-awwwards-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-awwwards-primary to-awwwards-secondary rounded-lg flex items-center justify-center shadow-[0_4px_10px_rgba(99,102,241,0.3)]">
              <Package size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-awwwards-text">Greenpart</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-gray-100/80 text-awwwards-textMuted"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-md pt-16"
          >
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="glass-panel m-4 rounded-3xl p-4"
            >
              <div className="space-y-1 mb-4">
                {navItems.map(({ path, icon: Icon, label }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link key={path} to={path} onClick={() => setIsMobileMenuOpen(false)}>
                      <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${isActive ? 'bg-gradient-to-r from-awwwards-primary/10 to-transparent text-awwwards-primary font-semibold border-l-2 border-awwwards-primary' : 'text-awwwards-textMuted'}`}>
                        <Icon size={20} className={isActive ? 'text-awwwards-primary' : ''} />
                        <span>{label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="flex space-x-2 border-t border-awwwards-border pt-4">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center py-3 rounded-xl bg-gray-100/80 text-awwwards-textMuted hover:bg-gray-200"
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={logout}
                  className="flex-1 flex items-center justify-center py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 w-full lg:w-auto relative pt-16 lg:pt-0 overflow-y-auto overflow-x-hidden">
        {/* Animated Page Transitions */}
        <AnimatePresence mode="wait">
          <motion.main 
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ type: 'tween', ease: 'anticipate', duration: 0.4 } as any}
            className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      
    </div>
  );
};

export default Layout;