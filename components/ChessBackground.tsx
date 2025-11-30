'use client';

import React, { useEffect, useRef } from 'react';

interface ChessPiece {
  id: string;
  piece: string;
  position: { x: number; y: number };
  target?: { x: number; y: number };
  speed: number; // оставляем для совместимости, но не используем
  waitTime?: number;
}

export function ChessBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const piecesRef = useRef<ChessPiece[]>([]);

  // Unicode символы шахматных фигур
  const PIECE_SYMBOLS: Record<string, string> = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
  };

  // Создаем начальные фигуры
  const createInitialPieces = (): ChessPiece[] => {
    const pieces: ChessPiece[] = [];

    // Белые фигуры (нижняя часть доски) - появляются моментально
    pieces.push(
      { id: 'wR1', piece: 'wR', position: { x: 0, y: 7 }, speed: 0, waitTime: 0 },
      { id: 'wN1', piece: 'wN', position: { x: 1, y: 7 }, speed: 0, waitTime: 0 },
      { id: 'wB1', piece: 'wB', position: { x: 2, y: 7 }, speed: 0, waitTime: 0 },
      { id: 'wQ', piece: 'wQ', position: { x: 3, y: 7 }, speed: 0, waitTime: 0 },
      { id: 'wK', piece: 'wK', position: { x: 4, y: 7 }, speed: 0, waitTime: 0 },
      { id: 'wB2', piece: 'wB', position: { x: 5, y: 7 }, speed: 0, waitTime: 0 },
      { id: 'wN2', piece: 'wN', position: { x: 6, y: 7 }, speed: 0, waitTime: 0 },
      { id: 'wR2', piece: 'wR', position: { x: 7, y: 7 }, speed: 0, waitTime: 0 }
    );

    // Белые пешки - появляются моментально
    for (let i = 0; i < 8; i++) {
      pieces.push({
        id: `wP${i}`,
        piece: 'wP',
        position: { x: i, y: 6 },
        speed: 0,
        waitTime: 0
      });
    }

    // Черные фигуры (верхняя часть доски) - появляются моментально
    pieces.push(
      { id: 'bR1', piece: 'bR', position: { x: 0, y: 0 }, speed: 0, waitTime: 0 },
      { id: 'bN1', piece: 'bN', position: { x: 1, y: 0 }, speed: 0, waitTime: 0 },
      { id: 'bB1', piece: 'bB', position: { x: 2, y: 0 }, speed: 0, waitTime: 0 },
      { id: 'bQ', piece: 'bQ', position: { x: 3, y: 0 }, speed: 0, waitTime: 0 },
      { id: 'bK', piece: 'bK', position: { x: 4, y: 0 }, speed: 0, waitTime: 0 },
      { id: 'bB2', piece: 'bB', position: { x: 5, y: 0 }, speed: 0, waitTime: 0 },
      { id: 'bN2', piece: 'bN', position: { x: 6, y: 0 }, speed: 0, waitTime: 0 },
      { id: 'bR2', piece: 'bR', position: { x: 7, y: 0 }, speed: 0, waitTime: 0 }
    );

    // Черные пешки - появляются моментально
    for (let i = 0; i < 8; i++) {
      pieces.push({
        id: `bP${i}`,
        piece: 'bP',
        position: { x: i, y: 1 },
        speed: 0,
        waitTime: 0
      });
    }

    return pieces;
  };

  // Проверка коллизии с другими фигурами
  const isCellOccupied = (x: number, y: number, excludePieceId?: string) => {
    return piecesRef.current.some(piece =>
      piece.id !== excludePieceId &&
      Math.round(piece.position.x) === x &&
      Math.round(piece.position.y) === y
    );
  };

  // Обновление позиции фигуры
  const updatePiecePosition = (piece: ChessPiece) => {
    // Если фигура движется к цели
    if (piece.target && (piece.position.x !== piece.target.x || piece.position.y !== piece.target.y)) {
      // Проверяем, не занята ли целевая клетка другой фигурой прямо сейчас
      const targetOccupied = piece.target ? isCellOccupied(piece.target.x, piece.target.y, piece.id) : false;

      if (targetOccupied) {
        // Клетка занята! Отменяем ход и ищем новую цель
        piece.target = undefined;
        piece.waitTime = 250; // Подождем немного перед следующим ходом
        return;
      }

      // Плавное движение к цели
      const dx = piece.target.x - piece.position.x;
      const dy = piece.target.y - piece.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 0.02) {
        // Почти достигли цели - финальное позиционирование
        if (piece.target) {
          piece.position.x = piece.target.x;
          piece.position.y = piece.target.y;
          piece.target = undefined;
        }
        piece.waitTime = 0;
      } else {
        // Продолжаем движение (очень медленно)
        const speed = 0.004; // Еще медленнее для плавности
        piece.position.x += (dx / distance) * speed;
        piece.position.y += (dy / distance) * speed;
      }
    } else {
      // Ждем в текущей клетке
      if (!piece.waitTime) {
        piece.waitTime = 0;
      }

      piece.waitTime++;

      // Каждые 180 кадров (около 3 секунд) пытаемся сделать ход
      if (piece.waitTime >= 180) {
        // Выбираем направление (только горизонтально или вертикально)
        const directions = [
          { x: 0, y: 1 },   // вверх
          { x: 0, y: -1 },  // вниз
          { x: 1, y: 0 },   // вправо
          { x: -1, y: 0 }   // влево
        ];

        // Пробуем несколько случайных направлений, пока не найдем свободную клетку
        let attempts = 0;
        let foundMove = false;

        while (attempts < 15 && !foundMove) { // Увеличиваем количество попыток
          const direction = directions[Math.floor(Math.random() * directions.length)];
          const steps = Math.floor(Math.random() * 2) + 1; // 1-2 клетки

          const newX = Math.max(0, Math.min(7, Math.round(piece.position.x) + direction.x * steps));
          const newY = Math.max(0, Math.min(7, Math.round(piece.position.y) + direction.y * steps));

          // Проверяем, свободна ли клетка И нет ли других фигур, которые уже идут туда
          const cellFree = !isCellOccupied(newX, newY, piece.id);
          const noOneGoingThere = !piecesRef.current.some(p =>
            p.id !== piece.id &&
            p.target &&
            p.target.x !== undefined &&
            p.target.y !== undefined &&
            Math.round(p.target.x) === newX &&
            Math.round(p.target.y) === newY
          );

          if (cellFree && noOneGoingThere) {
            piece.target = { x: newX, y: newY };
            piece.waitTime = 0;
            foundMove = true;
          }
          attempts++;
        }

        // Если не нашли ход, просто сбрасываем таймер
        if (!foundMove) {
          piece.waitTime = 120; // Попробуем снова через 2 секунды
        }
      }
    }
  };

  // Отрисовка доски
  const drawBoard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Рассчитываем размер квадрата для полного покрытия экрана
    const squareSizeX = width / 8;
    const squareSizeY = height / 8;
    const squareSize = Math.max(squareSizeX, squareSizeY); // Используем больший размер для полного покрытия

    // Центрируем доску, но позволяем ей выходить за границы экрана
    const boardWidth = squareSize * 8;
    const boardHeight = squareSize * 8;
    const offsetX = (width - boardWidth) / 2;
    const offsetY = (height - boardHeight) / 2;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(offsetX + col * squareSize, offsetY + row * squareSize, squareSize, squareSize);
      }
    }
  };

  // Отрисовка фигур
  const drawPieces = (ctx: CanvasRenderingContext2D, squareSize: number, width: number, height: number) => {
    // Используем тот же расчет, что и в drawBoard
    const squareSizeX = width / 8;
    const squareSizeY = height / 8;
    const actualSquareSize = Math.max(squareSizeX, squareSizeY);
    const boardWidth = actualSquareSize * 8;
    const boardHeight = actualSquareSize * 8;
    const offsetX = (width - boardWidth) / 2;
    const offsetY = (height - boardHeight) / 2;

    piecesRef.current.forEach(piece => {
      const x = offsetX + piece.position.x * actualSquareSize + actualSquareSize / 2;
      const y = offsetY + piece.position.y * actualSquareSize + actualSquareSize / 2 + 30; // Максимально низко в клетке

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.9, 0.9);

      // Тень
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.font = `${actualSquareSize * 1.2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PIECE_SYMBOLS[piece.piece] || '♟', 3, 3);

      // Фигура
      ctx.fillStyle = piece.piece.startsWith('w') ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.9)';
      ctx.fillText(PIECE_SYMBOLS[piece.piece] || '♟', 0, 0);

      ctx.restore();
    });
  };

  // Основной цикл анимации
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const displayWidth = canvas.width / window.devicePixelRatio;
    const displayHeight = canvas.height / window.devicePixelRatio;

    // Рисуем доску (передаем размеры без devicePixelRatio)
    drawBoard(ctx, displayWidth, displayHeight);

    // Обновляем позиции фигур
    piecesRef.current.forEach(updatePiecePosition);

    // Рисуем фигуры
    drawPieces(ctx, 0, displayWidth, displayHeight); // squareSize теперь рассчитывается внутри функции

    animationRef.current = requestAnimationFrame(animate);
  };

  // Инициализация
  useEffect(() => {
    piecesRef.current = createInitialPieces();

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Устанавливаем размеры canvas на всю страницу
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-screen h-screen pointer-events-none z-0 opacity-20"
      style={{ background: 'transparent' }}
    />
  );
}
