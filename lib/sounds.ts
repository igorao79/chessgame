// Утилита для проигрывания звуков в игре

export class SoundManager {
  private static instance: SoundManager;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.7;
  private enabled: boolean = true;

  private constructor() {
    // Предзагружаем звуки
    this.preloadSounds();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private preloadSounds() {
    const soundFiles = [
      { name: 'turn', path: '/sounds/turn.mp3' },
      { name: 'win', path: '/sounds/win.mp3' },
      { name: 'fail', path: '/sounds/fail.mp3' },
    ];

    soundFiles.forEach(({ name, path }) => {
      try {
        const audio = new Audio(path);
        audio.volume = this.volume;
        audio.preload = 'auto';
        
        // Обработка ошибок загрузки
        audio.addEventListener('error', () => {
          console.warn(`Не удалось загрузить звук: ${path}`);
        });

        this.sounds.set(name, audio);
      } catch (error) {
        console.warn(`Ошибка создания Audio для ${path}:`, error);
      }
    });
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private async playSound(name: string): Promise<void> {
    if (!this.enabled) return;

    const audio = this.sounds.get(name);
    if (!audio) {
      console.warn(`Звук не найден: ${name}`);
      return;
    }

    try {
      // Сбрасываем позицию воспроизведения
      audio.currentTime = 0;
      
      // Воспроизводим звук
      await audio.play();
    } catch (error) {
      // Игнорируем ошибки воспроизведения (могут быть из-за автоплея)
      console.warn(`Не удалось воспроизвести звук ${name}:`, error);
    }
  }

  // Звук хода (свой или противника)
  playTurn() {
    this.playSound('turn');
  }

  // Звук победы
  playWin() {
    this.playSound('win');
  }

  // Звук поражения
  playFail() {
    this.playSound('fail');
  }

  // Проверка доступности звуков
  checkSoundsAvailable(): boolean {
    return this.sounds.size > 0;
  }

  // Тестирование звука
  testSound(soundName: 'turn' | 'win' | 'fail') {
    this.playSound(soundName);
  }
}

// Экспорт singleton instance
export const soundManager = SoundManager.getInstance();

// Хуки для React компонентов
export function useSounds() {
  return {
    playTurn: () => soundManager.playTurn(),
    playWin: () => soundManager.playWin(),
    playFail: () => soundManager.playFail(),
    setVolume: (volume: number) => soundManager.setVolume(volume),
    setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
    testSound: (soundName: 'turn' | 'win' | 'fail') => soundManager.testSound(soundName),
  };
}

