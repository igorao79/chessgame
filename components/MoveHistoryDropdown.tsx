'use client';

import { useGame } from '@/contexts/GameContext';
import { useRef, useEffect } from 'react';

interface MoveHistoryDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function MoveHistoryDropdown({ isOpen, onToggle, triggerRef }: MoveHistoryDropdownProps) {
  const { gameState } = useGame();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle, triggerRef]);

  if (!gameState) return null;

  return (
    <>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-0 right-0 z-50 w-64 max-h-96 theme-bg-primary rounded-lg shadow-xl theme-border-secondary border overflow-hidden"
          style={{
            transform: 'translateX(calc(100% + 8px))',
            marginTop: '0'
          }}
        >
          {/* Заголовок */}
          <div className="theme-bg-secondary px-4 py-3 theme-border-secondary border-b">
            <h3 className="text-sm font-semibold theme-text-primary text-center">
              История ходов ({gameState.moves.length})
            </h3>
          </div>

          {/* Содержимое */}
          <div className="max-h-80 overflow-y-auto p-3">
            {gameState.moves.length === 0 ? (
              <p className="text-center theme-text-muted text-sm py-4">
                Ходы еще не сделаны
              </p>
            ) : (
              <div className="space-y-1">
                {gameState.moves.map((move, index) => (
                  <div
                    key={index}
                    className="text-sm theme-text-primary text-center py-1 px-2 rounded hover:theme-bg-secondary transition-colors"
                  >
                    {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
