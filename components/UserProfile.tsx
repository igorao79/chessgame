'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import ThemeToggle from './ThemeToggle';

export default function UserProfile() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Войти
          </button>
          <button
            onClick={handleRegister}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Регистрация
          </button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Переключатель темы */}
      <ThemeToggle />

      {/* Аватар пользователя */}
      <div className="w-10 h-10 theme-button-primary rounded-full flex items-center justify-center text-white font-bold">
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </div>

      {/* Информация о пользователе */}
      <div className="flex flex-col">
        <span className="font-medium theme-text-primary">
          {user?.name || 'Пользователь'}
        </span>
        <span className="text-sm theme-text-muted">
          {user?.email}
        </span>
      </div>

      {/* Кнопка выхода */}
      <button
        onClick={handleLogout}
        className="px-3 py-1 text-sm theme-button-danger rounded transition-colors"
      >
        Выйти
      </button>
    </div>
  );
}
