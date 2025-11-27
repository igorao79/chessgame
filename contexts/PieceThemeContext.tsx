'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PieceTheme = 'alpha' | 'wikipedia';

export interface PieceThemeConfig {
  name: string;
  sources: string[];
}

const PIECE_THEMES: Record<PieceTheme, PieceThemeConfig> = {
  alpha: {
    name: 'Alpha',
    sources: [
      'https://chessboardjs.com/img/chesspieces/alpha/{piece}.png'
    ]
  },
  wikipedia: {
    name: 'Wikipedia',
    sources: [
      'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    ]
  }
};

interface PieceThemeContextType {
  currentTheme: PieceTheme;
  setTheme: (theme: PieceTheme) => void;
  themes: Record<PieceTheme, PieceThemeConfig>;
  getPieceUrl: (piece: string) => string;
}

const PieceThemeContext = createContext<PieceThemeContextType | undefined>(undefined);

export function PieceThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<PieceTheme>('alpha');

  useEffect(() => {
    const savedTheme = localStorage.getItem('chess-piece-theme') as PieceTheme;
    if (savedTheme && PIECE_THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: PieceTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('chess-piece-theme', theme);
  };

  const getPieceUrl = (piece: string): string => {
    const theme = PIECE_THEMES[currentTheme];
    if (!theme) return '';

    // Сначала пробуем внешние источники
    return theme.sources[0].replace('{piece}', piece);
  };

  return (
    <PieceThemeContext.Provider value={{
      currentTheme,
      setTheme,
      themes: PIECE_THEMES,
      getPieceUrl
    }}>
      {children}
    </PieceThemeContext.Provider>
  );
}

export function usePieceTheme() {
  const context = useContext(PieceThemeContext);
  if (context === undefined) {
    throw new Error('usePieceTheme must be used within a PieceThemeProvider');
  }
  return context;
}
