'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import ThemeToggle from './ThemeToggle';

export default function UserProfile() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Автоматически закрываем модальное окно при успешной аутентификации
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, showAuthModal]);

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

  // Фиксированная высота для всех состояний
  const containerClasses = "flex items-center justify-end space-x-3 min-h-[48px]";

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
        <div className="flex flex-col space-y-1">
          <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-20 h-3 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className={containerClasses}>
          {/* Переключатель темы интерфейса */}
          <ThemeToggle />

          <button
            onClick={handleLogin}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer text-sm"
          >
            Войти
          </button>
          <button
            onClick={handleRegister}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer text-sm"
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
    <div className={containerClasses}>
      {/* Переключатель темы интерфейса */}
      <ThemeToggle />

      {/* Аватар пользователя */}
      <div className="w-8 h-8 theme-button-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </div>

      {/* Информация о пользователе */}
      <div className="flex flex-col">
        <span className="text-sm font-medium theme-text-primary">
          {user?.name || 'Пользователь'}
        </span>
        <span className="text-xs theme-text-muted">
          {user?.email}
        </span>
      </div>

      {/* Кнопка выхода */}
      <button
        onClick={handleLogout}
        className="px-2 py-1 text-xs theme-button-danger rounded transition-colors cursor-pointer"
      >
        Выйти
      </button>
    </div>
  );
}
