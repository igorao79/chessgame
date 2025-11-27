import { Client, Account, Databases, ID } from 'appwrite';

// Appwrite конфигурация (новая версия с Tables)
export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6927920b001417c61a11',
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '312313123213123',
  usersTableId: process.env.NEXT_PUBLIC_APPWRITE_USERS_TABLE_ID || 'users',
};

// Инициализация клиента
const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// Сервисы
export const account = new Account(client);
export const databases = new Databases(client);

// Вспомогательные функции
export { ID };

// Типы
export interface User {
  $id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
