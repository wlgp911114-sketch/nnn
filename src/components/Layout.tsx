import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { LogIn, LogOut, LayoutDashboard, Home, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, isAdmin, login, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const navItems = [
    { name: '홈', path: '/', icon: Home },
    { name: 'OX 퀴즈', path: '/quiz', icon: CheckCircle },
  ];

  if (isAdmin) {
    navItems.push({ name: '관리자', path: '/admin', icon: LayoutDashboard });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: settings.backgroundColor, fontFamily: settings.fontFamily }}>
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold" style={{ color: settings.primaryColor }}>
                {settings.siteName}
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-yellow-400 ${
                    location.pathname === item.path ? 'text-yellow-400' : 'text-gray-400'
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400 hidden sm:inline">{user.displayName}</span>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="로그아웃"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-black hover:bg-yellow-400 transition-colors"
                >
                  <LogIn size={16} />
                  <span>관리자 로그인</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="border-t border-white/10 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            © 2026 {settings.siteName}. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            본 사이트는 세계 금연의 날을 기념하여 강원금연지원센터에서 운영합니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
