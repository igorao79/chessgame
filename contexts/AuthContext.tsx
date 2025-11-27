'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, User, AuthState, ID } from '@/lib/appwrite';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Проверка текущей сессии при загрузке
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const session = await account.get();
        setAuthState({
          user: {
            $id: session.$id,
            email: session.email,
            name: session.name || session.email.split('@')[0],
            avatar: session.prefs?.avatar,
          },
          isLoading: false,
          isAuthenticated: true,
        });
        console.log('✅ Пользователь авторизован:', session.email);
      } catch (error: any) {
        // 401 - пользователь не авторизован, это нормально
        if (error.code === 401) {
          console.log('ℹ️ Пользователь не авторизован');
        } else {
          console.error('❌ Ошибка проверки авторизации:', error);
        }
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    checkAuthState();
  }, []);

  // Регистрация нового пользователя
  const register = async (name: string, email: string, password: string) => {
    try {
      // Валидация данных
      if (!name || name.trim().length < 2) {
        throw new Error('Имя должно содержать минимум 2 символа');
      }
      if (!email || !email.includes('@')) {
        throw new Error('Введите корректный email');
      }
      if (!password || password.length < 8) {
        throw new Error('Пароль должен содержать минимум 8 символов');
      }

      setAuthState(prev => ({ ...prev, isLoading: true }));

      console.log('📝 Попытка регистрации:', { name, email, password: '***' });

      // Пробуем создать аккаунт
      const user = await account.create(ID.unique(), email, password, name);
      console.log('✅ Аккаунт создан:', user.email);

      // Создаем сессию для автоматического входа
      const session = await account.createEmailPasswordSession(email, password);
      const userData = await account.get();

      setAuthState({
        user: {
          $id: userData.$id,
          email: userData.email,
          name: userData.name || name || userData.email.split('@')[0],
          avatar: userData.prefs?.avatar,
        },
        isLoading: false,
        isAuthenticated: true,
      });

      console.log('✅ Регистрация и вход выполнены:', userData.email);

    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));

      console.error('❌ Ошибка регистрации:', error);

      // Обработка специфичных ошибок Appwrite
      if (error.code === 409) {
        throw new Error('Пользователь с таким email уже существует');
      } else if (error.code === 400) {
        throw new Error(`Неверные данные: ${error.message || 'Проверьте email и пароль'}`);
      } else if (error.code === 401) {
        throw new Error('Неверный пароль');
      } else {
        throw new Error(error.message || 'Ошибка регистрации');
      }
    }
  };

  // Вход в систему
  const login = async (email: string, password: string) => {
    try {
      // Валидация данных
      if (!email || !email.includes('@')) {
        throw new Error('Введите корректный email');
      }
      if (!password || password.length < 1) {
        throw new Error('Введите пароль');
      }

      setAuthState(prev => ({ ...prev, isLoading: true }));

      console.log('🔑 Попытка входа:', { email, password: '***' });

      const session = await account.createEmailPasswordSession(email, password);
      const userData = await account.get();

      setAuthState({
        user: {
          $id: userData.$id,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          avatar: userData.prefs?.avatar,
        },
        isLoading: false,
        isAuthenticated: true,
      });

      console.log('✅ Вход выполнен:', userData.email);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));

      // Обработка специфичных ошибок Appwrite
      if (error.code === 401) {
        throw new Error('Неверный email или пароль');
      } else if (error.code === 429) {
        throw new Error('Слишком много попыток входа. Попробуйте позже');
      } else {
        throw new Error(error.message || 'Ошибка входа');
      }
    }
  };

  // Выход из системы
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error: any) {
      console.error('Ошибка выхода:', error);
    }
  };

  // Обновление профиля
  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!authState.user) throw new Error('Пользователь не авторизован');

      const updatedPrefs = { ...updates };
      await account.updatePrefs(updatedPrefs);

      // Обновляем локальное состояние
      const updatedUser = await account.get();
      setAuthState(prev => ({
        ...prev,
        user: {
          $id: updatedUser.$id,
          email: updatedUser.email,
          name: updatedUser.name || updatedUser.email.split('@')[0],
          avatar: updatedUser.prefs?.avatar,
        },
      }));
    } catch (error: any) {
      throw new Error(error.message || 'Ошибка обновления профиля');
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
