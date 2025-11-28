'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Убеждаемся, что компонент смонтирован перед рендерингом портала
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Управление скроллом body и backdrop-filter
  useEffect(() => {
    if (isOpen) {
      // Отключаем скролл и добавляем backdrop-filter
      document.body.style.overflow = 'hidden';
      document.body.style.backdropFilter = 'blur(2px) brightness(0.95)';
      document.documentElement.style.overflow = 'hidden'; // Для некоторых браузеров
    } else {
      // Восстанавливаем скролл
      document.body.style.overflow = '';
      document.body.style.backdropFilter = '';
      document.documentElement.style.overflow = '';
    }

    // Очистка при размонтировании
    return () => {
      document.body.style.overflow = '';
      document.body.style.backdropFilter = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
        if (formData.password.length < 6) {
          throw new Error('Пароль должен содержать минимум 6 символов');
        }
        await register(formData.name, formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }

      // Небольшая задержка перед закрытием, чтобы показать успех
      setTimeout(() => {
        onClose();

        // Очищаем форму после успешного входа/регистрации
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
      }, 500);

    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const modalContent = (
    <div
      className="fixed inset-0 theme-modal-overlay backdrop-blur-md flex items-center justify-center z-50"
      onClick={(e) => {
        // Закрываем модальное окно при клике на overlay (но не на контент)
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="theme-bg-primary border-2 theme-border-primary rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold theme-text-primary">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h2>
          <button
            onClick={onClose}
            className="theme-text-muted hover:theme-text-secondary text-2xl transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-1">
                Никнейм
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 theme-bg-secondary theme-border-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 theme-text-primary"
                placeholder="Ваш никнейм"
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium theme-text-primary mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 theme-bg-secondary theme-border-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 theme-text-primary"
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium theme-text-primary mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-3 py-2 theme-bg-secondary theme-border-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 theme-text-primary"
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-1">
                Подтверждение пароля
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 theme-bg-secondary theme-border-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 theme-text-primary"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
              {error.includes('регистрации') && (
                <div className="mt-2 text-xs text-red-600">
                  💡 Если регистрация не работает, создайте аккаунт вручную в{' '}
                  <a
                    href="https://fra.cloud.appwrite.io/console/project-fra-6927920b001417c61a11/auth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Appwrite консоли
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full theme-button-primary py-2 px-4 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
              setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
              });
            }}
            className="theme-text-accent hover:theme-text-primary text-sm transition-colors"
            disabled={isLoading}
          >
            {mode === 'login'
              ? 'Нет аккаунта? Зарегистрироваться'
              : 'Уже есть аккаунт? Войти'
            }
          </button>
        </div>
      </div>
    </div>
  );

  // Используем React Portal для рендеринга модального окна поверх всего приложения
  return createPortal(modalContent, document.body);
}
