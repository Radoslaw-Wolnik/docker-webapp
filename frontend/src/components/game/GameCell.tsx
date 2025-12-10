import React from 'react';
import { X, Circle } from 'lucide-react';
import type { GameCellProps } from '../../types';

const GameCell: React.FC<GameCellProps> = ({
  value,
  position,
  onClick,
  isWinning = false,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && value === null) {
      onClick(position);
    }
  };

  const getCellContent = () => {
    if (value === 'X') {
      return <X className="w-8 h-8 text-red-500" />;
    }
    if (value === 'O') {
      return <Circle className="w-8 h-8 text-blue-500" />;
    }
    return null;
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || value !== null}
      className={`
        w-20 h-20 md:w-24 md:h-24
        flex items-center justify-center
        bg-white border-2 border-gray-300
        hover:bg-gray-50 active:bg-gray-100
        transition-all duration-200
        ${isWinning ? 'bg-yellow-50 border-yellow-300' : ''}
        ${value === null && !disabled ? 'cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-50' : ''}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
        rounded-lg
      `}
      aria-label={`Cell ${position + 1}, ${value ? `contains ${value}` : 'empty'}`}
    >
      <div className={`
        ${value === 'X' ? 'animate-bounce' : ''}
        ${value === 'O' ? 'animate-pulse' : ''}
      `}>
        {getCellContent()}
      </div>
    </button>
  );
};

export default GameCell;