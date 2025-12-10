// Binary encoding scheme for Tic Tac Toe board:
// Each cell: 00 = empty, 01 = X, 10 = O
// 9 cells stored in 3 bytes (24 bits)

export const encodeBoard = (board: ('X' | 'O' | null)[]): number[] => {
  const encoded = [0, 0, 0]; // 3 bytes
  
  for (let i = 0; i < 9; i++) {
    const cell = board[i];
    const byteIndex = Math.floor(i / 4); // 0, 1, or 2
    const bitOffset = (i % 4) * 2; // 0, 2, 4, or 6
    
    let value = 0;
    if (cell === 'X') value = 1;
    else if (cell === 'O') value = 2;
    
    encoded[byteIndex] |= value << bitOffset;
  }
  
  return encoded;
};

export const decodeBoard = (encoded: number[]): ('X' | 'O' | null)[] => {
  const board: ('X' | 'O' | null)[] = Array(9).fill(null);
  
  for (let i = 0; i < 9; i++) {
    const byteIndex = Math.floor(i / 4);
    const bitOffset = (i % 4) * 2;
    const value = (encoded[byteIndex] >> bitOffset) & 3;
    
    if (value === 1) board[i] = 'X';
    else if (value === 2) board[i] = 'O';
  }
  
  return board;
};

export const checkWinner = (board: ('X' | 'O' | null)[]): 'X' | 'O' | null => {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];
  
  for (const [a, b, c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  
  return null;
};

export const getInitialBoard = (): ('X' | 'O' | null)[] => {
  return Array(9).fill(null);
};