import React from 'react';
import GameCell from './GameCell';
import type { GameBoardProps } from '../../types';

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  winningLine = [],
  disabled = false,
}) => {
 
  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-inner">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {board.map((value, index) => (
          <GameCell
            key={index}
            value={value}
            position={index}
            onClick={onCellClick}
            isWinning={winningLine.includes(index)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;