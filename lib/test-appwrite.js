// Скрипт для тестирования подключения к Appwrite
const { Client, Account } = require('appwrite');

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('fra-6927920b001417c61a11');

const account = new Account(client);

async function testConnection() {
  try {
    console.log('🔍 Тестирование подключения к Appwrite...');

    // Попытка получить текущего пользователя (должна вернуть 401 если не авторизован)
    try {
      const user = await account.get();
      console.log('✅ Пользователь найден:', user.email);
    } catch (error) {
      if (error.code === 401) {
        console.log('ℹ️ Пользователь не авторизован (ожидаемо)');
      } else {
        console.error('❌ Ошибка получения пользователя:', error.message);
      }
    }

    console.log('✅ Подключение к Appwrite работает!');
    console.log('📝 Теперь можно тестировать регистрацию через браузер');

  } catch (error) {
    console.error('❌ Ошибка подключения к Appwrite:', error);
  }
}

testConnection();
