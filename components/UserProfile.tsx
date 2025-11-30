'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import ThemeToggle from './ThemeToggle';
import { IoSettings } from 'react-icons/io5';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';

export default function UserProfile() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState(256);
  const [isMounted, setIsMounted] = useState(false);

  // Используем Floating UI для правильного позиционирования
  const { refs, floatingStyles, context } = useFloating({
    open: showDropdown,
    onOpenChange: setShowDropdown,
    middleware: [
      offset(8), // Отступ от кнопки
      flip(), // Переворот если не помещается
      shift({ padding: 8 }) // Сдвиг если вылезает за границы
    ],
    whileElementsMounted: autoUpdate, // Автоматическое обновление позиции
    strategy: 'fixed' // Фиксированное позиционирование для portal
  });

  // Устанавливаем mounted состояние и начальную ширину
  useEffect(() => {
    setIsMounted(true);
    // Устанавливаем ширину дропдауна в зависимости от размера экрана
    const updateWidth = () => {
      setDropdownWidth(window.innerWidth < 640 ? Math.min(window.innerWidth - 32, 240) : 256);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Автоматически закрываем модальное окно при успешной аутентификации
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated, showAuthModal]);

  // Закрываем дропдаун при клике вне него
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickOnButton = refs.reference.current && refs.reference.current.contains(target);
      const isClickOnDropdown = refs.floating.current && refs.floating.current.contains(target);

      if (!isClickOnButton && !isClickOnDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, refs]);

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
      setShowDropdown(false); // Закрываем дропдаун после выхода
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  // Адаптивные классы для мобильных устройств
  const containerClasses = "flex items-center justify-end space-x-2 md:space-x-3 min-h-[48px]";

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
            className="px-2 md:px-3 py-1 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer text-xs md:text-sm"
          >
            <span className="hidden sm:inline">Войти</span>
            <span className="sm:hidden">Вход</span>
          </button>
          <button
            onClick={handleRegister}
            className="px-2 md:px-3 py-1 md:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer text-xs md:text-sm"
          >
            <span className="hidden sm:inline">Регистрация</span>
            <span className="sm:hidden">Регистр</span>
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
      <div className="w-8 h-8 md:w-6 md:h-6 theme-button-primary rounded-full flex items-center justify-center text-white font-bold text-sm md:text-xs">
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </div>

      {/* Кнопка настроек с шестеренкой */}
      <button
        ref={refs.setReference}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className="p-2 md:p-1 rounded-lg theme-bg-tertiary theme-border-primary border hover:theme-bg-accent transition-colors cursor-pointer"
        title="Настройки аккаунта"
      >
        <IoSettings className="w-5 h-5 md:w-4 md:h-4 theme-text-secondary" />
      </button>

      {/* Дропдаун с информацией об аккаунте через портал */}
      {isMounted && showDropdown && createPortal(
        <div
          ref={refs.setFloating}
          className="theme-bg-primary glassmorphism-selector rounded-lg shadow-xl border theme-border-primary z-[9999] transform transition-all duration-200 ease-out opacity-100 scale-100 will-change-transform"
          style={{
            ...floatingStyles,
            width: `${dropdownWidth}px`,
            minWidth: '200px'
          }}
        >
          <div className="p-4">
            {/* Информация о пользователе */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 theme-button-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="font-medium theme-text-primary">
                  {user?.name || 'Пользователь'}
                </span>
                <span className="text-sm theme-text-muted">
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Кнопка выхода */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="w-full px-3 py-2 text-sm theme-button-danger rounded transition-colors cursor-pointer"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
